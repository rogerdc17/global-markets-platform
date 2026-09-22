import asyncio
from datetime import datetime, timezone

import httpx
import yfinance as yf

from app.config import settings
from app.models import Candle


def _normalize_yahoo_symbol(symbol: str) -> str:
    raw = symbol.strip().upper()
    if "." in raw or raw.startswith("^"):
        return raw
    # DP Alpha currently focuses on NSE-listed Indian equities.
    return f"{raw}.NS"


def _yfinance_context(symbol: str) -> tuple[dict, list[Candle]]:
    yahoo_symbol = _normalize_yahoo_symbol(symbol)
    ticker = yf.Ticker(yahoo_symbol)

    history = ticker.history(period="3mo", interval="1d", auto_adjust=False)
    if history is None or history.empty:
        return {
            "available": False,
            "symbol": symbol,
            "provider": "YAHOO_FINANCE_FALLBACK",
            "mode": "research_delayed",
            "reason": "No Yahoo Finance data returned",
        }, []

    rows = history.dropna(subset=["Close"])
    if rows.empty:
        return {
            "available": False,
            "symbol": symbol,
            "provider": "YAHOO_FINANCE_FALLBACK",
            "mode": "research_delayed",
            "reason": "No usable Yahoo Finance close data returned",
        }, []

    candles: list[Candle] = []
    for index, row in rows.iterrows():
        candles.append(
            Candle(
                timestamp=index.isoformat(),
                open=float(row["Open"]),
                high=float(row["High"]),
                low=float(row["Low"]),
                close=float(row["Close"]),
                volume=float(row["Volume"]) if row.get("Volume") is not None else None,
            )
        )

    last = rows.iloc[-1]
    previous_close = float(rows.iloc[-2]["Close"]) if len(rows) > 1 else float(last["Close"])
    price = float(last["Close"])
    change = price - previous_close
    change_pct = (change / previous_close * 100) if previous_close else 0.0

    quote = {
        "symbol": symbol.upper(),
        "providerSymbol": yahoo_symbol,
        "price": round(price, 4),
        "previousClose": round(previous_close, 4),
        "change": round(change, 4),
        "changePercent": round(change_pct, 4),
        "currency": "INR",
    }

    return {
        "available": True,
        "provider": "YAHOO_FINANCE_FALLBACK",
        "mode": "research_delayed",
        "as_of": datetime.now(timezone.utc).isoformat(),
        "market_status": "unknown",
        "quote": quote,
        "provenance": {
            "source": "Yahoo Finance via yfinance",
            "authoritative_realtime": False,
            "purpose": "research fallback",
        },
    }, candles


async def _gateway_context(symbol: str) -> tuple[dict, list[Candle]]:
    base = settings.market_api_base_url.rstrip("/")
    async with httpx.AsyncClient(timeout=15.0) as client:
        snapshot_response = await client.get(f"{base}/market/snapshot")
        snapshot_response.raise_for_status()
        snapshot = snapshot_response.json()

        quote = next(
            (item for item in snapshot.get("stocks", []) if item.get("symbol", "").upper() == symbol.upper()),
            None,
        )

        candles: list[Candle] = []
        try:
            history_response = await client.get(
                f"{base}/market/history/{symbol.upper()}",
                params={"range": "3M"},
            )
            if history_response.is_success:
                payload = history_response.json()
                candles = [Candle.model_validate(item) for item in payload.get("candles", [])]
        except Exception:
            pass

    return {
        "available": bool(quote),
        "provider": snapshot.get("provider"),
        "mode": snapshot.get("mode"),
        "as_of": snapshot.get("asOf"),
        "market_status": snapshot.get("marketStatus"),
        "quote": quote,
        "provenance": {
            "source": snapshot.get("provider"),
            "authoritative_realtime": snapshot.get("mode") == "live",
            "purpose": "configured market gateway",
        },
    }, candles


async def get_market_context(symbol: str) -> tuple[dict, list[Candle]]:
    if settings.market_api_base_url:
        try:
            market, candles = await _gateway_context(symbol)
            if market.get("available"):
                return market, candles
        except Exception:
            if not settings.market_yfinance_fallback:
                raise

    if settings.market_yfinance_fallback:
        try:
            return await asyncio.to_thread(_yfinance_context, symbol)
        except Exception as exc:
            return {
                "available": False,
                "symbol": symbol,
                "provider": "YAHOO_FINANCE_FALLBACK",
                "mode": "research_delayed",
                "reason": f"Yahoo research fallback failed: {type(exc).__name__}",
            }, []

    return {
        "available": False,
        "symbol": symbol,
        "reason": "No market provider configured",
    }, []
