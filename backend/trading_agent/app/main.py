from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.auth import LoginRequest, LoginResponse, UserContext, authenticate, require_internal, require_user
from app.client_store import add_client, add_research_note, add_trade, get_client, list_clients, list_research_notes, list_trades, portfolio_summary
from app.config import settings
from app.database import backup_database, init_db
from app.models import AnalyzeRequest, AnalyzeResponse
from app.services.orchestrator import analyze

app = FastAPI(
    title="DP Alpha Research & Records API",
    version="0.3.0",
    description="Private research, reporting and portfolio record-keeping backend. No trade execution.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

class ClientCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    notes: str = Field(default="", max_length=1000)

class ResearchNoteRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=32)
    title: str = Field(min_length=1, max_length=240)
    thesis: str = Field(min_length=1, max_length=5000)
    status: str = Field(default="Watching", max_length=64)

class TradeRecordRequest(BaseModel):
    client_id: str
    symbol: str = Field(min_length=1, max_length=32)
    side: Literal["BUY", "SELL"]
    quantity: float = Field(gt=0)
    price: float = Field(gt=0)
    fees: float = Field(default=0, ge=0)
    executed_at: str
    strategy: str = Field(default="", max_length=120)
    note: str = Field(default="", max_length=2000)
    research_run_id: str | None = None

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/health")
async def health():
    return {
        "ok": True,
        "authConfigured": settings.auth_configured,
        "claudeConfigured": bool(settings.anthropic_api_key),
        "marketConfigured": bool(settings.market_api_base_url),
        "model": settings.claude_model,
        "executionEnabled": False,
        "storage": "sqlite",
        "selfHosted": True,
    }

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    return authenticate(request.username, request.password)

@app.get("/auth/me")
async def me(user: UserContext = Depends(require_user)):
    return {
        "authenticated": True,
        "username": user.username,
        "role": user.role,
        "client_id": user.client_id,
        "display_name": user.display_name,
    }

@app.get("/clients")
async def clients(user: UserContext = Depends(require_user)):
    require_internal(user)
    return {"clients": [client.model_dump() for client in list_clients()]}

@app.post("/clients")
async def create_client(request: ClientCreateRequest, user: UserContext = Depends(require_user)):
    require_internal(user)
    return add_client(request.name, request.notes, created_by=user.username).model_dump()

@app.get("/clients/{client_id}/portfolio")
async def client_portfolio(client_id: str, user: UserContext = Depends(require_user)):
    if user.role == "client" and user.client_id != client_id:
        raise HTTPException(status_code=403, detail="You can only view your own portfolio.")
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    return {
        "client": client.model_dump(),
        "summary": portfolio_summary(client_id),
        "trades": [trade.model_dump() for trade in list_trades(client_id)],
    }

@app.get("/portfolio/me")
async def my_portfolio(user: UserContext = Depends(require_user)):
    if user.role != "client" or not user.client_id:
        raise HTTPException(status_code=403, detail="Client access required.")
    client = get_client(user.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    return {
        "client": client.model_dump(),
        "summary": portfolio_summary(user.client_id),
        "trades": [trade.model_dump() for trade in list_trades(user.client_id)],
    }

@app.post("/records/trades")
async def record_trade(request: TradeRecordRequest, user: UserContext = Depends(require_user)):
    require_internal(user)
    if not get_client(request.client_id):
        raise HTTPException(status_code=404, detail="Client not found.")
    trade = add_trade(
        client_id=request.client_id,
        symbol=request.symbol,
        side=request.side,
        quantity=request.quantity,
        price=request.price,
        fees=request.fees,
        executed_at=request.executed_at,
        strategy=request.strategy,
        note=request.note,
        research_run_id=request.research_run_id,
        created_by=user.username,
    )
    return trade.model_dump()

@app.get("/research")
async def research_notes(user: UserContext = Depends(require_user)):
    require_internal(user)
    return {"notes": [note.model_dump() for note in list_research_notes()]}

@app.post("/research")
async def create_research_note(request: ResearchNoteRequest, user: UserContext = Depends(require_user)):
    require_internal(user)
    return add_research_note(
        symbol=request.symbol,
        title=request.title,
        thesis=request.thesis,
        status=request.status,
        created_by=user.username,
    ).model_dump()

@app.post("/admin/backup")
async def create_backup(user: UserContext = Depends(require_user)):
    require_internal(user)
    path = backup_database()
    return {"ok": True, "backup": path.name}

@app.post("/agent/analyze", response_model=AnalyzeResponse)
async def agent_analyze(
    request: AnalyzeRequest,
    user: UserContext = Depends(require_user),
):
    require_internal(user)
    try:
        return await analyze(request)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
