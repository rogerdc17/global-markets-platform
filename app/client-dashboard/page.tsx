"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { getMyPortfolio, PortfolioPayload } from "@/lib/clientRecords";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function ClientDashboardPage() {
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyPortfolio()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load your portfolio."));
  }, []);

  return (
    <main>
      <Header active="portfolio" status="Client portal" />
      <section className="workspace-shell">
        <p className="eyebrow">CLIENT PORTAL</p>
        <h1 className="workspace-title">Welcome{data?.client.name ? `, ${data.client.name}` : ""}</h1>
        <p className="workspace-sub">
          A read-only view of the investments and transactions recorded for your portfolio. All trades are executed outside DP Alpha.
        </p>

        {error && <div className="agent-error record-error">{error}</div>}

        {data && (
          <>
            <div className="portfolio-summary">
              <article><span>Recorded cost</span><strong>{money(data.summary.invested_cost)}</strong></article>
              <article><span>Open holdings</span><strong>{data.summary.positions.length}</strong></article>
              <article><span>Transactions</span><strong>{data.summary.trade_count}</strong></article>
              <article><span>Realized P&amp;L</span><strong className={data.summary.realized_pnl >= 0 ? "up" : "down"}>{money(data.summary.realized_pnl)}</strong></article>
              <article><span>Recorded fees</span><strong>{money(data.summary.fees)}</strong></article>
            </div>

            <div className="client-dashboard-grid">
              <section className="stocks-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">MY PORTFOLIO</p><h2>Current recorded holdings</h2></div>
                  <span className="preview-tag">Read only</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Stock</th><th className="num">Quantity</th><th className="num">Average cost</th><th className="num">Cost basis</th></tr></thead>
                    <tbody>
                      {data.summary.positions.map((p) => (
                        <tr key={p.symbol}>
                          <td><strong>{p.symbol}</strong></td>
                          <td className="num">{p.quantity}</td>
                          <td className="num">{money(p.avg_cost)}</td>
                          <td className="num">{money(p.quantity * p.avg_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.summary.positions.length === 0 && <div className="empty-state">No open holdings are recorded yet.</div>}
                </div>
              </section>

              <aside className="side-card client-info-card">
                <p className="eyebrow">HOW TO READ THIS</p>
                <h3>Records, not execution</h3>
                <p>DP Alpha shows research, portfolio records and reporting. It does not place or route trades.</p>
                <div className="client-info-row"><span>Portfolio owner</span><strong>{data.client.name}</strong></div>
                <div className="client-info-row"><span>Access</span><strong>Read only</strong></div>
                <div className="client-info-row"><span>Execution</span><strong>External</strong></div>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
