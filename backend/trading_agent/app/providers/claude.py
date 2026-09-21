import json
import re
from anthropic import Anthropic
from app.config import settings
from app.models import AgentView, EvidenceSource, TradePlan

SYSTEM = """You are the research and synthesis engine inside a professional trading decision-support system.
You do not place trades. You analyze evidence for a human trader.
Be skeptical, source-aware, numerically disciplined, and explicit about uncertainty.
Never invent market data, filings, news, prices, indicators, targets, citations, or facts.
Prefer primary sources (exchange filings, regulator, company investor relations) and high-quality financial reporting.
Separate facts from inference.
A high confidence score requires multiple independent, fresh, credible sources and agreement with deterministic market/risk inputs.
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

Use current web search. Prioritize official exchange/regulatory/company filings,
latest earnings/results and investor material, credible financial news, and
sector/macro developments that can materially affect this symbol.

Known deterministic market context:
{json.dumps(market, default=str)}

Known deterministic technical context:
{json.dumps(technicals, default=str)}

Return JSON only with keys research_summary and sources.
Each source must include title, url, publisher, published_at, source_type, relevance.
Do not include a source unless you actually found it.
"""
    message = _client().messages.create(
        model=settings.claude_model,
        max_tokens=5000,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
        tools=[{"type": "web_search_20260318", "name": "web_search", "max_uses": 8}],
    )
    payload = _json(_text(message))
    sources = [EvidenceSource.model_validate(item) for item in payload.get("sources", [])][:20]
    return sources, payload.get("research_summary", "")

def synthesize(symbol: str, horizon: str, mode: str, market: dict,
               technicals: dict, risk: dict, research_summary: str,
               sources: list[EvidenceSource]):
    prompt = f"""
Analyze {symbol} for a {horizon} trader using mode={mode}.

DETERMINISTIC MARKET DATA:
{json.dumps(market, default=str)}

DETERMINISTIC TECHNICALS:
{json.dumps(technicals, default=str)}

DETERMINISTIC RISK/PORTFOLIO:
{json.dumps(risk, default=str)}

WEB RESEARCH SUMMARY:
{research_summary}

VERIFIED SOURCES:
{json.dumps([s.model_dump() for s in sources], default=str)}

Run an internal committee with Technical Analyst, Fundamental Analyst,
News/Sentiment Analyst, Bull Researcher, Bear Researcher, Risk Manager,
and Portfolio Analyst.

Do not override deterministic numbers. If data is missing, say so.
Do not create false precision. Return valid JSON only with:
agents, plan, caveats.

Each agent needs name, stance, confidence, summary, evidence.
Plan needs stance, confidence, thesis, entry_zone, invalidation, targets,
risk_reward, position_size, portfolio_note.
"""
    message = _client().messages.create(
        model=settings.claude_model,
        max_tokens=6000,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    payload = _json(_text(message))
    agents = [AgentView.model_validate(item) for item in payload.get("agents", [])]
    plan = TradePlan.model_validate(payload.get("plan", {}))
    caveats = [str(item) for item in payload.get("caveats", [])]
    return agents, plan, caveats
