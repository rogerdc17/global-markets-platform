import Link from "next/link";
import { stockProfiles } from "@/lib/marketData";

export default function MyStocksPage() {
  const watchlist = stockProfiles.slice(0, 6);

  return (
    <main>
      <header className="nav-shell">
        <Link className="brand" href="/" aria-label="Bharat Markets home">
          <span className="brand-mark">BM</span>
          <span>Bharat Markets</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          <Link href="/">LiveMarket</Link>
          <Link className="active" href="/my-stocks">MyStocks</Link>
          <Link href="/trading-agent">TradingAgent</Link>
          <Link href="/#indices">Indices</Link>
        </nav>
        <div className="session-pill"><span className="pulse" />Concept mode</div>
      </header>

      <section className="workspace-shell">
        <p className="eyebrow">PERSONAL WORKSPACE</p>
        <h1 className="workspace-title">MyStocks</h1>
        <p className="workspace-sub">Your personal watchlist, saved ideas and quick market checks in one place.</p>

        <div className="workspace-grid">
          <section className="stocks-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">WATCHLIST</p><h2>Saved stocks</h2></div>
              <span className="preview-tag">Concept</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Company</th><th>Sector</th><th className="num">Price</th><th className="num">Change %</th></tr></thead>
                <tbody>
                  {watchlist.map((stock) => (
                    <tr key={stock.symbol}>
                      <td>
                        <div className="company-cell">
                          <span className="logo-chip">{stock.symbol.slice(0,2)}</span>
                          <span>
                            <Link className="stock-link" href={`/stocks/${stock.symbol.toLowerCase()}`}>{stock.symbol}</Link>
                            <small>{stock.name}</small>
                          </span>
                        </div>
                      </td>
                      <td className="muted">{stock.sector}</td>
                      <td className="num price">₹{stock.price.toLocaleString("en-IN")}</td>
                      <td className="num"><span className={`change-chip ${stock.changePct >= 0 ? "positive" : "negative"}`}>{stock.changePct >= 0 ? "+" : ""}{stock.changePct.toFixed(2)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="side-card">
            <div className="side-title"><h3>Portfolio tools</h3></div>
            <div className="status-row"><span>Watchlists</span><strong>Coming next</strong></div>
            <div className="status-row"><span>Price alerts</span><strong>Coming next</strong></div>
            <div className="status-row"><span>Notes</span><strong>Coming next</strong></div>
            <div className="status-row"><span>Holdings import</span><strong>Later</strong></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
