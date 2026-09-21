# Bharat Markets / Global Markets Platform

India-first market dashboard concept built with Next.js and deployed to GitHub Pages.

The application is organized around four areas:

- **LiveMarket** — market indices, live quotes, movers, filters and stock detail pages
- **MyStocks** — a personal workspace for current holdings and active trades
- **TradingAgent** — reserved for the future intelligent trading module
- **About** — product information

## Current market-data architecture

The frontend does **not** talk directly to a market-data vendor.

```text
GitHub Pages
    |
    v
Market Gateway (/market/snapshot)
    |
    +--> Upstox Analytics Token (free concept/live-data path)
    |
    +--> NSE subscribed real-time gateway (future production path)
```

The UI consumes one normalized response regardless of provider. This keeps LiveMarket provider-independent.

## Free live-data setup with Upstox

Upstox currently provides a free, read-only **Analytics Token** with one-year validity. Market Quote, Historical Data, Market Information and WebSocket APIs are supported without a static-IP requirement.

### 1. Generate the token

In the Upstox Developer Apps area, generate an **Analytics Token**.

Do not commit the token to this repository.

### 2. Deploy the included Cloudflare Worker

The Worker template is in:

```text
workers/market-proxy/
```

Create a Cloudflare Worker using the files in that directory.

Set these Worker variables:

```text
MARKET_PROVIDER=UPSTOX
ALLOWED_ORIGIN=https://rogerdc17.github.io
```

Add this as a **secret**, not a normal variable:

```text
UPSTOX_ANALYTICS_TOKEN=<your token>
```

The Worker exposes:

```text
GET /health
GET /market/snapshot
```

### 3. Test the gateway

Open:

```text
https://<your-worker>.workers.dev/health
```

Expected shape:

```json
{
  "ok": true,
  "provider": "UPSTOX",
  "tokenConfigured": true
}
```

Then test:

```text
https://<your-worker>.workers.dev/market/snapshot
```

It should return normalized indices and stock quotes.

### 4. Connect GitHub Pages to the Worker

In the GitHub repository go to:

```text
Settings
-> Secrets and variables
-> Actions
-> Variables
-> New repository variable
```

Create:

```text
Name: MARKET_API_BASE_URL
Value: https://<your-worker>.workers.dev
```

The GitHub Pages workflow passes this value into:

```text
NEXT_PUBLIC_MARKET_API_BASE_URL
```

Then run the Pages workflow again or push a new commit.

When the gateway responds successfully, LiveMarket changes from **Demo fallback** to **Live API**.

## Local development

Create a local `.env.local`:

```text
NEXT_PUBLIC_MARKET_API_BASE_URL=https://<your-worker>.workers.dev
```

Then run:

```bash
npm install
npm run dev
```

## Normalized market response

All providers should ultimately return this shape:

```json
{
  "provider": "Upstox",
  "mode": "live",
  "asOf": "2026-09-21T10:00:00.000Z",
  "marketStatus": "NORMAL_OPEN",
  "indices": [
    {
      "symbol": "NIFTY50",
      "name": "NIFTY 50",
      "value": 25000,
      "change": 100,
      "changePct": 0.4
    }
  ],
  "stocks": [
    {
      "symbol": "RELIANCE",
      "name": "Reliance Industries",
      "exchange": "NSE",
      "sector": "Energy",
      "price": 1400,
      "change": 10,
      "changePct": 0.72,
      "volume": "8.4M"
    }
  ]
}
```

The React application should never need to know which vendor produced this response.

---

# Adding subscribed NSE real-time data later

The application is already structured so the paid NSE path can replace Upstox without rebuilding LiveMarket.

NSE's subscribed real-time market-data service is not simply a browser REST endpoint. Depending on the subscription level and arrangement, real-time feeds can be distributed through dedicated infrastructure / multicast feeds or via authorized data vendors.

The production architecture should therefore be:

```text
NSE subscribed feed
      |
      v
NSE feed handler / authorized vendor adapter
      |
      v
Your secure market gateway
      |
      v
GET /market/snapshot
      |
      v
LiveMarket
```

## Provider switch

The Cloudflare gateway already supports a provider switch.

For the free path:

```text
MARKET_PROVIDER=UPSTOX
```

For the future subscribed NSE path:

```text
MARKET_PROVIDER=NSE
NSE_GATEWAY_URL=https://your-secure-nse-gateway.example.com
```

Optional secret:

```text
NSE_GATEWAY_TOKEN=<private service token>
```

The NSE-side service must expose:

```text
GET /market/snapshot
```

using the normalized response schema above.

That means the frontend code remains unchanged when the data source changes from Upstox to subscribed NSE data.

## What the NSE ingestion service should do

The future production service should:

1. connect to the subscribed NSE feed or authorized vendor
2. decode and maintain the latest quote state
3. map exchange instruments to symbols used by Bharat Markets
4. calculate or pass through price, previous close, change, volume and index values
5. expose only normalized JSON to the public-facing gateway
6. keep all NSE/vendor credentials and connectivity details server-side
7. enforce any redistribution, entitlement and display requirements in the applicable NSE/vendor agreement

Do **not** expose raw NSE credentials, multicast connectivity details, vendor secrets or paid-feed tokens in GitHub Pages.

## Stock-detail data

The current stock-detail pages still use concept data. The next data-layer phase should add provider-neutral endpoints such as:

```text
GET /market/quote/:symbol
GET /market/history/:symbol?range=1D
GET /market/history/:symbol?range=1M
```

Those endpoints can use Upstox first and the subscribed NSE backend later.

## Important

Market-data rights and redistribution permissions depend on the provider and subscription agreement. Before a public/commercial launch, confirm that the selected plan allows the intended display and redistribution model.
