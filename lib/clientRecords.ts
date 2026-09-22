import { apiBase, getAuthToken, logout } from "@/lib/auth";

export type ClientRecord = {
  id: string;
  name: string;
  notes: string;
};

export type RecordedTrade = {
  id: string;
  client_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fees: number;
  executed_at: string;
  strategy: string;
  note: string;
  research_run_id?: string | null;
  created_by: string;
  created_at: string;
};

export type PortfolioPayload = {
  client: ClientRecord;
  summary: {
    client_id: string;
    positions: Array<{ symbol: string; quantity: number; avg_cost: number }>;
    trade_count: number;
    invested_cost: number;
    realized_pnl: number;
    fees: number;
  };
  trades: RecordedTrade[];
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBase();
  if (!base) throw new Error("Private backend is not configured.");

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
      ...(init?.headers || {}),
    },
  });

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export async function listClients() {
  return api<{ clients: ClientRecord[] }>("/clients");
}

export async function createClient(name: string, notes: string) {
  return api<ClientRecord>("/clients", {
    method: "POST",
    body: JSON.stringify({ name, notes }),
  });
}

export async function getClientPortfolio(clientId: string) {
  return api<PortfolioPayload>(`/clients/${clientId}/portfolio`);
}

export async function getMyPortfolio() {
  return api<PortfolioPayload>("/portfolio/me");
}

export async function recordClientTrade(payload: {
  client_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fees: number;
  executed_at: string;
  strategy: string;
  note: string;
  research_run_id?: string | null;
}) {
  return api<RecordedTrade>("/records/trades", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
