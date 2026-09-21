export interface Env {
  MARKET_PROVIDER: string;
  UPSTOX_ANALYTICS_TOKEN?: string;
  ALLOWED_ORIGIN?: string;
  NSE_GATEWAY_URL?: string;
  NSE_GATEWAY_TOKEN?: string;
}

type UpstoxQuote = {
  timestamp?: string;
  instrument_token?: string;
  symbol?: string;
  last_price?: number;
  volume?: number;
  net_change?: number;
  prev_close_price?: number;
  year_high?: number;
  year_low?: number;
  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    ts?: number;
  };
};

type UpstoxQuotesResponse = {
  status?: string;
  data?: Record<string, UpstoxQuote>;
};

type UpstoxStatusResponse = {
  status?: string;
  data?: {
    exchange?: string;
    status?: string;
    last_updated?: number;
  };
};

const STOCKS = [
  { key: "NSE_EQ|INE002A01018", symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy" },
  { key: "NSE_EQ|INE467B01029", symbol: "TCS", name: "Tata Consultancy Services", sector: "Technology" },
  { key: "NSE_EQ|INE009A01021", symbol: "INFY", name: "Infosys", sector: "Technology" },
  { key: "NSE_EQ|INE040A01034", symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
  { key: "NSE_EQ|INE090A01021", symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking" },
  { key: "NSE_EQ|INE062A01020", symbol: "SBIN", name: "State Bank of India", sector: "Banking" },
  { key: "NSE_EQ|INE397D01024", symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom" },
  { key: "NSE_EQ|INE154A01025", symbol: "ITC", name: "ITC", sector: "Consumer" },
  { key: "NSE_EQ|INE018A01030", symbol: "LT", name: "Larsen & Toubro", sector: "Industrials" },
  { key: "NSE_EQ|INE044A01036", symbol: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Healthcare" },
  { key: "NSE_EQ|INE585B01010", symbol: "MARUTI", name: "Maruti Suzuki India", sector: "Automotive" },
];

const INDICES = [
  { key: "NSE_INDEX|Nifty 50", symbol: "NIFTY50", name: "NIFTY 50" },
  { key: "NSE_INDEX|Nifty Bank", symbol: "BANKNIFTY", name: "BANK NIFTY" },
  { key: "NSE_INDEX|Nifty IT", symbol: "NIFTYIT", name: "NIFTY IT" },
  { key: "NSE_INDEX|India VIX", symbol: "INDIAVIX", name: "INDIA VIX" },
];

function cors(env: Env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

function findQuote(data: Record<string, UpstoxQuote>, instrumentKey: string) {
  return Object.values(data).find((quote) => quote.instrument_token === instrumentKey);
}

function pct(change: number, previousClose: number) {
  return previousClose ? (change / previousClose) * 100 : 0;
}

function compactVolume(value: number | undefined) {
  if (!value) return "0";
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

async function upstoxGet<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstox returned ${response.status}: ${body.slice(0, 180)}`);
  }

  return (await response.json()) as T;
}

async function fetchUpstox(env: Env) {
  if (!env.UPSTOX_ANALYTICS_TOKEN) {
    throw new Error("UPSTOX_ANALYTICS_TOKEN is not configured");
  }

  const token = env.UPSTOX_ANALYTICS_TOKEN;
  const keys = [...INDICES, ...STOCKS].map((item) => item.key).join(",");
  const quoteUrl = new URL("https://api.upstox.com/v3/market-quote/quotes");
  quoteUrl.searchParams.set("instrument_key", keys);

  const [quotesResponse, statusResponse] = await Promise.all([
    upstoxGet<UpstoxQuotesResponse>(quoteUrl.toString(), token),
    upstoxGet<UpstoxStatusResponse>("https://api.upstox.com/v2/market/status/NSE", token),
  ]);

  const raw = quotesResponse.data || {};

  const indices = INDICES.flatMap((meta) => {
    const quote = findQuote(raw, meta.key);
    if (!quote || typeof quote.last_price !== "number") return [];

    const previousClose = quote.prev_close_price ?? quote.ohlc?.close ?? 0;
    const change = quote.net_change ?? quote.last_price - previousClose;

    return [{
      symbol: meta.symbol,
      name: meta.name,
      value: quote.last_price,
      change,
      changePct: pct(change, previousClose),
    }];
  });

  const stocks = STOCKS.flatMap((meta) => {
    const quote = findQuote(raw, meta.key);
    if (!quote || typeof quote.last_price !== "number") return [];

    const previousClose = quote.prev_close_price ?? quote.ohlc?.close ?? 0;
    const change = quote.net_change ?? quote.last_price - previousClose;

    return [{
      symbol: meta.symbol,
      name: meta.name,
      exchange: "NSE" as const,
      sector: meta.sector,
      price: quote.last_price,
      change,
      changePct: pct(change, previousClose),
      volume: compactVolume(quote.volume ?? quote.ohlc?.volume),
    }];
  });

  const timestamps = Object.values(raw)
    .map((quote) => quote.timestamp)
    .filter((value): value is string => Boolean(value));

  return {
    provider: "Upstox",
    mode: "live" as const,
    asOf: timestamps[0] || new Date().toISOString(),
    marketStatus: statusResponse.data?.status || "UNKNOWN",
    indices,
    stocks,
  };
}

async function fetchNseGateway(env: Env) {
  if (!env.NSE_GATEWAY_URL) {
    throw new Error("NSE_GATEWAY_URL is not configured");
  }

  const response = await fetch(
    `${env.NSE_GATEWAY_URL.replace(/\/$/, "")}/market/snapshot`,
    {
      headers: env.NSE_GATEWAY_TOKEN
        ? { Authorization: `Bearer ${env.NSE_GATEWAY_TOKEN}` }
        : undefined,
    }
  );

  if (!response.ok) {
    throw new Error(`NSE gateway returned ${response.status}`);
  }

  return response.json();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(env) });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json(
        {
          ok: true,
          provider: (env.MARKET_PROVIDER || "UPSTOX").toUpperCase(),
          tokenConfigured: Boolean(env.UPSTOX_ANALYTICS_TOKEN),
        },
        { headers: cors(env) }
      );
    }

    if (url.pathname !== "/market/snapshot") {
      return Response.json(
        { error: "Not found" },
        { status: 404, headers: cors(env) }
      );
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
        {
          error: error instanceof Error ? error.message : "Market provider error",
        },
        { status: 502, headers: cors(env) }
      );
    }
  },
};
