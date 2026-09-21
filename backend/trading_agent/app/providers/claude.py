import json
import re
from anthropic import Anthropic
from app.config import settings
from app.models import AgentView, EvidenceSource, StageResult, TradePlan

SYSTEM = """You are the reasoning engine inside a professional trading decision-support system.
You do not place trades. You analyze evidence for a human trader.
Be skeptical, source-aware, numerically disciplined, and explicit about uncertainty.
Never invent market data, filings, news, prices, indicators, targets, citations, or facts.
Prefer primary sources (exchange filings, regulator, company investor relations) and high-quality financial reporting.
Separate facts from inference.
Do not override deterministic calculations supplied by the system.
Return valid JSON only when instructed to return JSON."""

def _client() -> Anthropic:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")
    return Anthropic(api_key=settings.anthropic_api_key)

def _text(message) -> str:
    parts: list[str] = []
    for block in message.content:
        if getattr(block, "type", None) == "text":
            parts.append(block.text)
    return "\n".join(parts)

def _json(text: str) -> dict:
    cleaned = text.strip()
    cleaned = re.sub(r"^\x60\x60\x60(?:json)?\\s*", "", cleaned)
    cleaned = re.sub(r"\\s*\x60\x60\x60$", "", cleaned)
    return json.loads(cleaned)

def research(symbol: str, horizon: str, market: dict, technicals: dict):
    prompt = f"""
Research {symbol} for a trader with a {horizon} horizon.

Use current web search. Prioritize:
1. official exchange/regulatory/company filings,
2. latest earnings/results and investor material,
3. credible financial news,
4. sector/macro developments that can materially affect this symbol.

Known deterministic market context:
{json.dumps(market, default=str)}

Known deterministic technical context:
{json.dumps(technicals, default=str)}

Return JSON only:
{{
  "research_summary": "...",
  "sources": [
    {{
      "title": "...",
      "url": "https://...",
      "publisher": "...",
      "published_at": null,
      "source_type": "filing|company|regulator|news|research|web",
      "relevance": "why this matters"
    }}
  ]
}}

Do not include a source unless you actually found it.
"""
    message = _client().messages.create(
        model=settings.claude_model,
        max_tokens=5000,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
        tools=[{"type": "web_search_20260318", "name": "web_search", "max_uses": 10}],
    )
    payload = _json(_text(message))
    sources = [EvidenceSource.model_validate(item) for item in payload.get("sources", [])][:25]
    return sources, payload.get("research_summary", "")

def analyst_team(symbol: str, horizon: str, market: dict, technicals: dict,
                 research_summary: str, sources: list[EvidenceSource]) -> list[AgentView]:
    prompt = f"""
Act as a specialist analyst team for {symbol}, horizon={horizon}.

MARKET:
{json.dumps(market, default=str)}

TECHNICALS:
{json.dumps(technicals, default=str)}

RESEARCH:
{research_summary}

SOURCES:
{json.dumps([s.model_dump() for s in sources], default=str)}

Return JSON only with key "agents". Include exactly:
- Technical Analyst
- Fundamental Analyst
- News/Sentiment Analyst
- Macro Analyst

Each agent must include:
name, stance (bullish|neutral|bearish|mixed), confidence 0-100,
summary, evidence[].

Rules:
- Do not fabricate unavailable fundamentals or macro data.
- If evidence is weak, lower confidence.
- Technical Analyst must use deterministic technicals only.
"""
    message = _client().messages.create(
        model=settings.claude_model,
        max_tokens=4500,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    payload = _json(_text(message))
    return [AgentView.model_validate(item) for item in payload.get("agents", [])]

def debate(symbol: str, analysts: list[AgentView], research_summary: str) -> list[StageResult]:
    prompt = f"""
Run a structured bull-vs-bear debate for {symbol}.

ANALYST VIEWS:
{json.dumps([a.model_dump() for a in analysts], default=str)}

RESEARCH SUMMARY:
{research_summary}

Return JSON only with key "stages" containing exactly two items:
1. Bull Researcher
2. Bear Researcher

Each item:
stage, stance, confidence, summary, evidence[], objections[].

The bull must state the strongest upside case and answer the bear's likely objections.
The bear must state the strongest downside/failure case and challenge weak evidence.
Do not invent new facts.
"""
    message = _client().messages.create(
        model=settings.claude_model,
        max_tokens=4200,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    payload = _json(_text(message))
    return [StageResult.model_validate(item) for item in payload.get("stages", [])]

def trader_stage(symbol: str, horizon: str, analysts: list[AgentView],
                 debate_stages: list[StageResult], market: dict,
                 technicals: dict) -> StageResult:
    prompt = f"""
Act as the Trader Agent for {symbol}, horizon={horizon}.

ANALYSTS:
{json.dumps([a.model_dump() for a in analysts], default=str)}

DEBATE:
{json.dumps([s.model_dump() for s in debate_stages], default=str)}

MARKET:
{json.dumps(market, default=str)}

TECHNICALS:
{json.dumps(technicals, default=str)}

Return JSON only:
{{
  "stage": "Trader Agent",
  "stance": "bullish|neutral|bearish|mixed",
  "confidence": 0,
  "summary": "...",
  "evidence": ["..."],
  "objections": ["..."]
}}

The trader synthesizes, but does not decide position size or override risk controls.
"""
    message = _client().messages.create(
        model=settings.claude_model,
        max_tokens=2500,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    return StageResult.model_validate(_json(_text(message)))

def risk_committee(symbol: str, trader: StageResult, risk: dict,
                   market: dict, technicals: dict) -> StageResult:
    prompt = f"""
Act as the Risk Committee for {symbol}.

TRADER VIEW:
{json.dumps(trader.model_dump(), default=str)}

DETERMINISTIC RISK:
{json.dumps(risk, default=str)}

MARKET:
{json.dumps(market, default=str)}

TECHNICALS:
{json.dumps(technicals, default=str)}

Return JSON only:
{{
  "stage": "Risk Committee",
  "stance": "bullish|neutral|bearish|mixed",
  "confidence": 0,
  "summary": "...",
  "evidence": ["..."],
  "objections": ["..."]
}}

Rules:
- Deterministic risk values are authoritative.
- Highlight concentration, volatility, missing stop, insufficient data, or poor asymmetry.
- You may reduce conviction; do not increase it merely because the trader is confident.
"""
    message = _client().messages.create(
        model=settings.claude_model,
        max_tokens=2500,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    return StageResult.model_validate(_json(_text(message)))

def portfolio_manager(symbol: str, horizon: str, trader: StageResult,
                      risk_stage: StageResult, risk: dict,
                      analysts: list[AgentView], debate_stages: list[StageResult],
                      sources: list[EvidenceSource]) -> tuple[StageResult, TradePlan]:
    prompt = f"""
Act as the Portfolio Manager for {symbol}, horizon={horizon}.

TRADER:
{json.dumps(trader.model_dump(), default=str)}

RISK COMMITTEE:
{json.dumps(risk_stage.model_dump(), default=str)}

RISK DATA:
{json.dumps(risk, default=str)}

ANALYSTS:
{json.dumps([a.model_dump() for a in analysts], default=str)}

DEBATE:
{json.dumps([s.model_dump() for s in debate_stages], default=str)}

SOURCE COUNT:
{len(sources)}

Return JSON only:
{{
  "stage": {{
    "stage": "Portfolio Manager",
    "stance": "bullish|neutral|bearish|mixed",
    "confidence": 0,
    "summary": "...",
    "evidence": ["..."],
    "objections": ["..."]
  }},
  "plan": {{
    "stance": "bullish|neutral|bearish|mixed",
    "confidence": 0,
    "thesis": "...",
    "entry_zone": null,
    "invalidation": null,
    "targets": [],
    "risk_reward": null,
    "position_size": null,
    "portfolio_note": null,
    "decision": "consider_long|hold_or_wait|consider_short|avoid|insufficient_data"
  }}
}}

Rules:
- Risk Committee can veto the trade.
- Missing data must reduce confidence.
- Do not invent numeric levels if the evidence does not support them.
- The final decision is decision support for a human trader, not an order.
"""
    message = _client().messages.create(
        model=settings.claude_model,
        max_tokens=3500,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    payload = _json(_text(message))
    return (
        StageResult.model_validate(payload.get("stage", {})),
        TradePlan.model_validate(payload.get("plan", {})),
    )
