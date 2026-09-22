"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import {
  ClientRecord,
  PortfolioPayload,
  createClient,
  getClientPortfolio,
  listClients,
  recordClientTrade,
} from "@/lib/clientRecords";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function ClientPortfoliosPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selected, setSelected] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [executedAt, setExecutedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [strategy, setStrategy] = useState("");
  const [note, setNote] = useState("");
  const [researchRunId, setResearchRunId] = useState("");

  async function refreshClients(preferred?: string) {
    const data = await listClients();
    setClients(data.clients);
    const next = preferred || selected || data.clients[0]?.id || "";
    setSelected(next);
    if (next) setPortfolio(await getClientPortfolio(next));
  }

  useEffect(() => {
    refreshClients().catch((e) => setError(e instanceof Error ? e.message : "Could not load clients."));
  }, []);

  useEffect(() => {
    if (!selected) return;
    getClientPortfolio(selected)
      .then(setPortfolio)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load portfolio."));
  }, [selected]);

  async function addNewClient(e: FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) return;
    setBusy(true); setError("");
    try {
      const client = await createClient(clientName.trim(), clientNotes.trim());
      setClientName(""); setClientNotes("");
      await refreshClients(client.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create client.");
    } finally { setBusy(false); }
  }

  async function recordTrade(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true); setError("");
    try {
      await recordClientTrade({
        client_id: selected,
        symbol: symbol.trim().toUpperCase(),
        side,
        quantity: Number(quantity),
        price: Number(price),
        fees: Number(fees || 0),
        executed_at: new Date(executedAt).toISOString(),
        strategy: strategy.trim(),
        note: note.trim(),
        research_run_id: researchRunId.trim() || null,
      });
      setSymbol(""); setQuantity(""); setPrice(""); setFees("0"); setStrategy(""); setNote(""); setResearchRunId("");
      setPortfolio(await getClientPortfolio(selected));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record transaction.");
    } finally { setBusy(false); }
  }

  const client = useMemo(() => clients.find((c) => c.id === selected), [clients, selected]);

  return (
    <main>
      <Header active="clients" status="Internal records" />
      <section className="workspace-shell">
        <p className="eyebrow">INTERNAL · CLIENT RECORDS</p>
        <h1 className="workspace-title">Client Portfolios</h1>
        <p className="workspace-sub">
          Record transactions completed outside DP Alpha and maintain a transparent portfolio history for each client. DP Alpha does not execute trades.
        </p>

        {error && <div className="agent-error record-error">{error}</div>}

        <div className="record-toolbar">
          <label>
            Active client
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {clients.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}
            </select>
          </label>
          <span className="record-mode">RECORD-KEEPING ONLY · NO EXECUTION</span>
        </div>

        {portfolio && (
          <div className="portfolio-summary">
            <article><span>Client</span><strong>{client?.name || portfolio.client.name}</strong></article>
            <article><span>Recorded cost</span><strong>{money(portfolio.summary.invested_cost)}</strong></article>
            <article><span>Realized P&amp;L</span><strong className={portfolio.summary.realized_pnl >= 0 ? "up" : "down"}>{money(portfolio.summary.realized_pnl)}</strong></article>
            <article><span>Recorded fees</span><strong>{money(portfolio.summary.fees)}</strong></article>
            <article><span>Open holdings</span><strong>{portfolio.summary.positions.length}</strong></article>
            <article><span>Transactions</span><strong>{portfolio.summary.trade_count}</strong></article>
          </div>
        )}

        <div className="record-layout">
          <section className="stocks-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">CLIENT HOLDINGS</p><h2>{client?.name || "Portfolio"}</h2></div>
              <span className="preview-tag">Read from shared record</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Symbol</th><th className="num">Quantity</th><th className="num">Average recorded cost</th><th className="num">Recorded cost basis</th></tr></thead>
                <tbody>
                  {portfolio?.summary.positions.map((p) => (
                    <tr key={p.symbol}>
                      <td><strong>{p.symbol}</strong></td>
                      <td className="num">{p.quantity}</td>
                      <td className="num">{money(p.avg_cost)}</td>
                      <td className="num">{money(p.avg_cost * p.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {portfolio && portfolio.summary.positions.length === 0 && <div className="empty-state">No open holdings recorded.</div>}
            </div>

            <div className="panel-heading ledger-heading">
              <div><p className="eyebrow">TRANSACTION HISTORY</p><h2>Externally executed trades</h2></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Symbol</th><th>Side</th><th className="num">Qty</th><th className="num">Price</th><th className="num">Fees</th><th>Strategy</th><th>Research</th></tr></thead>
                <tbody>
                  {[...(portfolio?.trades || [])].reverse().map((t) => (
                    <tr key={t.id}>
                      <td className="muted">{new Date(t.executed_at).toLocaleString()}</td>
                      <td><strong>{t.symbol}</strong></td>
                      <td><span className={`trade-side ${t.side === "BUY" ? "buy" : "sell"}`}>{t.side}</span></td>
                      <td className="num">{t.quantity}</td>
                      <td className="num">{money(t.price)}</td>
                      <td className="num">{money(t.fees)}</td>
                      <td className="muted">{t.strategy || "—"}</td>
                      <td className="muted">{t.research_run_id || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="record-side">
            <form className="side-card position-form" onSubmit={recordTrade}>
              <div className="side-title"><h3>Record external trade</h3></div>
              <label>Symbol<input required value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="RELIANCE" /></label>
              <label>Side<select value={side} onChange={(e) => setSide(e.target.value as "BUY" | "SELL")}><option>BUY</option><option>SELL</option></select></label>
              <label>Quantity<input required type="number" min="0.0001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
              <label>Execution price<input required type="number" min="0.01" step="any" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
              <label>Fees<input type="number" min="0" step="any" value={fees} onChange={(e) => setFees(e.target.value)} /></label>
              <label>Executed at<input required type="datetime-local" value={executedAt} onChange={(e) => setExecutedAt(e.target.value)} /></label>
              <label>Strategy<input value={strategy} onChange={(e) => setStrategy(e.target.value)} placeholder="Swing / Investment" /></label>
              <label>Research run ID<input value={researchRunId} onChange={(e) => setResearchRunId(e.target.value)} placeholder="Optional" /></label>
              <label>Internal note<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this external transaction was recorded" /></label>
              <button className="primary-btn position-submit" disabled={busy || !selected} type="submit">{busy ? "Saving…" : "Record transaction"}</button>
              <small className="record-disclaimer">This creates a record only. It does not place, route, modify or cancel an order.</small>
            </form>

            <form className="side-card position-form" onSubmit={addNewClient}>
              <div className="side-title"><h3>Add client record</h3></div>
              <label>Client name<input required value={clientName} onChange={(e) => setClientName(e.target.value)} /></label>
              <label>Notes<textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} /></label>
              <button className="primary-btn position-submit" disabled={busy} type="submit">Create client</button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
