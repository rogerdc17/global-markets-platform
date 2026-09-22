import { getAuthToken, logout } from "@/lib/auth";

export type AgentView = {
  name: string;
  stance: "bullish" | "neutral" | "bearish" | "mixed";
  confidence: number;
  summary: string;
  evidence: string[];
};

export type StageResult = {
  stage: string;
  stance: "bullish" | "neutral" | "bearish" | "mixed";
  confidence: number;
  summary: string;
  evidence: string[];
  objections: string[];
};

export type AgentRunSummary = {
  run_id: string;
  symbol: string;
  horizon: string;
  mode: string;
  decision?: string | null;
  stance?: string | null;
  confidence?: number | null;
  created_by: string;
  created_at: string;
};

export type AgentRunDetail = {
  run_id: string;
  request: Record<string, unknown>;
  result: AgentResult;
  created_by: string;
  created_at: string;
};

export type AgentResult = {
  run_id: string;
  symbol: string;
  horizon: string;
  mode: string;
  market: Record<string, unknown>;
  technicals: Record<string, unknown>;
  risk: Record<string, unknown>;
  agents: AgentView[];
  stages: StageResult[];
  confidence_breakdown: {
    data_quality: number;
    source_coverage: number;
    agent_agreement: number;
    model_confidence: number;
    calibrated_confidence: number;
  };
  plan: {
    stance: "bullish" | "neutral" | "bearish" | "mixed";
    confidence: number;
    thesis: string;
    entry_zone?: string | null;
    invalidation?: string | null;
    targets: string[];
    risk_reward?: string | null;
    position_size?: string | null;
    portfolio_note?: string | null;
    decision: "consider_long" | "hold_or_wait" | "consider_short" | "avoid" | "insufficient_data";
  };
  sources: Array<{
    title: string;
    url: string;
    publisher?: string | null;
    published_at?: string | null;
    source_type: string;
    relevance: string;
  }>;
  caveats: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_TRADING_AGENT_API_BASE_URL?.replace(/\/$/, "");

async function agentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error("TradingAgent backend is not configured yet.");

  const token = getAuthToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error("DP Alpha server is unreachable. Check that the server computer and secure tunnel are running.");
  }

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    let message = `TradingAgent returned ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export async function runTradingAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  return agentFetch<AgentResult>("/agent/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listAgentRuns(limit = 25, symbol?: string): Promise<AgentRunSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (symbol?.trim()) params.set("symbol", symbol.trim().toUpperCase());
  const data = await agentFetch<{ runs: AgentRunSummary[] }>(`/agent/runs?${params.toString()}`);
  return data.runs;
}

export async function getAgentRun(runId: string): Promise<AgentRunDetail> {
  return agentFetch<AgentRunDetail>(`/agent/runs/${encodeURIComponent(runId)}`);
}

export function tradingAgentConfigured() {
  return Boolean(API_BASE);
}
