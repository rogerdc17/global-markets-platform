export type MarketIndex = {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePct: number;
};

export type MarketStock = {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
};

export type MarketSnapshot = {
  provider: string;
  mode: "live" | "delayed" | "demo";
  asOf: string;
  marketStatus: string;
  indices: MarketIndex[];
  stocks: MarketStock[];
};

const API_BASE = process.env.NEXT_PUBLIC_MARKET_API_BASE_URL?.replace(/\/$/, "");

export async function fetchMarketSnapshot(): Promise<MarketSnapshot | null> {
  if (!API_BASE) return null;

  try {
    const response = await fetch(`${API_BASE}/market/snapshot`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Market API returned ${response.status}`);
    return (await response.json()) as MarketSnapshot;
  } catch (error) {
    console.error("Live market API unavailable", error);
    return null;
  }
}

export function hasConfiguredMarketApi() {
  return Boolean(API_BASE);
}
