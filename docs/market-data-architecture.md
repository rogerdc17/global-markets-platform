# Market data architecture

The frontend uses one normalized endpoint:

`GET /market/snapshot`

The LiveMarket UI does not depend directly on Upstox, NSE, or any other vendor.

## Current recommended concept provider

Use Upstox with an Analytics Token through a small serverless proxy.

Frontend:

`GitHub Pages -> Market API gateway -> Upstox`

Do not expose the Analytics Token in frontend JavaScript.

## Production NSE path

NSE's direct paid real-time feed is not a normal public REST API. NSE documents Level 1/2/3 and tick-by-tick feeds delivered in multicast format over a dedicated leased-line connection, or through authorized real-time data vendors.

Recommended architecture:

`NSE multicast / authorized vendor -> ingestion service -> normalized market gateway -> LiveMarket frontend`

The normalized gateway should continue returning the same `MarketSnapshot` schema, so switching providers will not require a UI rewrite.

## Frontend configuration

Set at build time:

```
NEXT_PUBLIC_MARKET_API_BASE_URL=https://your-market-gateway.example.com
```

When this variable is absent or the gateway is unavailable, LiveMarket falls back to clearly labelled demo data.

## Cloudflare Worker template

A starter Worker is included under:

`workers/market-proxy/`

Environment secrets should be stored with Worker secrets, never committed:

```
UPSTOX_ANALYTICS_TOKEN
NSE_GATEWAY_TOKEN
```

Provider selection:

```
MARKET_PROVIDER=UPSTOX
```

Later:

```
MARKET_PROVIDER=NSE
NSE_GATEWAY_URL=https://your-nse-ingestion-gateway.example.com
```

## Normalized response

```json
{
  "provider": "upstox",
  "mode": "live",
  "asOf": "2026-09-21T10:00:00.000Z",
  "marketStatus": "Open",
  "indices": [],
  "stocks": []
}
```

Provider-specific fields should be transformed inside the backend adapter, not inside React components.
