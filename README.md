# DP Alpha

Private research, portfolio record-keeping and reporting platform.

DP Alpha does **not** execute trades. BUY and SELL entries are records of transactions completed outside the application.

## Architecture

```text
GitHub Pages frontend
        |
        | HTTPS
        v
Self-hosted DP Alpha computer
        |
        +-- FastAPI backend
        +-- SQLite database
        +-- Research journal
        +-- Client portfolio records
        +-- Audit log
        +-- TradingAgent integrations
```

The self-hosted computer can be Windows, macOS or Linux.

## Fastest Windows setup

Clone the repository, stay in the repository root, then run:

```text
setup-dp-alpha-windows.bat
```

The installer:

1. checks for Python,
2. creates the local virtual environment,
3. installs backend dependencies,
4. creates the private `.env`,
5. generates `DP_AUTH_SECRET`,
6. initializes SQLite,
7. validates the configuration.

After filling any blank login values in:

```text
backend/trading_agent/.env
```

start the server with:

```text
start-dp-alpha-windows.bat
```

Then verify:

```text
http://127.0.0.1:8000/health
```

Manual database backup:

```text
backup-dp-alpha-windows.bat
```

For macOS/Linux, see:

```text
backend/trading_agent/SELF_HOSTING.md
```

## Repository structure

```text
app/                         Next.js frontend
components/                  Shared UI
lib/                         Frontend API clients

backend/trading_agent/       Self-hosted FastAPI + SQLite server
workers/market-proxy/        Optional market-data gateway
.github/workflows/           GitHub Pages deployment
```

## User roles

### Internal

- LiveMarket
- MyStocks
- Client Portfolios
- TradingAgent
- Research
- Performance
- About

Internal users can record transactions completed outside DP Alpha and maintain client records.

### Client

- Dashboard
- LiveMarket
- MyPortfolio
- Performance
- Transactions
- Reports
- About

Client access is read-only and scoped to the authenticated client.

## Local backend storage

The backend stores shared records in:

```text
backend/trading_agent/data/dp_alpha.db
```

The database contains:

- clients
- external transaction records
- research notes
- audit log

Automatic rolling backups are stored in:

```text
backend/trading_agent/backups/
```

These files are excluded from Git.

## Private server configuration

Private configuration is stored in:

```text
backend/trading_agent/.env
```

Never commit:

- `.env`
- SQLite database files
- backups
- Claude/API keys
- market-data credentials
- tunnel credentials

## Frontend development

```bash
npm install
npm run dev
```

Local frontend environment:

```text
NEXT_PUBLIC_TRADING_AGENT_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_MARKET_API_BASE_URL=
```

For GitHub Pages, the workflow reads:

```text
TRADING_AGENT_API_BASE_URL
MARKET_API_BASE_URL
```

from GitHub Actions repository variables.

## Remote access

For internet access, keep FastAPI bound to:

```text
127.0.0.1:8000
```

and publish it through a secure HTTPS tunnel such as Cloudflare Tunnel.

Do **not** forward port 8000 directly from a home router.

Detailed self-hosting instructions:

```text
backend/trading_agent/SELF_HOSTING.md
```

## Current integration status

The core self-hosted system supports:

- authentication
- internal/client roles
- SQLite persistence
- client portfolio records
- research notes
- audit logging
- automatic backups
- server offline handling

Optional integrations can be enabled later:

- Claude/TradingAgent
- live market data
- historical market data

## Execution boundary

DP Alpha is a research, reporting and record-keeping application.

It does not place, route, modify, cancel or execute securities orders.
