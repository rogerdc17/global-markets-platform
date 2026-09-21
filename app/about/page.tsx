import Header from "@/components/Header";

export default function AboutPage() {
  return (
    <main>
      <Header active="about" status="Application info" />
      <section className="workspace-shell about-shell">
        <p className="eyebrow">ABOUT THE APPLICATION</p>
        <h1 className="workspace-title">One place for markets, positions and intelligent trading tools.</h1>
        <p className="workspace-sub">
          Bharat Markets is an India-first market platform concept designed to combine live market information, a personal trading workspace and a future intelligent TradingAgent in one focused interface.
        </p>

        <div className="about-grid">
          <article>
            <span>01</span>
            <h2>LiveMarket</h2>
            <p>Real-time Indian market data, indices, stock prices, movers, charts and market activity through a market-data API.</p>
          </article>
          <article>
            <span>02</span>
            <h2>MyStocks</h2>
            <p>A personal workspace where users can record their current holdings and active trades and monitor position-level performance.</p>
          </article>
          <article>
            <span>03</span>
            <h2>TradingAgent</h2>
            <p>A dedicated intelligent market module whose functionality will be defined after the core market and portfolio experiences are complete.</p>
          </article>
        </div>

        <div className="concept-disclaimer">
          This application is currently a product concept. Live data connectivity, authentication, persistent cloud storage and production trading integrations will be added in later phases.
        </div>
      </section>
    </main>
  );
}
