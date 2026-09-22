from uuid import uuid4
from statistics import mean
from app.models import AnalyzeRequest, AnalyzeResponse, AgentView, StageResult, TradePlan
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
from app.config import settings

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


def _deterministic_fallback(
    symbol: str,
    request: AnalyzeRequest,
    market: dict,
    technicals: dict,
    risk: dict,
) -> AnalyzeResponse:
    evidence: list[str] = []
    stance = "neutral"

    if technicals.get("available"):
        last = technicals.get("last_close")
        sma20 = technicals.get("sma20")
        sma50 = technicals.get("sma50")
        rsi = technicals.get("rsi14")

        bull_points = 0
        bear_points = 0
        if isinstance(last, (int, float)) and isinstance(sma20, (int, float)):
            if last > sma20:
                bull_points += 1
                evidence.append("Last close is above SMA20.")
            elif last < sma20:
                bear_points += 1
                evidence.append("Last close is below SMA20.")
        if isinstance(sma20, (int, float)) and isinstance(sma50, (int, float)):
            if sma20 > sma50:
                bull_points += 1
                evidence.append("SMA20 is above SMA50.")
            elif sma20 < sma50:
                bear_points += 1
                evidence.append("SMA20 is below SMA50.")
        if isinstance(rsi, (int, float)):
            evidence.append(f"RSI14 is {rsi:.1f}.")
            if rsi > 70 or rsi < 30:
                evidence.append("RSI is in an extreme zone, which increases uncertainty.")

        if bull_points >= 2 and bull_points > bear_points:
            stance = "bullish"
        elif bear_points >= 2 and bear_points > bull_points:
            stance = "bearish"
        elif bull_points or bear_points:
            stance = "mixed"

    technical = AgentView(
        name="Technical Analyst",
        stance=stance,
        confidence=55 if technicals.get("available") else 20,
        summary="Deterministic technical assessment generated without an LLM.",
        evidence=evidence[:5] or ["Historical technical data was unavailable."],
    )
    unavailable = [
        AgentView(
            name="Fundamental Analyst",
            stance="neutral",
            confidence=10,
            summary="Fundamental analysis was not run because the AI research provider is not configured.",
            evidence=["No LLM/web-research provider was available for this run."],
        ),
        AgentView(
            name="News/Sentiment Analyst",
            stance="neutral",
            confidence=10,
            summary="News and sentiment analysis was not run because the AI research provider is not configured.",
            evidence=["No current web-research provider was available for this run."],
        ),
        AgentView(
            name="Macro Analyst",
            stance="neutral",
            confidence=10,
            summary="Macro analysis was not run because the AI research provider is not configured.",
            evidence=["No AI macro-research provider was available for this run."],
        ),
    ]
    analysts = [technical, *unavailable]

    bull = StageResult(
        stage="Bull Researcher",
        stance="bullish",
        confidence=25,
        summary="Fallback mode cannot build a sourced bullish thesis; only deterministic market context is available.",
        evidence=evidence[:3],
        objections=["Fundamental, news and macro evidence are unavailable."],
    )
    bear = StageResult(
        stage="Bear Researcher",
        stance="bearish",
        confidence=25,
        summary="Fallback mode cannot build a sourced bearish thesis; missing research evidence limits conviction.",
        evidence=evidence[:3],
        objections=["A directional conclusion from technicals alone may be incomplete."],
    )
    trader = StageResult(
        stage="Trader Agent",
        stance=stance,
        confidence=30,
        summary="No AI synthesis was performed. The system is preserving the deterministic technical signal only.",
        evidence=evidence[:4],
        objections=["Current fundamentals, news, sentiment and macro context are unavailable."],
    )
    risk_stage = StageResult(
        stage="Risk Committee",
        stance="neutral",
        confidence=60,
        summary="Risk controls remain deterministic; conviction is capped because the research provider is unavailable.",
        evidence=[f"{k}: {v}" for k, v in risk.items() if v is not None][:4],
        objections=["Do not treat fallback mode as a complete research committee."],
    )
    portfolio_stage = StageResult(
        stage="Portfolio Manager",
        stance="neutral",
        confidence=20,
        summary="Wait for a fully sourced research run before using the agent output as a decision-support thesis.",
        evidence=evidence[:3],
        objections=["Claude/web research is not configured."],
    )

    decision = "hold_or_wait" if technicals.get("available") else "insufficient_data"
    plan = TradePlan(
        stance="neutral",
        confidence=20,
        thesis="DP Alpha is running in deterministic fallback mode. Technical and risk calculations are available, but AI/web research is not configured, so no full investment thesis was produced.",
        entry_zone=None,
        invalidation=None,
        targets=[],
        risk_reward=None,
        position_size=str(risk.get("suggested_position_size")) if risk.get("suggested_position_size") is not None else None,
        portfolio_note="Configure ANTHROPIC_API_KEY to enable the full analyst committee and web research.",
        decision=decision,
    )

    stages = [bull, bear, trader, risk_stage, portfolio_stage]
    confidence = confidence_breakdown(
        market=market,
        technicals=technicals,
        sources=[],
        analysts=analysts,
        stages=stages,
    )
    confidence["calibrated_confidence"] = min(confidence["calibrated_confidence"], 25.0)
    plan.confidence = min(plan.confidence, int(confidence["calibrated_confidence"]))

    enriched_market = dict(market)
    enriched_market["analysis_engine"] = "deterministic_fallback"

    return AnalyzeResponse(
        run_id=str(uuid4()),
        symbol=symbol,
        horizon=request.horizon,
        mode=request.mode,
        market=enriched_market,
        technicals=technicals,
        risk=risk,
        agents=analysts,
        stages=stages,
        confidence_breakdown=confidence,
        plan=plan,
        sources=[],
        caveats=[
            "Claude is not configured; this run used deterministic fallback mode.",
            "No current web research, fundamentals, news/sentiment or macro synthesis was performed.",
            "Yahoo/yfinance data, when used, is a research fallback and is not exchange-authoritative real-time data.",
        ],
    )

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

    if not settings.anthropic_api_key:
        return _deterministic_fallback(
            symbol=symbol,
            request=request,
            market=market,
            technicals=technicals,
            risk=risk,
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
