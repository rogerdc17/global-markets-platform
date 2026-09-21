"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Stock = {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
};

const indexCards = [
  { name: "NIFTY 50", value: "25,327.05", change: "+0.36%", positive: true },
  { name: "SENSEX", value: "82,626.23", change: "+0.29%", positive: true },
  { name: "BANK NIFTY", value: "55,458.85", change: "-0.18%", positive: false },
  { name: "NIFTY IT", value: "35,914.40", change: "+0.62%", positive: true },
];

const stocks: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", sector: "Energy", price: 1422.80, change: 16.40, changePct: 1.17, volume: "9.4M" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "Technology", price: 3158.70, change: -24.60, changePct: -0.77, volume: "2.1M" },
  { symbol: "INFY", name: "Infosys", exchange: "NSE", sector: "Technology", price: 1489.25, change: 13.75, changePct: 0.93, volume: "5.6M" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE", sector: "Banking", price: 972.10, change: 5.90, changePct: 0.61, volume: "12.8M" },
  { symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE", sector: "Banking", price: 1396.40, change: -7.30, changePct: -0.52, volume: "8.2M" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE", sector: "Banking", price: 853.65, change: 11.20, changePct: 1.33, volume: "18.4M" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE", sector: "Telecom", price: 1916.80, change: 9.45, changePct: 0.50, volume: "4.8M" },
  { symbol: "ITC", name: "ITC", exchange: "NSE", sector: "Consumer", price: 418.35, change: -2.15, changePct: -0.51, volume: "14.6M" },
  { symbol: "LT", name: "Larsen & Toubro", exchange: "NSE", sector: "Industrials", price: 3671.20, change: 42.30, changePct: 1.17, volume: "1.7M" },
  { symbol: "TATAMOTORS", name: "Tata Motors", exchange: "NSE", sector: "Automotive", price: 709.90, change: -9.80, changePct: -1.36, volume: "10.1M" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", exchange: "NSE", sector: "Healthcare", price: 1664.55, change: 18.30, changePct: 1.11, volume: "2.4M" },
  { symbol: "MARUTI", name: "Maruti Suzuki India", exchange: "NSE", sector: "Automotive", price: 14532.00, change: 121.00, changePct: 0.84, volume: "0.5M" }
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);

export default function Home() {
  const [exchange, setExchange] = useState("All");
  const [sector, setSector] = useState("All sectors");
  const [query, setQuery] = useState("");

  const sectors = ["All sectors", ...Array.from(new Set(stocks.map((s) => s.sector)))];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stocks.filter((stock) => {
      const exchangeMatch = exchange === "All" || stock.exchange === exchange;
      const sectorMatch = sector === "All sectors" || stock.sector === sector;
      const queryMatch =
        !q ||
        stock.symbol.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.sector.toLowerCase().includes(q);
      return exchangeMatch && sectorMatch && queryMatch;
    });
  }, [exchange, sector, query]);

  const gainers = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 4);
  const losers = [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 4);

  return (
    <main>
      <header className="nav-shell">
        <a className="brand" href="#" aria-label="Bharat Markets home">
          <span className="brand-mark">BM</span>
          <span>Bharat Markets</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary">
          <Link className="active" href="/">LiveMarket</Link>
          <Link href="/my-stocks">MyStocks</Link>
          <Link href="/trading-agent">TradingAgent</Link>
          <a href="#indices">Indices</a>
          <a href="#about">About</a>
        </nav>

        <div className="session-pill">
          <span className="pulse" />
          NSE session
        </div>
      </header>

      <section className="index-strip" id="indices" aria-label="Major Indian indices">
        <div className="index-strip-inner">
          {indexCards.map((index) => (
            <article className="index-mini" key={index.name}>
              <span>{index.name}</span>
              <strong>{index.value}</strong>
              <em className={index.positive ? "up" : "down"}>{index.change}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="hero" id="overview">
        <div className="hero-copy">
          <p className="eyebrow">INDIA MARKET INTELLIGENCE</p>
          <h1>Indian markets.<br />One clear view.</h1>
          <p className="hero-sub">
            Follow NSE and BSE equities, major indices, market movers and sector activity from a clean, focused trading workspace.
          </p>
          <div className="hero-actions">
            <a className="primary-btn" href="#stocks">Explore markets</a>
            <span className="demo-note">MVP interface · live feed coming next</span>
          </div>
        </div>

        <div className="market-pulse-card">
          <div className="card-kicker">MARKET PULSE</div>
          <div className="pulse-row">
            <span>Advancing</span>
            <strong className="up">1,284</strong>
          </div>
          <div className="pulse-row">
            <span>Declining</span>
            <strong className="down">934</strong>
          </div>
          <div className="pulse-row">
            <span>Unchanged</span>
            <strong>118</strong>
          </div>
          <div className="breadth">
            <span style={{ width: "58%" }} />
          </div>
          <small>Market breadth preview</small>
        </div>
      </section>

      <section className="dashboard" id="stocks">
        <div className="stocks-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">MARKET WATCH</p>
              <h2>Indian equities</h2>
            </div>
            <span className="preview-tag">Preview data</span>
          </div>

          <div className="filters">
            <div className="exchange-tabs" aria-label="Exchange filter">
              {["All", "NSE", "BSE"].map((item) => (
                <button
                  key={item}
                  className={exchange === item ? "selected" : ""}
                  onClick={() => setExchange(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            <select
              aria-label="Sector filter"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              {sectors.map((item) => <option key={item}>{item}</option>)}
            </select>

            <label className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search stocks"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Exchange</th>
                  <th>Sector</th>
                  <th className="num">Price</th>
                  <th className="num">Change</th>
                  <th className="num">Change %</th>
                  <th className="num">Volume</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((stock) => (
                  <tr key={stock.symbol}>
                    <td>
                      <div className="company-cell">
                        <span className="logo-chip">{stock.symbol.slice(0, 2)}</span>
                        <span>
                          <Link className="stock-link" href={`/stocks/${stock.symbol.toLowerCase()}`}>{stock.symbol}</Link>
                          <small>{stock.name}</small>
                        </span>
                      </div>
                    </td>
                    <td><span className="exchange-badge">{stock.exchange}</span></td>
                    <td className="muted">{stock.sector}</td>
                    <td className="num price"><Link className="price-link" href={`/stocks/${stock.symbol.toLowerCase()}`}>{formatPrice(stock.price)}</Link></td>
                    <td className={`num ${stock.change >= 0 ? "up" : "down"}`}>
                      {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}
                    </td>
                    <td className="num">
                      <span className={`change-chip ${stock.changePct >= 0 ? "positive" : "negative"}`}>
                        {stock.changePct >= 0 ? "+" : ""}{stock.changePct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="num muted">{stock.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">No stocks match your filters.</div>
            )}
          </div>
        </div>

        <aside className="side-column" id="movers">
          <section className="side-card">
            <div className="side-title">
              <h3>Top movers</h3>
              <span>Today</span>
            </div>

            <p className="list-label">GAINERS</p>
            {gainers.map((stock) => (
              <div className="mover-row" key={`g-${stock.symbol}`}>
                <div>
                  <strong>{stock.symbol}</strong>
                  <small>{stock.sector}</small>
                </div>
                <span className="up">+{stock.changePct.toFixed(2)}%</span>
              </div>
            ))}

            <p className="list-label losses">LOSERS</p>
            {losers.map((stock) => (
              <div className="mover-row" key={`l-${stock.symbol}`}>
                <div>
                  <strong>{stock.symbol}</strong>
                  <small>{stock.sector}</small>
                </div>
                <span className="down">{stock.changePct.toFixed(2)}%</span>
              </div>
            ))}
          </section>

          <section className="side-card">
            <div className="side-title"><h3>Market status</h3></div>
            <div className="status-row"><span>NSE</span><strong className="open">Open</strong></div>
            <div className="status-row"><span>BSE</span><strong className="open">Open</strong></div>
            <div className="status-row"><span>Currency</span><strong>Closed</strong></div>
            <div className="status-row"><span>Commodity</span><strong>Closed</strong></div>
          </section>
        </aside>
      </section>

      <section className="roadmap" id="about">
        <div>
          <p className="eyebrow">MVP ROADMAP</p>
          <h2>Built to grow into a complete market platform.</h2>
        </div>
        <div className="roadmap-grid">
          <article><span>01</span><strong>Live NSE/BSE data</strong><small>Licensed price feeds and index updates.</small></article>
          <article><span>02</span><strong>Stock detail pages</strong><small>Charts, range data, fundamentals and volume.</small></article>
          <article><span>03</span><strong>Watchlists & alerts</strong><small>Personalized instruments and price triggers.</small></article>
          <article><span>04</span><strong>Global expansion</strong><small>US, Canada, Europe, Asia, FX and crypto.</small></article>
        </div>
      </section>

      <footer>
        <strong>Bharat Markets</strong>
        <span>First interface build. Prices and market status shown here are sample values until a licensed live market-data feed is connected.</span>
      </footer>
    </main>
  );
}
