from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.auth import LoginRequest, LoginResponse, authenticate, require_user
from app.config import settings
from app.models import AnalyzeRequest, AnalyzeResponse
from app.services.orchestrator import analyze

app = FastAPI(
    title="DP Alpha TradingAgent",
    version="0.2.0",
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
        "authConfigured": settings.auth_configured,
        "claudeConfigured": bool(settings.anthropic_api_key),
        "marketConfigured": bool(settings.market_api_base_url),
        "model": settings.claude_model,
    }

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    return authenticate(request.username, request.password)

@app.get("/auth/me")
async def me(username: str = Depends(require_user)):
    return {"authenticated": True, "username": username}

@app.post("/agent/analyze", response_model=AnalyzeResponse)
async def agent_analyze(
    request: AnalyzeRequest,
    username: str = Depends(require_user),
):
    try:
        return await analyze(request)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
