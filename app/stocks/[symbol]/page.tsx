import Link from "next/link";
import Header from "@/components/Header";
import { notFound } from "next/navigation";
import { stockMap, stockProfiles } from "@/lib/marketData";

export function generateStaticParams() {
  return stockProfiles.map((stock) => ({ symbol: stock.symbol.toLowerCase() }));
}

export function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  return params.then(({ symbol }) => {
    const stock = stockMap[symbol.toLowerCase()];
    return {
      title: stock ? `${stock.symbol} · DP Alpha Terminal` : "Stock · DP Alpha Terminal",
      description: stock ? `${stock.name} market overview and chart in DP Alpha Terminal.` : "Indian stock market overview.",
    };
  });
}

function chartPoints(values: number[]) {
  const width = 900;
  const height = 320;
  const padding = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - padding * 2);
      const y = padding + ((max - value) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export default async function StockDetail({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const stock = stockMap[symbol.toLowerCase()];
  if (!stock) notFound();

  const positive = stock.change >= 0;
  const points = chartPoints(stock.history);
  const lastX = Number(points.split(" ").at(-1)?.split(",")[0] ?? 882);
  const lastY = Number(points.split(" ").at(-1)?.split(",")[1] ?? 160);
  const related = stockProfiles
    .filter((item) => item.symbol !== stock.symbol && item.sector === stock.sector)
    .slice(0, 4);
  const rangePosition = Math.max(
    0,
    Math.min(100, ((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100)
  );

  return (
    <main className="detail-page">
      <Header active="live" status="Market preview" />

      <section className="stock-detail-shell">
        <div className="stock-breadcrumb">
          <Link href="/#stocks">Markets</Link>
          <span>/</span>
          <span>{stock.exchange}</span>
          <span>/</span>
          <strong>{stock.symbol}</strong>
        </div>

        <section className="stock-identity">
          <div className="stock-title-block">
            <span className="detail-logo">{stock.symbol.slice(0, 2)}</span>
            <div>
              <div className="symbol-line">
                <h1>{stock.symbol}</h1>
                <span className="exchange-badge">{stock.exchange}</span>
              </div>
              <p>{stock.name} · {stock.sector}</p>
            </div>
          </div>

          <div className="quote-block">
            <strong>{money(stock.price)}</strong>
            <span className={positive ? "up" : "down"}>
              {positive ? "+" : ""}{stock.change.toFixed(2)} ({positive ? "+" : ""}{stock.changePct.toFixed(2)}%)
            </span>
            <small>Sample quote · live API coming next</small>
          </div>
        </section>

        <section className="stock-detail-grid">
          <div className="chart-card">
            <div className="chart-head">
              <div>
                <p className="eyebrow">PRICE CHART</p>
                <h2>Intraday movement</h2>
              </div>
              <div className="time-tabs" aria-label="Chart period">
                <button className="selected" type="button">1D</button>
                <button type="button">1W</button>
                <button type="button">1M</button>
                <button type="button">1Y</button>
              </div>
            </div>

            <div className="price-chart">
              <svg viewBox="0 0 900 320" role="img" aria-label={`${stock.symbol} sample intraday price chart`}>
                <defs>
                  <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={positive ? "#1fd08a" : "#ff6470"} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={positive ? "#1fd08a" : "#ff6470"} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="18" y1="80" x2="882" y2="80" className="chart-grid-line" />
                <line x1="18" y1="160" x2="882" y2="160" className="chart-grid-line" />
                <line x1="18" y1="240" x2="882" y2="240" className="chart-grid-line" />
                <polygon
                  points={`18,302 ${points} 882,302`}
                  fill="url(#chart-fill)"
                />
                <polyline
                  points={points}
                  className={positive ? "chart-line positive-line" : "chart-line negative-line"}
                />
                <circle cx={lastX} cy={lastY} r="5" className={positive ? "chart-dot positive-dot" : "chart-dot negative-dot"} />
              </svg>
              <div className="chart-axis">
                <span>9:15</span><span>11:00</span><span>13:00</span><span>15:30</span>
              </div>
            </div>

            <div className="ohlc-grid">
              <div><span>Open</span><strong>{money(stock.open)}</strong></div>
              <div><span>High</span><strong>{money(stock.high)}</strong></div>
              <div><span>Low</span><strong>{money(stock.low)}</strong></div>
              <div><span>Prev. close</span><strong>{money(stock.prevClose)}</strong></div>
            </div>
          </div>

          <aside className="detail-side">
            <section className="side-card stats-card">
              <div className="side-title"><h3>Key statistics</h3></div>
              <div className="stat-line"><span>Volume</span><strong>{stock.volume}</strong></div>
              <div className="stat-line"><span>Market cap</span><strong>{stock.marketCap}</strong></div>
              <div className="stat-line"><span>P/E ratio</span><strong>{stock.pe}</strong></div>
              <div className="stat-line"><span>Industry</span><strong>{stock.industry}</strong></div>
            </section>

            <section className="side-card">
              <div className="side-title"><h3>52-week range</h3></div>
              <div className="range-values">
                <span>{money(stock.week52Low)}</span>
                <span>{money(stock.week52High)}</span>
              </div>
              <div className="range-track">
                <span className="range-progress" style={{ width: `${rangePosition}%` }} />
                <i style={{ left: `${rangePosition}%` }} />
              </div>
              <div className="current-range-label">Current {money(stock.price)}</div>
            </section>
          </aside>
        </section>

        <section className="detail-lower-grid">
          <article className="company-card">
            <p className="eyebrow">COMPANY SNAPSHOT</p>
            <h2>{stock.name}</h2>
            <p>{stock.description}</p>
            <div className="company-tags">
              <span>{stock.exchange}</span>
              <span>{stock.sector}</span>
              <span>{stock.industry}</span>
            </div>
          </article>

          <aside className="related-card">
            <div className="side-title"><h3>Related stocks</h3></div>
            {related.length ? related.map((item) => (
              <Link className="related-row" href={`/stocks/${item.symbol.toLowerCase()}`} key={item.symbol}>
                <span>
                  <strong>{item.symbol}</strong>
                  <small>{item.name}</small>
                </span>
                <span className={item.change >= 0 ? "up" : "down"}>
                  {item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%
                </span>
              </Link>
            )) : (
              <p className="muted related-empty">More related companies will appear here.</p>
            )}
          </aside>
        </section>

        <div className="concept-disclaimer">
          This stock page currently uses sample values for interface development. It is not investment advice and does not represent a live market feed.
        </div>
      </section>
    </main>
  );
}
