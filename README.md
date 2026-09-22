# DP Alpha Terminal

Private research, portfolio record-keeping and reporting platform. DP Alpha does not execute trades.

## Core product

- **LiveMarket** — real Indian market data through a provider-neutral market gateway.
- **MyStocks** — personal trade ledger, open positions, realized/unrealized P&L, fees and strategy notes.
- **TradingAgent** — private AI research and risk engine using live market context, portfolio context and current web research.
- **About** — product overview.

## Repository structure

```text
app/                         Next.js frontend
components/                  Shared UI
lib/                         Frontend market + TradingAgent clients

workers/market-proxy/        Cloudflare market-data gateway
backend/trading_agent/       Private-ready FastAPI TradingAgent backend

.github/workflows/           GitHub Pages deployment
```

## Frontend

The frontend is a static Next.js export deployed to GitHub Pages.

```bash
npm install
npm run dev
```

Environment variables:

```text
NEXT_PUBLIC_MARKET_API_BASE_URL=https://your-market-gateway.example.com
NEXT_PUBLIC_TRADING_AGENT_API_BASE_URL=https://your-trading-agent-api.example.com
```

For GitHub Pages, configure repository variables:

```text
MARKET_API_BASE_URL
TRADING_AGENT_API_BASE_URL
```

The deployment workflow maps them to the public Next.js environment variables during the build.

## LiveMarket data

The frontend never stores market-data credentials.

Current architecture:

```text
DP Alpha Terminal
      |
      v
Market Gateway
      |
      +-- Upstox (current free/live path)
      |
      +-- NSE licensed feed / authorized vendor (future production path)
```

Cloudflare Worker code:

```text
workers/market-proxy/
```

Current Worker variables:

```text
MARKET_PROVIDER=UPSTOX
ALLOWED_ORIGIN=https://rogerdc17.github.io
```

Secret:

```text
UPSTOX_ANALYTICS_TOKEN
```

Health check:

```text
GET /health
```

Normalized live snapshot:

```text
GET /market/snapshot
```

When moving to subscribed NSE real-time data, keep the same frontend contract and switch the backend provider:

```text
MARKET_PROVIDER=NSE
NSE_GATEWAY_URL=https://your-secure-nse-gateway.example.com
NSE_GATEWAY_TOKEN=<secret>
```

The NSE ingestion layer must normalize its output to the same DP Alpha market schema. Keep all licensed-feed credentials and redistribution logic server-side.

## TradingAgent backend

Location:

```text
backend/trading_agent/
```

It currently contains:

- FastAPI API
- Claude research/synthesis provider
- deterministic technical indicators
- deterministic portfolio/risk calculations
- LiveMarket context adapter
- multi-agent orchestration
- Docker deployment support

See:

```text
backend/trading_agent/README.md
```

Private backend secrets include:

```text
ANTHROPIC_API_KEY
MARKET_API_BASE_URL
```

Do not expose these in the browser.

## MyStocks

The current frontend keeps Dharmin's trade ledger in browser storage for the concept phase.

It tracks:

- buys and sells
- quantities and execution prices
- fees
- strategies and notes
- timestamps
- average cost
- open positions
- realized P&L
- unrealized P&L

For production, this should move to authenticated private database storage so the trading history is durable across devices.

## Production priorities

1. Finish real LiveMarket connection.
2. Add provider-neutral historical OHLC endpoints.
3. Deploy TradingAgent backend privately.
4. Add authentication and PostgreSQL.
5. Persist MyStocks and TradingAgent research history.
6. Add backtesting and outcome tracking.
7. Add scanners/alerts.
8. Add broker connectivity only with explicit human confirmation.

## Security

Never commit:

- Claude API keys
- Upstox tokens
- NSE/vendor credentials
- broker credentials
- database passwords

DP Alpha Terminal is a decision-support system. It does not guarantee profitable outcomes and should preserve human confirmation for any future order execution.


## Role-based portals

DP Alpha now has two temporary roles:

### Internal
- LiveMarket
- MyStocks
- Client Portfolios
- TradingAgent
- Research
- Performance
- About

Internal users can record transactions that were executed outside DP Alpha. These records feed the client portal.

### Client
- Dashboard
- LiveMarket
- MyPortfolio
- Performance
- Transactions
- Reports
- About

Client access is read-only and scoped to the client ID embedded in the authenticated session.

## Important execution boundary

DP Alpha is intentionally not a brokerage or order-entry application.

It does not place, route, modify, cancel, or execute securities orders. BUY and SELL values stored in the application describe transactions that have already occurred externally.

## Temporary storage

Client records currently use the backend JSON file configured by `DP_DATA_FILE`. This is suitable only for the current development phase. Production should replace it with authenticated PostgreSQL storage, audit logs and durable backups.
