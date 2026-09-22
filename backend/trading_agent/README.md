# DP Alpha backend

Self-hosted FastAPI backend for DP Alpha.

## Responsibilities

- authentication and role checks
- client portfolio records
- research records
- SQLite persistence
- audit history
- rolling database backups
- optional TradingAgent integration
- optional market-data integration

There is no order-execution endpoint.

## Windows

From the repository root:

```text
setup-dp-alpha-windows.bat
start-dp-alpha-windows.bat
```

## macOS / Linux

From `backend/trading_agent`:

```bash
chmod +x setup-unix.sh start-unix.sh
./setup-unix.sh
./start-unix.sh
```

## Health check

```text
GET http://127.0.0.1:8000/health
```

A healthy self-hosted server reports:

```json
{
  "ok": true,
  "executionEnabled": false,
  "storage": "sqlite",
  "selfHosted": true
}
```

## Local files

Private configuration:

```text
.env
```

Database:

```text
data/dp_alpha.db
```

Backups:

```text
backups/
```

All are excluded from Git.

## Diagnostics

Run:

```bash
python doctor.py
```

The configuration doctor checks required login settings and warns when optional Claude or market integrations are not configured.

## Backup

```bash
python backup.py
```

The backend also creates rolling automatic backups.

For remote-access setup and moving the server to another computer, see `SELF_HOSTING.md`.
