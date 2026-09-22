"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { getMyPortfolio, PortfolioPayload } from "@/lib/clientRecords";
import { getSession } from "@/lib/auth";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function PerformancePage() {
  const [role, setRole] = useState<"internal" | "client" | null>(null);
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setRole(getSession()?.role || "internal");
  }, []);

  useEffect(() => {
    if (role !== "client") return;
    getMyPortfolio().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load performance."));
  }, [role]);

  const activity = useMemo(() => {
    if (!data) return [];
    let cumulative = 0;
    return [...data.trades]
      .sort((a, b) => a.executed_at.localeCompare(b.executed_at))
      .map((t) => {
        cumulative += t.side === "BUY" ? t.price * t.quantity + t.fees : -(t.price * t.quantity - t.fees);
        return { date: new Date(t.executed_at).toLocaleDateString(), value: cumulative };
      });
  }, [data]);

  if (!role) {
    return (
      <main>
        <Header active="performance" status="Loading analytics" />
        <section className="workspace-shell"><div className="empty-state">Loading performance workspace…</div></section>
      </main>
    );
  }

  if (role === "internal") {
    return (
      <main>
        <Header active="performance" status="Internal analytics" />
        <section className="workspace-shell">
          <p className="eyebrow">INTERNAL · ANALYTICS</p>
          <h1 className="workspace-title">Performance</h1>
          <p className="workspace-sub">
            Performance analytics will aggregate company and client records here. Current records are ready; live mark-to-market and historical benchmarking will activate once the market data backend is connected.
          </p>
          <div className="about-grid performance-cards">
            <article><span>01</span><h2>Portfolio analytics</h2><p>Cost basis, realized returns, fees, holdings concentration and client-level comparisons.</p></article>
            <article><span>02</span><h2>Research outcomes</h2><p>Track what TradingAgent concluded, what was acted on externally, and how those ideas performed later.</p></article>
            <article><span>03</span><h2>Market-aware reporting</h2><p>Once live and historical feeds are connected, calculate unrealized P&amp;L, drawdown, allocation and equity curves.</p></article>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Header active="performance" status="Client analytics" />
      <section className="workspace-shell">
        <p className="eyebrow">CLIENT · PERFORMANCE</p>
        <h1 className="workspace-title">Performance</h1>
        <p className="workspace-sub">
          Transparent record-based analytics from your externally executed transactions. Live mark-to-market performance will appear when the production market feed is connected.
        </p>
        {error && <div className="agent-error record-error">{error}</div>}
        {data && (
          <>
            <div className="portfolio-summary">
              <article><span>Recorded cost</span><strong>{money(data.summary.invested_cost)}</strong></article>
              <article><span>Realized P&amp;L</span><strong className={data.summary.realized_pnl >= 0 ? "up" : "down"}>{money(data.summary.realized_pnl)}</strong></article>
              <article><span>Fees</span><strong>{money(data.summary.fees)}</strong></article>
              <article><span>Transactions</span><strong>{data.summary.trade_count}</strong></article>
            </div>
            <section className="performance-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">CAPITAL ACTIVITY</p><h2>Recorded net capital flow</h2></div>
              </div>
              <div className="activity-timeline">
                {activity.length ? activity.map((point, index) => (
                  <div className="activity-row" key={index}>
                    <span>{point.date}</span>
                    <div className="activity-track"><i style={{ width: `${Math.min(100, Math.max(4, Math.abs(point.value) / Math.max(...activity.map(a => Math.abs(a.value)), 1) * 100))}%` }} /></div>
                    <strong>{money(point.value)}</strong>
                  </div>
                )) : <div className="empty-state">No transaction activity recorded.</div>}
              </div>
              <div className="concept-disclaimer">This chart shows recorded net capital flow, not investment return or live portfolio value.</div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
