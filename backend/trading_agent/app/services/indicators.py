from app.models import Candle

def _sma(values: list[float], period: int) -> float | None:
    return None if len(values) < period else sum(values[-period:]) / period

def _ema(values: list[float], period: int) -> list[float]:
    if not values:
        return []
    k = 2 / (period + 1)
    output = [values[0]]
    for value in values[1:]:
        output.append(value * k + output[-1] * (1 - k))
    return output

def _rsi(values: list[float], period: int = 14) -> float | None:
    if len(values) <= period:
        return None
    gains, losses = [], []
    for previous, current in zip(values[-period-1:-1], values[-period:]):
        delta = current - previous
        gains.append(max(delta, 0))
        losses.append(max(-delta, 0))
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def _atr(candles: list[Candle], period: int = 14) -> float | None:
    if len(candles) <= period:
        return None
    trs: list[float] = []
    subset = candles[-period-1:]
    for previous, current in zip(subset[:-1], subset[1:]):
        trs.append(max(
            current.high - current.low,
            abs(current.high - previous.close),
            abs(current.low - previous.close),
        ))
    return sum(trs) / len(trs)

def calculate_technicals(candles: list[Candle]) -> dict:
    if not candles:
        return {"available": False, "reason": "No historical candles supplied by market provider."}
    closes = [c.close for c in candles]
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    macd = ema12[-1] - ema26[-1] if len(ema26) >= 26 else None
    result = {
        "available": True,
        "last_close": closes[-1],
        "sma20": _sma(closes, 20),
        "sma50": _sma(closes, 50),
        "rsi14": _rsi(closes),
        "macd": macd,
        "atr14": _atr(candles),
        "periods": len(candles),
    }
    return {k: round(v, 4) if isinstance(v, float) else v for k, v in result.items()}
