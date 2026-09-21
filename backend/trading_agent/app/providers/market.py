import httpx
from app.config import settings
from app.models import Candle

async def get_market_context(symbol: str) -> tuple[dict, list[Candle]]:
    if not settings.market_api_base_url:
        return {"available": False, "symbol": symbol, "reason": "MARKET_API_BASE_URL not configured"}, []

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
    }, candles
