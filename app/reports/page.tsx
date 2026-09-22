"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { getMyPortfolio, PortfolioPayload } from "@/lib/clientRecords";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function ReportsPage() {
  const [data, setData] = useState<PortfolioPayload | null>(null);

  useEffect(() => { getMyPortfolio().then(setData).catch(() => {}); }, []);

  return (
    <main>
      <Header active="reports" status="Client reports" />
      <section className="workspace-shell report-shell">
        <p className="eyebrow">CLIENT · REPORTS</p>
        <h1 className="workspace-title">Portfolio Report</h1>
        <p className="workspace-sub">A printable summary of the portfolio records maintained in DP Alpha.</p>

        {data && (
          <section className="report-card">
            <div className="report-head">
              <div><strong>DP Alpha</strong><span>Client portfolio record</span></div>
              <button className="primary-btn print-button" onClick={() => window.print()}>Print report</button>
            </div>
            <div className="report-client">
              <span>Client</span><strong>{data.client.name}</strong>
            </div>
            <div className="portfolio-summary report-summary">
              <article><span>Recorded cost</span><strong>{money(data.summary.invested_cost)}</strong></article>
              <article><span>Realized P&amp;L</span><strong>{money(data.summary.realized_pnl)}</strong></article>
              <article><span>Fees</span><strong>{money(data.summary.fees)}</strong></article>
              <article><span>Transactions</span><strong>{data.summary.trade_count}</strong></article>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Holding</th><th className="num">Quantity</th><th className="num">Avg cost</th><th className="num">Cost basis</th></tr></thead>
                <tbody>
                  {data.summary.positions.map((p) => (
                    <tr key={p.symbol}>
                      <td><strong>{p.symbol}</strong></td><td className="num">{p.quantity}</td><td className="num">{money(p.avg_cost)}</td><td className="num">{money(p.avg_cost * p.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="report-note">DP Alpha is a research, reporting and record-keeping platform. Transactions shown here were executed outside this application.</p>
          </section>
        )}
      </section>
    </main>
  );
}
