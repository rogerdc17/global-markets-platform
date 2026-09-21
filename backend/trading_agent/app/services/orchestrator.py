from uuid import uuid4
from statistics import mean
from app.models import AnalyzeRequest, AnalyzeResponse
from app.providers.market import get_market_context
from app.providers.claude import (
    research,
    analyst_team,
    debate,
    trader_stage,
    risk_committee,
    portfolio_manager,
)
from app.services.indicators import calculate_technicals
from app.services.risk import calculate_risk

def confidence_breakdown(market: dict, technicals: dict, sources: list,
                         analysts: list, stages: list) -> dict:
    data_quality = 0
    if market.get("available"):
        data_quality += 35
    if technicals.get("available"):
        data_quality += 35
    if len(sources) >= 8:
        data_quality += 30
    elif len(sources) >= 4:
        data_quality += 20
    elif len(sources) >= 1:
        data_quality += 10

    analyst_scores = [a.confidence for a in analysts]
    stage_scores = [s.confidence for s in stages]
    model_confidence = round(mean(analyst_scores + stage_scores), 1) if (analyst_scores or stage_scores) else 0

    stances = [a.stance for a in analysts] + [s.stance for s in stages]
    directional = [s for s in stances if s in ("bullish", "bearish")]
    if not directional:
        agreement = 50
    else:
        bull = directional.count("bullish")
        bear = directional.count("bearish")
        agreement = round(max(bull, bear) / len(directional) * 100, 1)

    source_quality = min(100, len(sources) * 8)

    calibrated = round(
        0.35 * data_quality +
        0.25 * source_quality +
        0.20 * agreement +
        0.20 * model_confidence,
        1,
    )

    return {
        "data_quality": round(data_quality, 1),
        "source_coverage": round(source_quality, 1),
        "agent_agreement": agreement,
        "model_confidence": model_confidence,
        "calibrated_confidence": calibrated,
    }

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

    analysts = analyst_team(
        symbol=symbol,
        horizon=request.horizon,
        market=market,
        technicals=technicals,
        research_summary=research_summary,
        sources=sources,
    )

    debate_stages = debate(
        symbol=symbol,
        analysts=analysts,
        research_summary=research_summary,
    )

    trader = trader_stage(
        symbol=symbol,
        horizon=request.horizon,
        analysts=analysts,
        debate_stages=debate_stages,
        market=market,
        technicals=technicals,
    )

    risk_stage = risk_committee(
        symbol=symbol,
        trader=trader,
        risk=risk,
        market=market,
        technicals=technicals,
    )

    portfolio_stage, plan = portfolio_manager(
        symbol=symbol,
        horizon=request.horizon,
        trader=trader,
        risk_stage=risk_stage,
        risk=risk,
        analysts=analysts,
        debate_stages=debate_stages,
        sources=sources,
    )

    stages = [*debate_stages, trader, risk_stage, portfolio_stage]
    confidence = confidence_breakdown(
        market=market,
        technicals=technicals,
        sources=sources,
        analysts=analysts,
        stages=stages,
    )

    plan.confidence = min(plan.confidence, int(confidence["calibrated_confidence"]))

    caveats: list[str] = []
    if not market.get("available"):
        caveats.append("Live quote was unavailable; market-specific conclusions are incomplete.")
    if not technicals.get("available"):
        caveats.append("Historical candles were unavailable, so deterministic indicators were not computed.")
    if len(sources) < 4:
        caveats.append("Research source coverage was limited; confidence has been reduced.")
    if confidence["agent_agreement"] < 60:
        caveats.append("Agent disagreement is elevated; the final view should be treated cautiously.")
    if request.stop_price is None:
        caveats.append("No explicit stop price was supplied, so deterministic position sizing is incomplete.")

    return AnalyzeResponse(
        run_id=str(uuid4()),
        symbol=symbol,
        horizon=request.horizon,
        mode=request.mode,
        market=market,
        technicals=technicals,
        risk=risk,
        agents=analysts,
        stages=stages,
        confidence_breakdown=confidence,
        plan=plan,
        sources=sources,
        caveats=caveats,
    )
