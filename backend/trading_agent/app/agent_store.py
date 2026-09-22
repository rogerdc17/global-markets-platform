import json
from datetime import datetime, timezone

from app.database import connect
from app.models import AnalyzeRequest, AnalyzeResponse


def save_agent_run(request: AnalyzeRequest, result: AnalyzeResponse, created_by: str) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO agent_runs(
                run_id, symbol, horizon, mode, request_json, result_json, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result.run_id,
                result.symbol,
                result.horizon,
                result.mode,
                request.model_dump_json(),
                result.model_dump_json(),
                created_by,
                datetime.now(timezone.utc).isoformat(),
            ),
        )


def list_agent_runs(limit: int = 25, symbol: str | None = None) -> list[dict]:
    sql = """
        SELECT run_id, symbol, horizon, mode, result_json, created_by, created_at
        FROM agent_runs
    """
    params: list[object] = []
    if symbol:
        sql += " WHERE symbol = ?"
        params.append(symbol.strip().upper())
    sql += " ORDER BY created_at DESC LIMIT ?"
    params.append(max(1, min(limit, 100)))

    with connect() as conn:
        rows = conn.execute(sql, tuple(params)).fetchall()

    items: list[dict] = []
    for row in rows:
        result = json.loads(row["result_json"])
        plan = result.get("plan") or {}
        items.append(
            {
                "run_id": row["run_id"],
                "symbol": row["symbol"],
                "horizon": row["horizon"],
                "mode": row["mode"],
                "decision": plan.get("decision"),
                "stance": plan.get("stance"),
                "confidence": plan.get("confidence"),
                "created_by": row["created_by"],
                "created_at": row["created_at"],
            }
        )
    return items


def get_agent_run(run_id: str) -> dict | None:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT run_id, request_json, result_json, created_by, created_at
            FROM agent_runs
            WHERE run_id = ?
            """,
            (run_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "run_id": row["run_id"],
        "request": json.loads(row["request_json"]),
        "result": json.loads(row["result_json"]),
        "created_by": row["created_by"],
        "created_at": row["created_at"],
    }


def run_exists(run_id: str) -> bool:
    with connect() as conn:
        row = conn.execute("SELECT 1 FROM agent_runs WHERE run_id = ?", (run_id,)).fetchone()
    return row is not None
