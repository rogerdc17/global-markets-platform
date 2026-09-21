from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models import AnalyzeRequest, AnalyzeResponse
from app.services.orchestrator import analyze

app = FastAPI(
    title="Bharat Markets TradingAgent",
    version="0.1.0",
    description="Private research and trading decision-support backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.get("/health")
async def health():
    return {
        "ok": True,
        "claudeConfigured": bool(settings.anthropic_api_key),
        "marketConfigured": bool(settings.market_api_base_url),
        "model": settings.claude_model,
    }

@app.post("/agent/analyze", response_model=AnalyzeResponse)
async def agent_analyze(request: AnalyzeRequest):
    try:
        return await analyze(request)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
