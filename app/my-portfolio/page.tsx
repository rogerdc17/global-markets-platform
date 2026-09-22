"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { getMyPortfolio, PortfolioPayload } from "@/lib/clientRecords";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function MyPortfolioPage() {
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyPortfolio().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load portfolio."));
  }, []);

  return (
    <main>
      <Header active="portfolio" status="Read-only portfolio" />
      <section className="workspace-shell">
        <p className="eyebrow">CLIENT · PORTFOLIO</p>
        <h1 className="workspace-title">MyPortfolio</h1>
        <p className="workspace-sub">Your recorded holdings and cost basis, maintained by the internal DP Alpha team from externally completed transactions.</p>
        {error && <div className="agent-error record-error">{error}</div>}
        {data && (
          <>
            <div className="portfolio-summary">
              <article><span>Recorded cost</span><strong>{money(data.summary.invested_cost)}</strong></article>
              <article><span>Open holdings</span><strong>{data.summary.positions.length}</strong></article>
              <article><span>Realized P&amp;L</span><strong className={data.summary.realized_pnl >= 0 ? "up" : "down"}>{money(data.summary.realized_pnl)}</strong></article>
              <article><span>Fees</span><strong>{money(data.summary.fees)}</strong></article>
            </div>
            <section className="stocks-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">HOLDINGS</p><h2>Recorded positions</h2></div>
                <span className="preview-tag">Read only</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Symbol</th><th className="num">Quantity</th><th className="num">Average cost</th><th className="num">Cost basis</th><th>Record status</th></tr></thead>
                  <tbody>
                    {data.summary.positions.map((p) => (
                      <tr key={p.symbol}>
                        <td><strong>{p.symbol}</strong></td>
                        <td className="num">{p.quantity}</td>
                        <td className="num">{money(p.avg_cost)}</td>
                        <td className="num">{money(p.avg_cost * p.quantity)}</td>
                        <td><span className="record-status">OPEN</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.summary.positions.length === 0 && <div className="empty-state">No holdings recorded.</div>}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
