export interface Env {
  MARKET_PROVIDER: string;
  UPSTOX_ANALYTICS_TOKEN?: string;
  ALLOWED_ORIGIN?: string;
  NSE_GATEWAY_URL?: string;
  NSE_GATEWAY_TOKEN?: string;
}

const WATCHLIST = [
  "NSE_EQ|INE002A01018",
  "NSE_EQ|INE467B01029",
  "NSE_EQ|INE009A01021",
  "NSE_EQ|INE040A01034",
  "NSE_EQ|INE090A01021",
];

const INDEX_KEYS = [
  "NSE_INDEX|Nifty 50",
  "NSE_INDEX|Nifty Bank",
  "NSE_INDEX|Nifty IT",
];

function cors(env: Env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

async function fetchUpstox(env: Env) {
  if (!env.UPSTOX_ANALYTICS_TOKEN) {
    throw new Error("UPSTOX_ANALYTICS_TOKEN is not configured");
  }

  const keys = [...INDEX_KEYS, ...WATCHLIST].join(",");
  const url = new URL("https://api.upstox.com/v3/market-quote/quotes");
  url.searchParams.set("instrument_key", keys);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.UPSTOX_ANALYTICS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Upstox returned ${response.status}`);
  }

  const raw = await response.json<any>();

  // Keep provider-specific parsing inside this adapter.
  // When the final Upstox instrument universe is selected, map every
  // returned instrument into the normalized MarketSnapshot schema here.
  return {
    provider: "upstox",
    mode: "live",
    asOf: new Date().toISOString(),
    marketStatus: "Live",
    raw: raw.data,
  };
}

async function fetchNseGateway(env: Env) {
  if (!env.NSE_GATEWAY_URL) {
    throw new Error("NSE_GATEWAY_URL is not configured");
  }

  const response = await fetch(`${env.NSE_GATEWAY_URL.replace(/\/$/, "")}/market/snapshot`, {
    headers: env.NSE_GATEWAY_TOKEN
      ? { Authorization: `Bearer ${env.NSE_GATEWAY_TOKEN}` }
      : undefined,
  });

  if (!response.ok) throw new Error(`NSE gateway returned ${response.status}`);
  return response.json();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(env) });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/market/snapshot") {
      return Response.json({ error: "Not found" }, { status: 404, headers: cors(env) });
    }

    try {
      const provider = (env.MARKET_PROVIDER || "UPSTOX").toUpperCase();
      const data =
        provider === "NSE"
          ? await fetchNseGateway(env)
          : await fetchUpstox(env);

      return Response.json(data, {
        headers: {
          ...cors(env),
          "Cache-Control": "no-store, max-age=0",
        },
      });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Market provider error" },
        { status: 502, headers: cors(env) }
      );
    }
  },
};
