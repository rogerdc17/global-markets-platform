from uuid import uuid4
from app.models import AnalyzeRequest, AnalyzeResponse
from app.providers.market import get_market_context
from app.providers.claude import research, synthesize
from app.services.indicators import calculate_technicals
from app.services.risk import calculate_risk

async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    symbol = request.symbol.strip().upper()

    market, provider_candles = await get_market_context(symbol)
    candles = request.candles or provider_candles
    technicals = calculate_technicals(candles)

    quote = market.get("quote") or {}
    current_price = quote.get("price")
    risk = calculate_risk(
        symbol=symbol,
        current_price=current_price,
        account_size=request.account_size,
        max_risk_pct=request.max_risk_pct,
        stop_price=request.stop_price,
        portfolio=request.portfolio,
    )

    sources, research_summary = research(
        symbol=symbol,
        horizon=request.horizon,
        market=market,
        technicals=technicals,
    )

    agents, plan, caveats = synthesize(
        symbol=symbol,
        horizon=request.horizon,
        mode=request.mode,
        market=market,
        technicals=technicals,
        risk=risk,
        research_summary=research_summary,
        sources=sources,
    )

    if not market.get("available"):
        caveats.insert(0, "Live quote was unavailable; market-specific conclusions are incomplete.")
    if not technicals.get("available"):
        caveats.append("Historical candles were unavailable, so deterministic indicators were not computed.")

    return AnalyzeResponse(
        run_id=str(uuid4()),
        symbol=symbol,
        horizon=request.horizon,
        mode=request.mode,
        market=market,
        technicals=technicals,
        risk=risk,
        agents=agents,
        plan=plan,
        sources=sources,
        caveats=caveats,
    )
