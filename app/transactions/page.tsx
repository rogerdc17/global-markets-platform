"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { getMyPortfolio, PortfolioPayload } from "@/lib/clientRecords";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function TransactionsPage() {
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyPortfolio().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load transactions."));
  }, []);

  return (
    <main>
      <Header active="transactions" status="Read-only history" />
      <section className="workspace-shell">
        <p className="eyebrow">CLIENT · RECORDS</p>
        <h1 className="workspace-title">Transactions</h1>
        <p className="workspace-sub">A chronological record of transactions entered by the internal team after execution outside DP Alpha.</p>
        {error && <div className="agent-error record-error">{error}</div>}
        <section className="stocks-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">HISTORY</p><h2>Recorded external trades</h2></div>
            <span className="preview-tag">No trading controls</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Symbol</th><th>Side</th><th className="num">Quantity</th><th className="num">Execution price</th><th className="num">Fees</th><th>Strategy</th></tr></thead>
              <tbody>
                {[...(data?.trades || [])].reverse().map((t) => (
                  <tr key={t.id}>
                    <td className="muted">{new Date(t.executed_at).toLocaleString()}</td>
                    <td><strong>{t.symbol}</strong></td>
                    <td><span className={`trade-side ${t.side === "BUY" ? "buy" : "sell"}`}>{t.side}</span></td>
                    <td className="num">{t.quantity}</td>
                    <td className="num">{money(t.price)}</td>
                    <td className="num">{money(t.fees)}</td>
                    <td className="muted">{t.strategy || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && data.trades.length === 0 && <div className="empty-state">No transactions recorded yet.</div>}
          </div>
        </section>
      </section>
    </main>
  );
}
