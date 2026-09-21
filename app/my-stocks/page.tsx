"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";

type Trade = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  currentPrice: number;
  fees: number;
  strategy: string;
  note: string;
  executedAt: string;
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const starterTrades: Trade[] = [];

export default function MyStocksPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [strategy, setStrategy] = useState("Swing");
  const [note, setNote] = useState("");

  useEffect(() => {
    const newer = window.localStorage.getItem("dp-alpha-trades");
    const legacy = window.localStorage.getItem("bharat-markets-positions");

    if (newer) {
      setTrades(JSON.parse(newer));
    } else if (legacy) {
      try {
        const migrated = JSON.parse(legacy).map((p: any) => ({
          id: p.id || crypto.randomUUID(),
          symbol: p.symbol,
          side: p.side || "BUY",
          quantity: p.quantity,
          price: p.entryPrice,
          currentPrice: p.currentPrice,
          fees: 0,
          strategy: "Legacy",
          note: p.note || "",
          executedAt: new Date().toISOString(),
        }));
        setTrades(migrated);
      } catch {
        setTrades(starterTrades);
      }
    } else {
      setTrades(starterTrades);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem("dp-alpha-trades", JSON.stringify(trades));

      const openPositions = Object.values(
        trades.reduce<Record<string, {symbol:string; side:"BUY"|"SELL"; quantity:number; entryPrice:number; currentPrice:number; note:string; id:string}>>(
          (acc, trade) => {
            if (!acc[trade.symbol]) {
              acc[trade.symbol] = {
                id: trade.symbol,
                symbol: trade.symbol,
                side: "BUY",
                quantity: 0,
                entryPrice: 0,
                currentPrice: trade.currentPrice,
                note: trade.strategy,
              };
            }
            const position = acc[trade.symbol];
            if (trade.side === "BUY") {
              const oldCost = position.entryPrice * position.quantity;
              const newQty = position.quantity + trade.quantity;
              position.entryPrice = newQty ? (oldCost + trade.price * trade.quantity) / newQty : 0;
              position.quantity = newQty;
            } else {
              position.quantity = Math.max(0, position.quantity - trade.quantity);
            }
            position.currentPrice = trade.currentPrice;
            return acc;
          },
          {}
        )
      ).filter((p) => p.quantity > 0);

      window.localStorage.setItem("bharat-markets-positions", JSON.stringify(openPositions));
    }
  }, [trades, loaded]);

  const analytics = useMemo(() => {
    const bySymbol: Record<string, {
      quantity: number;
      avgCost: number;
      currentPrice: number;
      realized: number;
      fees: number;
      buys: number;
      sells: number;
    }> = {};

    let totalFees = 0;
    let realized = 0;

    for (const trade of trades) {
      if (!bySymbol[trade.symbol]) {
        bySymbol[trade.symbol] = {
          quantity: 0,
          avgCost: 0,
          currentPrice: trade.currentPrice,
          realized: 0,
          fees: 0,
          buys: 0,
          sells: 0,
        };
      }

      const p = bySymbol[trade.symbol];
      p.currentPrice = trade.currentPrice;
      p.fees += trade.fees;
      totalFees += trade.fees;

      if (trade.side === "BUY") {
        const oldCost = p.avgCost * p.quantity;
        const nextQty = p.quantity + trade.quantity;
        p.avgCost = nextQty ? (oldCost + trade.price * trade.quantity) / nextQty : 0;
        p.quantity = nextQty;
        p.buys += 1;
      } else {
        const sellQty = Math.min(trade.quantity, p.quantity);
        const tradeRealized = (trade.price - p.avgCost) * sellQty - trade.fees;
        p.realized += tradeRealized;
        realized += tradeRealized;
        p.quantity -= sellQty;
        p.sells += 1;
      }
    }

    let invested = 0;
    let marketValue = 0;
    let unrealized = 0;

    const positions = Object.entries(bySymbol)
      .filter(([, p]) => p.quantity > 0)
      .map(([symbol, p]) => {
        const cost = p.avgCost * p.quantity;
        const value = p.currentPrice * p.quantity;
        const pnl = value - cost;
        invested += cost;
        marketValue += value;
        unrealized += pnl;

        return {
          symbol,
          quantity: p.quantity,
          avgCost: p.avgCost,
          currentPrice: p.currentPrice,
          value,
          pnl,
          pnlPct: cost ? (pnl / cost) * 100 : 0,
        };
      });

    return {
      invested,
      marketValue,
      unrealized,
      realized,
      totalFees,
      positions,
      totalPnl: realized + unrealized,
    };
  }, [trades]);

  function addTrade(e: FormEvent) {
    e.preventDefault();

    const qty = Number(quantity);
    const tradePrice = Number(price);
    const mark = Number(currentPrice || price);
    const tradeFees = Number(fees || 0);

    if (!symbol.trim() || qty <= 0 || tradePrice <= 0 || mark <= 0) return;

    setTrades((items) => [
      {
        id: crypto.randomUUID(),
        symbol: symbol.trim().toUpperCase(),
        side,
        quantity: qty,
        price: tradePrice,
        currentPrice: mark,
        fees: Math.max(0, tradeFees),
        strategy: strategy.trim() || "Unclassified",
        note: note.trim(),
        executedAt: new Date().toISOString(),
      },
      ...items,
    ]);

    setSymbol("");
    setQuantity("");
    setPrice("");
    setCurrentPrice("");
    setFees("0");
    setNote("");
  }

  return (
    <main>
      <Header active="stocks" status="Trade ledger" />

      <section className="workspace-shell">
        <p className="eyebrow">DP ALPHA · PORTFOLIO RECORD</p>
        <h1 className="workspace-title">MyStocks</h1>
        <p className="workspace-sub">
          Dharmin&apos;s private trading ledger: every buy and sell, open position, realized and unrealized P&amp;L, fees and strategy notes in one place.
        </p>

        <div className="portfolio-summary">
          <article><span>Invested</span><strong>{currency(analytics.invested)}</strong></article>
          <article><span>Market value</span><strong>{currency(analytics.marketValue)}</strong></article>
          <article><span>Unrealized P&amp;L</span><strong className={analytics.unrealized >= 0 ? "up" : "down"}>{currency(analytics.unrealized)}</strong></article>
          <article><span>Realized P&amp;L</span><strong className={analytics.realized >= 0 ? "up" : "down"}>{currency(analytics.realized)}</strong></article>
          <article><span>Total P&amp;L</span><strong className={analytics.totalPnl >= 0 ? "up" : "down"}>{currency(analytics.totalPnl)}</strong></article>
          <article><span>Fees</span><strong>{currency(analytics.totalFees)}</strong></article>
          <article><span>Open positions</span><strong>{analytics.positions.length}</strong></article>
          <article><span>Trades</span><strong>{trades.length}</strong></article>
        </div>

        <div className="workspace-grid">
          <section className="stocks-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">OPEN POSITIONS</p><h2>Current holdings</h2></div>
              <span className="preview-tag">Private record</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th className="num">Qty</th>
                    <th className="num">Avg cost</th>
                    <th className="num">Current</th>
                    <th className="num">Market value</th>
                    <th className="num">P&amp;L</th>
                    <th className="num">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.positions.map((p) => (
                    <tr key={p.symbol}>
                      <td><strong>{p.symbol}</strong></td>
                      <td className="num">{p.quantity}</td>
                      <td className="num">{currency(p.avgCost)}</td>
                      <td className="num">{currency(p.currentPrice)}</td>
                      <td className="num">{currency(p.value)}</td>
                      <td className={`num ${p.pnl >= 0 ? "up" : "down"}`}>{currency(p.pnl)}</td>
                      <td className={`num ${p.pnlPct >= 0 ? "up" : "down"}`}>{p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loaded && analytics.positions.length === 0 && <div className="empty-state">No open positions yet.</div>}
            </div>

            <div className="panel-heading ledger-heading">
              <div><p className="eyebrow">TRADE HISTORY</p><h2>Ledger</h2></div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th className="num">Qty</th>
                    <th className="num">Price</th>
                    <th className="num">Fees</th>
                    <th>Strategy</th>
                    <th>Note</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id}>
                      <td className="muted">{new Date(trade.executedAt).toLocaleString()}</td>
                      <td><strong>{trade.symbol}</strong></td>
                      <td><span className={`trade-side ${trade.side === "BUY" ? "buy" : "sell"}`}>{trade.side}</span></td>
                      <td className="num">{trade.quantity}</td>
                      <td className="num">{currency(trade.price)}</td>
                      <td className="num">{currency(trade.fees)}</td>
                      <td className="muted">{trade.strategy}</td>
                      <td className="muted">{trade.note || "—"}</td>
                      <td className="num">
                        <button className="remove-position" type="button" onClick={() => setTrades((items) => items.filter((item) => item.id !== trade.id))}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loaded && trades.length === 0 && <div className="empty-state">No trades recorded yet. Add Dharmin&apos;s first trade from the form.</div>}
            </div>
          </section>

          <aside className="side-card add-position-card">
            <div className="side-title"><h3>Record a trade</h3></div>
            <form className="position-form" onSubmit={addTrade}>
              <label>Symbol<input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="RELIANCE" /></label>
              <label>Side<select value={side} onChange={(e) => setSide(e.target.value as "BUY" | "SELL")}><option>BUY</option><option>SELL</option></select></label>
              <label>Quantity<input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="25" /></label>
              <label>Trade price<input type="number" min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1420" /></label>
              <label>Current price<input type="number" min="0" step="any" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} placeholder="Uses trade price if blank" /></label>
              <label>Fees<input type="number" min="0" step="any" value={fees} onChange={(e) => setFees(e.target.value)} /></label>
              <label>Strategy<select value={strategy} onChange={(e) => setStrategy(e.target.value)}><option>Swing</option><option>Intraday</option><option>Position</option><option>Investment</option><option>Breakout</option><option>Momentum</option><option>Other</option></select></label>
              <label>Reason / note<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Breakout + volume" /></label>
              <button className="primary-btn position-submit" type="submit">Record trade</button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
