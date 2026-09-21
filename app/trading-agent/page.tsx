"use client";

import { FormEvent, useMemo, useState } from "react";
import Header from "@/components/Header";
import { AgentResult, runTradingAgent, tradingAgentConfigured } from "@/lib/tradingAgent";

type StoredPosition = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  note: string;
};

function stanceClass(stance: string) {
  if (stance === "bullish") return "up";
  if (stance === "bearish") return "down";
  return "";
}

export default function TradingAgentPage() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [horizon, setHorizon] = useState("swing");
  const [mode, setMode] = useState("committee");
  const [accountSize, setAccountSize] = useState("1000000");
  const [riskPct, setRiskPct] = useState("1");
  const [stopPrice, setStopPrice] = useState("");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const configured = tradingAgentConfigured();

  const portfolio = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("bharat-markets-positions");
      const positions = saved ? (JSON.parse(saved) as StoredPosition[]) : [];
      return positions.map((position) => ({
        symbol: position.symbol,
        side: position.side,
        quantity: position.quantity,
        entry_price: position.entryPrice,
        current_price: position.currentPrice,
      }));
    } catch {
      return [];
    }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await runTradingAgent({
        symbol: symbol.trim().toUpperCase(),
        horizon,
        mode,
        account_size: Number(accountSize),
        max_risk_pct: Number(riskPct),
        stop_price: stopPrice ? Number(stopPrice) : null,
        portfolio,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "TradingAgent request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Header active="agent" status={configured ? "Agent backend ready" : "Backend not connected"} />

      <section className="workspace-shell agent-workspace">
        <div className="agent-hero">
          <div>
            <p className="eyebrow">DP ALPHA · TRADING INTELLIGENCE</p>
            <h1 className="workspace-title">TradingAgent</h1>
            <p className="workspace-sub">
              Dharmin's private research engine combining live market context, MyStocks portfolio awareness, current web evidence and deterministic risk controls.
            </p>
          </div>
          <div className="agent-stack-badge">
            <span>Claude</span>
            <span>LiveMarket</span>
            <span>MyStocks</span>
            <span>Web Research</span>
          </div>
        </div>

        <div className="trading-agent-grid">
          <form className="agent-control-card" onSubmit={submit}>
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">RUN ANALYSIS</p>
                <h2>New research run</h2>
              </div>
            </div>

            <div className="agent-form-grid">
              <label>
                Symbol
                <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="RELIANCE" />
              </label>
              <label>
                Horizon
                <select value={horizon} onChange={(e) => setHorizon(e.target.value)}>
                  <option value="intraday">Intraday</option>
                  <option value="swing">Swing</option>
                  <option value="position">Position</option>
                  <option value="investment">Investment</option>
                </select>
              </label>
              <label>
                Analysis mode
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="quick">Quick</option>
                  <option value="deep">Deep</option>
                  <option value="committee">Full Committee</option>
                </select>
              </label>
              <label>
                Account size
                <input type="number" min="1" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} />
              </label>
              <label>
                Max risk %
                <input type="number" min="0.1" max="10" step="0.1" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} />
              </label>
              <label>
                Stop price
                <input type="number" min="0" step="any" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} placeholder="Optional" />
              </label>
            </div>

            <div className="agent-run-meta">
              <span>{portfolio.length} MyStocks position{portfolio.length === 1 ? "" : "s"} attached</span>
              <span>{configured ? "Backend configured" : "Needs backend URL"}</span>
            </div>

            <button className="primary-btn agent-run-button" type="submit" disabled={!configured || loading}>
              {loading ? "Researching..." : "Run TradingAgent"}
            </button>

            {!configured && (
              <p className="agent-warning">
                Configure NEXT_PUBLIC_TRADING_AGENT_API_BASE_URL to activate the agent.
              </p>
            )}
            {error && <p className="agent-error">{error}</p>}
          </form>

          <aside className="agent-method-card">
            <p className="eyebrow">RESEARCH PIPELINE</p>
            <h3>What happens in a run</h3>
            <div className="pipeline-list">
              <span>01 · Live market context</span>
              <span>02 · Deterministic technicals</span>
              <span>03 · Current web research</span>
              <span>04 · Bull / bear challenge</span>
              <span>05 · Risk & portfolio review</span>
              <span>06 · Claude synthesis</span>
            </div>
          </aside>
        </div>

        {!result ? (
          <section className="agent-empty-state">
            <span className="agent-orb">AI</span>
            <div>
              <h2>Evidence first. Opinion second.</h2>
              <p>
                TradingAgent is designed to research current evidence, calculate market and risk metrics in code, and then use AI to synthesize the case for a human trader.
              </p>
            </div>
          </section>
        ) : (
          <section className="agent-results">
            <div className="agent-result-head">
              <div>
                <p className="eyebrow">TRADINGAGENT REPORT</p>
                <h2>{result.symbol}</h2>
                <span className="muted">{result.horizon} · {result.mode} · run {result.run_id.slice(0, 8)}</span>
              </div>
              <div className="agent-conviction">
                <span className={stanceClass(result.plan.stance)}>{result.plan.stance.toUpperCase()}</span>
                <strong>{result.plan.confidence}%</strong>
                <small>confidence</small>
              </div>
            </div>

            <div className="agent-report-grid">
              <article className="agent-thesis-card">
                <p className="eyebrow">FINAL THESIS</p>
                <p>{result.plan.thesis}</p>
                <div className="trade-plan-grid">
                  <div><span>Entry zone</span><strong>{result.plan.entry_zone || "Conditional / unavailable"}</strong></div>
                  <div><span>Invalidation</span><strong>{result.plan.invalidation || "Not established"}</strong></div>
                  <div><span>Risk / reward</span><strong>{result.plan.risk_reward || "Not established"}</strong></div>
                  <div><span>Position sizing</span><strong>{result.plan.position_size || "Use risk rules"}</strong></div>
                </div>
                {result.plan.targets.length > 0 && (
                  <div className="agent-targets">
                    <span>Targets</span>
                    {result.plan.targets.map((target) => <strong key={target}>{target}</strong>)}
                  </div>
                )}
                {result.plan.portfolio_note && <p className="portfolio-note">{result.plan.portfolio_note}</p>}
              </article>

              <aside className="agent-risk-card">
                <p className="eyebrow">RISK ENGINE</p>
                {Object.entries(result.risk).map(([key, value]) => (
                  <div className="agent-kv" key={key}>
                    <span>{key.replaceAll("_", " ")}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </aside>
            </div>

            <div className="agent-section-head">
              <div><p className="eyebrow">AGENT COMMITTEE</p><h3>Independent views</h3></div>
            </div>
            <div className="agent-cards-grid">
              {result.agents.map((agent) => (
                <article className="agent-view-card" key={agent.name}>
                  <div className="agent-view-top">
                    <strong>{agent.name}</strong>
                    <span className={stanceClass(agent.stance)}>{agent.stance}</span>
                  </div>
                  <div className="confidence-bar"><span style={{ width: `${agent.confidence}%` }} /></div>
                  <small>{agent.confidence}% confidence</small>
                  <p>{agent.summary}</p>
                  {agent.evidence.slice(0, 3).map((item) => <em key={item}>• {item}</em>)}
                </article>
              ))}
            </div>

            <div className="agent-section-head">
              <div><p className="eyebrow">RESEARCH EVIDENCE</p><h3>{result.sources.length} sources used</h3></div>
            </div>
            <div className="source-list">
              {result.sources.map((source) => (
                <a className="source-row" href={source.url} target="_blank" rel="noreferrer" key={source.url + source.title}>
                  <div>
                    <strong>{source.title}</strong>
                    <small>{source.publisher || source.source_type}{source.published_at ? ` · ${source.published_at}` : ""}</small>
                  </div>
                  <p>{source.relevance}</p>
                </a>
              ))}
            </div>

            {result.caveats.length > 0 && (
              <div className="agent-caveats">
                <strong>Limitations & caveats</strong>
                {result.caveats.map((item) => <span key={item}>• {item}</span>)}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
