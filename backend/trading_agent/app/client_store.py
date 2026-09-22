import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from uuid import uuid4

from pydantic import BaseModel, Field
from app.config import settings

_lock = Lock()

class ClientRecord(BaseModel):
    id: str
    name: str
    notes: str = ""

class RecordedTrade(BaseModel):
    id: str
    client_id: str
    symbol: str
    side: str
    quantity: float = Field(gt=0)
    price: float = Field(gt=0)
    fees: float = Field(default=0, ge=0)
    executed_at: str
    strategy: str = ""
    note: str = ""
    research_run_id: str | None = None
    created_by: str
    created_at: str

def _path() -> Path:
    path = Path(settings.dp_data_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path

def _default() -> dict:
    return {
        "clients": [
            {"id": settings.dp_client_id, "name": settings.dp_client_name, "notes": ""}
        ],
        "trades": [],
    }

def _load() -> dict:
    path = _path()
    if not path.exists():
        return _default()
    try:
        data = json.loads(path.read_text())
        if "clients" not in data or "trades" not in data:
            return _default()
        return data
    except Exception:
        return _default()

def _save(data: dict) -> None:
    _path().write_text(json.dumps(data, indent=2))

def list_clients() -> list[ClientRecord]:
    with _lock:
        data = _load()
        return [ClientRecord.model_validate(x) for x in data["clients"]]

def get_client(client_id: str) -> ClientRecord | None:
    for client in list_clients():
        if client.id == client_id:
            return client
    return None

def add_client(name: str, notes: str = "") -> ClientRecord:
    with _lock:
        data = _load()
        client = ClientRecord(id=str(uuid4()), name=name.strip(), notes=notes.strip())
        data["clients"].append(client.model_dump())
        _save(data)
        return client

def list_trades(client_id: str | None = None) -> list[RecordedTrade]:
    with _lock:
        data = _load()
        rows = data["trades"]
        if client_id:
            rows = [x for x in rows if x.get("client_id") == client_id]
        return [RecordedTrade.model_validate(x) for x in rows]

def add_trade(
    client_id: str,
    symbol: str,
    side: str,
    quantity: float,
    price: float,
    fees: float,
    executed_at: str,
    strategy: str,
    note: str,
    research_run_id: str | None,
    created_by: str,
) -> RecordedTrade:
    with _lock:
        data = _load()
        now = datetime.now(timezone.utc).isoformat()
        trade = RecordedTrade(
            id=str(uuid4()),
            client_id=client_id,
            symbol=symbol.strip().upper(),
            side=side.upper(),
            quantity=quantity,
            price=price,
            fees=fees,
            executed_at=executed_at,
            strategy=strategy.strip(),
            note=note.strip(),
            research_run_id=research_run_id,
            created_by=created_by,
            created_at=now,
        )
        data["trades"].append(trade.model_dump())
        _save(data)
        return trade

def portfolio_summary(client_id: str) -> dict:
    trades = sorted(list_trades(client_id), key=lambda x: x.executed_at)
    positions: dict[str, dict] = {}
    realized = 0.0
    total_fees = 0.0

    for trade in trades:
        p = positions.setdefault(trade.symbol, {"quantity": 0.0, "avg_cost": 0.0})
        total_fees += trade.fees
        if trade.side == "BUY":
            old_cost = p["avg_cost"] * p["quantity"]
            next_qty = p["quantity"] + trade.quantity
            p["avg_cost"] = (old_cost + trade.price * trade.quantity) / next_qty if next_qty else 0
            p["quantity"] = next_qty
        elif trade.side == "SELL":
            sell_qty = min(trade.quantity, p["quantity"])
            realized += (trade.price - p["avg_cost"]) * sell_qty - trade.fees
            p["quantity"] -= sell_qty

    open_positions = [
        {"symbol": symbol, "quantity": p["quantity"], "avg_cost": p["avg_cost"]}
        for symbol, p in positions.items()
        if p["quantity"] > 0
    ]

    invested = sum(p["quantity"] * p["avg_cost"] for p in open_positions)

    return {
        "client_id": client_id,
        "positions": open_positions,
        "trade_count": len(trades),
        "invested_cost": invested,
        "realized_pnl": realized,
        "fees": total_fees,
    }
