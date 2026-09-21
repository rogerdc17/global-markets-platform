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

export async function runTradingAgent(payload: Record<string, unknown>): Promise<AgentResult> {
  if (!API_BASE) {
    throw new Error("TradingAgent backend is not configured yet.");
  }

  const response = await fetch(`${API_BASE}/agent/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

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

export function tradingAgentConfigured() {
  return Boolean(API_BASE);
}
