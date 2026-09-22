import json
from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field

from app.database import connect


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


class ResearchNote(BaseModel):
    id: str
    symbol: str
    title: str
    thesis: str
    status: str
    created_by: str
    created_at: str
    updated_at: str


def _audit(actor: str, action: str, entity_type: str, entity_id: str | None, details: dict) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO audit_log(id, actor, action, entity_type, entity_id, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid4()),
                actor,
                action,
                entity_type,
                entity_id,
                json.dumps(details),
                datetime.now(timezone.utc).isoformat(),
            ),
        )


def list_clients() -> list[ClientRecord]:
    with connect() as conn:
        rows = conn.execute("SELECT id, name, notes FROM clients ORDER BY created_at ASC").fetchall()
    return [ClientRecord(**dict(row)) for row in rows]


def get_client(client_id: str) -> ClientRecord | None:
    with connect() as conn:
        row = conn.execute("SELECT id, name, notes FROM clients WHERE id = ?", (client_id,)).fetchone()
    return ClientRecord(**dict(row)) if row else None


def add_client(name: str, notes: str = "", created_by: str = "system") -> ClientRecord:
    client = ClientRecord(id=str(uuid4()), name=name.strip(), notes=notes.strip())
    with connect() as conn:
        conn.execute(
            "INSERT INTO clients(id, name, notes, created_at) VALUES (?, ?, ?, ?)",
            (client.id, client.name, client.notes, datetime.now(timezone.utc).isoformat()),
        )
    _audit(created_by, "create", "client", client.id, client.model_dump())
    return client


def list_trades(client_id: str | None = None) -> list[RecordedTrade]:
    sql = """
        SELECT id, client_id, symbol, side, quantity, price, fees, executed_at,
               strategy, note, research_run_id, created_by, created_at
        FROM trades
    """
    params: tuple = ()
    if client_id:
        sql += " WHERE client_id = ?"
        params = (client_id,)
    sql += " ORDER BY executed_at ASC, created_at ASC"

    with connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [RecordedTrade(**dict(row)) for row in rows]


def available_quantity(client_id: str, symbol: str) -> float:
    target = symbol.strip().upper()
    quantity = 0.0
    for trade in list_trades(client_id):
        if trade.symbol != target:
            continue
        if trade.side == "BUY":
            quantity += trade.quantity
        elif trade.side == "SELL":
            quantity -= trade.quantity
    return max(0.0, quantity)


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
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    with connect() as conn:
        conn.execute(
            """
            INSERT INTO trades(
                id, client_id, symbol, side, quantity, price, fees, executed_at,
                strategy, note, research_run_id, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                trade.id, trade.client_id, trade.symbol, trade.side, trade.quantity,
                trade.price, trade.fees, trade.executed_at, trade.strategy, trade.note,
                trade.research_run_id, trade.created_by, trade.created_at,
            ),
        )

    _audit(created_by, "create", "trade", trade.id, trade.model_dump())
    return trade


def list_research_notes() -> list[ResearchNote]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, symbol, title, thesis, status, created_by, created_at, updated_at
            FROM research_notes
            ORDER BY created_at DESC
            """
        ).fetchall()
    return [ResearchNote(**dict(row)) for row in rows]


def add_research_note(
    symbol: str,
    title: str,
    thesis: str,
    status: str,
    created_by: str,
) -> ResearchNote:
    now = datetime.now(timezone.utc).isoformat()
    note = ResearchNote(
        id=str(uuid4()),
        symbol=symbol.strip().upper(),
        title=title.strip(),
        thesis=thesis.strip(),
        status=status.strip() or "Watching",
        created_by=created_by,
        created_at=now,
        updated_at=now,
    )

    with connect() as conn:
        conn.execute(
            """
            INSERT INTO research_notes(
                id, symbol, title, thesis, status, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                note.id, note.symbol, note.title, note.thesis, note.status,
                note.created_by, note.created_at, note.updated_at,
            ),
        )

    _audit(created_by, "create", "research_note", note.id, note.model_dump())
    return note


def portfolio_summary(client_id: str) -> dict:
    trades = list_trades(client_id)
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
