# TradingAgent backend

Private-ready FastAPI backend for the Bharat Markets TradingAgent.

## Architecture

The backend intentionally separates:

1. deterministic calculations — technical indicators, exposure and risk sizing,
2. provider-neutral market context — through the same LiveMarket market gateway,
3. current web research — through Claude web search,
4. multi-agent reasoning — technical, fundamental, news, bull, bear, risk and portfolio views,
5. final synthesis — a structured report for a human trader.

Claude does not place orders.

## Local setup

~~~bash
cd backend/trading_agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
~~~

Set:

~~~text
ANTHROPIC_API_KEY=your-private-key
CLAUDE_MODEL=claude-sonnet-5
MARKET_API_BASE_URL=https://your-market-gateway.example.com
ALLOWED_ORIGINS=https://rogerdc17.github.io,http://localhost:3000
~~~

Run:

~~~bash
uvicorn app.main:app --reload --port 8000
~~~

Health check:

~~~text
GET /health
~~~

Main analysis endpoint:

~~~text
POST /agent/analyze
~~~

Example body:

~~~json
{
  "symbol": "RELIANCE",
  "horizon": "swing",
  "mode": "committee",
  "account_size": 1000000,
  "max_risk_pct": 1,
  "stop_price": 1380,
  "portfolio": [
    {
      "symbol": "RELIANCE",
      "side": "BUY",
      "quantity": 25,
      "entry_price": 1315,
      "current_price": 1423
    }
  ]
}
~~~

## Deployment

Run the backend on a private/container host such as Cloud Run, ECS/Fargate, Railway, Render, Fly.io or a private VPS.

Keep these secrets server-side only:

~~~text
ANTHROPIC_API_KEY
broker credentials
paid NSE/vendor credentials
database credentials
~~~

After deployment, set this GitHub repository variable:

~~~text
TRADING_AGENT_API_BASE_URL=https://your-agent-api.example.com
~~~

The Pages build exposes only that public API base URL to the browser.

## Research policy

The research prompt prioritizes:

- exchange, regulatory and company filings,
- investor-relations documents,
- current financial reporting,
- sector and macro evidence.

Every completed analysis returns a source list so the UI can show what evidence was used.

## Next production layers

- authentication and user isolation
- PostgreSQL run history and outcome tracking
- scheduled market scanners and alerts
- historical candle endpoint in the market gateway
- dedicated fundamentals adapter
- backtesting service
- per-user risk rules
- broker integration only behind explicit human confirmation

## Inspiration and licensing

The architecture is inspired by:

- HKUDS/Vibe-Trading — MIT
- TauricResearch/TradingAgents — Apache-2.0

This implementation is clean-room style rather than a wholesale copy. If upstream source code is incorporated later, preserve the applicable upstream license and notices.
