from typing import Literal
from pydantic import BaseModel, Field

Stance = Literal["bullish", "neutral", "bearish", "mixed"]

class Candle(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float | None = None

class Position(BaseModel):
    symbol: str
    side: Literal["BUY", "SELL"] = "BUY"
    quantity: float = Field(gt=0)
    entry_price: float = Field(gt=0)
    current_price: float | None = None

class AnalyzeRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=32)
    horizon: Literal["intraday", "swing", "position", "investment"] = "swing"
    mode: Literal["quick", "deep", "committee"] = "committee"
    account_size: float | None = Field(default=None, gt=0)
    max_risk_pct: float = Field(default=1.0, gt=0, le=10)
    stop_price: float | None = Field(default=None, gt=0)
    portfolio: list[Position] = []
    candles: list[Candle] = []

class EvidenceSource(BaseModel):
    title: str
    url: str
    publisher: str | None = None
    published_at: str | None = None
    source_type: str = "web"
    relevance: str = ""

class AgentView(BaseModel):
    name: str
    stance: Stance
    confidence: int = Field(ge=0, le=100)
    summary: str
    evidence: list[str] = []

class StageResult(BaseModel):
    stage: str
    stance: Stance
    confidence: int = Field(ge=0, le=100)
    summary: str
    evidence: list[str] = []
    objections: list[str] = []

class TradePlan(BaseModel):
    stance: Stance
    confidence: int = Field(ge=0, le=100)
    thesis: str
    entry_zone: str | None = None
    invalidation: str | None = None
    targets: list[str] = []
    risk_reward: str | None = None
    position_size: str | None = None
    portfolio_note: str | None = None
    decision: Literal[
        "consider_long",
        "hold_or_wait",
        "consider_short",
        "avoid",
        "insufficient_data"
    ] = "insufficient_data"

class AnalyzeResponse(BaseModel):
    run_id: str
    symbol: str
    horizon: str
    mode: str
    market: dict
    technicals: dict
    risk: dict
    agents: list[AgentView]
    stages: list[StageResult]
    confidence_breakdown: dict
    plan: TradePlan
    sources: list[EvidenceSource]
    caveats: list[str]
