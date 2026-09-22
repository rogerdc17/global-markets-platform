import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from uuid import uuid4

from app.config import settings

_lock = Lock()

def db_path() -> Path:
    path = Path(settings.dp_database_file).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    return path

def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def init_db() -> None:
    with _lock:
        with connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS clients (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    notes TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS trades (
                    id TEXT PRIMARY KEY,
                    client_id TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    side TEXT NOT NULL CHECK(side IN ('BUY','SELL')),
                    quantity REAL NOT NULL CHECK(quantity > 0),
                    price REAL NOT NULL CHECK(price > 0),
                    fees REAL NOT NULL DEFAULT 0 CHECK(fees >= 0),
                    executed_at TEXT NOT NULL,
                    strategy TEXT NOT NULL DEFAULT '',
                    note TEXT NOT NULL DEFAULT '',
                    research_run_id TEXT,
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(client_id) REFERENCES clients(id)
                );

                CREATE INDEX IF NOT EXISTS idx_trades_client_id ON trades(client_id);
                CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
                CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at);

                CREATE TABLE IF NOT EXISTS research_notes (
                    id TEXT PRIMARY KEY,
                    symbol TEXT NOT NULL,
                    title TEXT NOT NULL,
                    thesis TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'Watching',
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_research_symbol ON research_notes(symbol);
                CREATE INDEX IF NOT EXISTS idx_research_created_at ON research_notes(created_at);

                CREATE TABLE IF NOT EXISTS agent_runs (
                    run_id TEXT PRIMARY KEY,
                    symbol TEXT NOT NULL,
                    horizon TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    request_json TEXT NOT NULL,
                    result_json TEXT NOT NULL,
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_agent_runs_symbol ON agent_runs(symbol);
                CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at);

                CREATE TABLE IF NOT EXISTS agent_outcomes (
                    id TEXT PRIMARY KEY,
                    run_id TEXT NOT NULL,
                    horizon_label TEXT NOT NULL,
                    evaluated_at TEXT NOT NULL,
                    start_price REAL,
                    end_price REAL,
                    return_pct REAL,
                    benchmark_return_pct REAL,
                    alpha_pct REAL,
                    mfe_pct REAL,
                    mae_pct REAL,
                    target_hit INTEGER,
                    invalidation_hit INTEGER,
                    details TEXT NOT NULL DEFAULT '',
                    FOREIGN KEY(run_id) REFERENCES agent_runs(run_id)
                );

                CREATE INDEX IF NOT EXISTS idx_agent_outcomes_run_id ON agent_outcomes(run_id);

                CREATE TABLE IF NOT EXISTS audit_log (
                    id TEXT PRIMARY KEY,
                    actor TEXT NOT NULL,
                    action TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT,
                    details TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );
                """
            )

            default_id = settings.dp_client_id
            default_name = settings.dp_client_name
            now = datetime.now(timezone.utc).isoformat()
            conn.execute(
                "INSERT OR IGNORE INTO clients(id, name, notes, created_at) VALUES (?, ?, '', ?)",
                (default_id, default_name, now),
            )

    migrate_legacy_json()

def migrate_legacy_json() -> None:
    legacy = Path(settings.dp_legacy_data_file)
    if not legacy.exists():
        return

    marker = legacy.with_suffix(legacy.suffix + ".migrated")
    if marker.exists():
        return

    try:
        data = json.loads(legacy.read_text())
    except Exception:
        return

    with _lock:
        with connect() as conn:
            for client in data.get("clients", []):
                conn.execute(
                    "INSERT OR IGNORE INTO clients(id, name, notes, created_at) VALUES (?, ?, ?, ?)",
                    (
                        str(client.get("id") or uuid4()),
                        str(client.get("name") or "Client"),
                        str(client.get("notes") or ""),
                        datetime.now(timezone.utc).isoformat(),
                    ),
                )

            for trade in data.get("trades", []):
                try:
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO trades(
                            id, client_id, symbol, side, quantity, price, fees,
                            executed_at, strategy, note, research_run_id,
                            created_by, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            str(trade.get("id") or uuid4()),
                            str(trade["client_id"]),
                            str(trade["symbol"]).upper(),
                            str(trade["side"]).upper(),
                            float(trade["quantity"]),
                            float(trade["price"]),
                            float(trade.get("fees") or 0),
                            str(trade["executed_at"]),
                            str(trade.get("strategy") or ""),
                            str(trade.get("note") or ""),
                            trade.get("research_run_id"),
                            str(trade.get("created_by") or "migration"),
                            str(trade.get("created_at") or datetime.now(timezone.utc).isoformat()),
                        ),
                    )
                except Exception:
                    continue

    marker.write_text(datetime.now(timezone.utc).isoformat())

def backup_database() -> Path:
    source = db_path()
    backup_dir = Path(settings.dp_backup_dir).resolve()
    backup_dir.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    target = backup_dir / f"dp_alpha_{stamp}.db"

    with _lock:
        with connect() as source_conn:
            target_conn = sqlite3.connect(target)
            try:
                source_conn.backup(target_conn)
            finally:
                target_conn.close()

    backups = sorted(backup_dir.glob("dp_alpha_*.db"), reverse=True)
    for old in backups[30:]:
        old.unlink(missing_ok=True)

    return target
