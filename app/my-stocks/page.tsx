"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";

type Position = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  note: string;
};

const starter: Position[] = [
  { id: "1", symbol: "RELIANCE", side: "BUY", quantity: 10, entryPrice: 1388, currentPrice: 1422.8, note: "Core holding" },
  { id: "2", symbol: "INFY", side: "BUY", quantity: 8, entryPrice: 1450, currentPrice: 1489.25, note: "IT exposure" }
];

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function MyStocksPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("bharat-markets-positions");
    setPositions(saved ? JSON.parse(saved) : starter);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem("bharat-markets-positions", JSON.stringify(positions));
    }
  }, [positions, loaded]);

  const totals = useMemo(() => {
    return positions.reduce(
      (acc, p) => {
        const invested = p.entryPrice * p.quantity;
        const marketValue = p.currentPrice * p.quantity;
        const pnl = p.side === "BUY" ? marketValue - invested : invested - marketValue;
        acc.invested += invested;
        acc.marketValue += marketValue;
        acc.pnl += pnl;
        return acc;
      },
      { invested: 0, marketValue: 0, pnl: 0 }
    );
  }, [positions]);

  function addPosition(e: FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    const entry = Number(entryPrice);
    const current = Number(currentPrice || entryPrice);
    if (!symbol.trim() || qty <= 0 || entry <= 0 || current <= 0) return;

    setPositions((items) => [
      {
        id: crypto.randomUUID(),
        symbol: symbol.trim().toUpperCase(),
        side,
        quantity: qty,
        entryPrice: entry,
        currentPrice: current,
        note: note.trim(),
      },
      ...items,
    ]);
    setSymbol("");
    setQuantity("");
    setEntryPrice("");
    setCurrentPrice("");
    setNote("");
  }

  return (
    <main>
      <Header active="stocks" status="Personal workspace" />

      <section className="workspace-shell">
        <p className="eyebrow">PERSONAL TRADING WORKSPACE</p>
        <h1 className="workspace-title">MyStocks</h1>
        <p className="workspace-sub">
          Add the stocks and trades you are currently holding or tracking. For the concept version, your entries are stored only in this browser.
        </p>

        <div className="portfolio-summary">
          <article><span>Invested value</span><strong>{currency(totals.invested)}</strong></article>
          <article><span>Current value</span><strong>{currency(totals.marketValue)}</strong></article>
          <article><span>Open P&amp;L</span><strong className={totals.pnl >= 0 ? "up" : "down"}>{currency(totals.pnl)}</strong></article>
          <article><span>Active positions</span><strong>{positions.length}</strong></article>
        </div>

        <div className="workspace-grid">
          <section className="stocks-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">CURRENT TRADES</p><h2>Your positions</h2></div>
              <span className="preview-tag">Saved locally</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th><th>Side</th><th className="num">Qty</th><th className="num">Entry</th>
                    <th className="num">Current</th><th className="num">P&amp;L</th><th>Note</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const pnl = p.side === "BUY"
                      ? (p.currentPrice - p.entryPrice) * p.quantity
                      : (p.entryPrice - p.currentPrice) * p.quantity;
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.symbol}</strong></td>
                        <td><span className={`trade-side ${p.side === "BUY" ? "buy" : "sell"}`}>{p.side}</span></td>
                        <td className="num">{p.quantity}</td>
                        <td className="num">{currency(p.entryPrice)}</td>
                        <td className="num">{currency(p.currentPrice)}</td>
                        <td className={`num ${pnl >= 0 ? "up" : "down"}`}>{currency(pnl)}</td>
                        <td className="muted">{p.note || "—"}</td>
                        <td className="num">
                          <button className="remove-position" type="button" onClick={() => setPositions((items) => items.filter((item) => item.id !== p.id))}>Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {loaded && positions.length === 0 && <div className="empty-state">No positions yet. Add your first trade from the form.</div>}
            </div>
          </section>

          <aside className="side-card add-position-card">
            <div className="side-title"><h3>Add a trade</h3></div>
            <form className="position-form" onSubmit={addPosition}>
              <label>Symbol<input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="RELIANCE" /></label>
              <label>Side<select value={side} onChange={(e) => setSide(e.target.value as "BUY" | "SELL")}><option>BUY</option><option>SELL</option></select></label>
              <label>Quantity<input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="10" /></label>
              <label>Entry price<input type="number" min="0" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="1400" /></label>
              <label>Current price<input type="number" min="0" step="any" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} placeholder="Optional" /></label>
              <label>Note<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Swing trade" /></label>
              <button className="primary-btn position-submit" type="submit">Add position</button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
