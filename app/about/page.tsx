import Header from "@/components/Header";

export default function AboutPage() {
  return (
    <main>
      <Header active="about" status="Private terminal" />
      <section className="workspace-shell about-shell">
        <p className="eyebrow">ABOUT DP ALPHA</p>
        <h1 className="workspace-title">A private trading intelligence terminal built around real decisions.</h1>
        <p className="workspace-sub">
          DP Alpha Terminal is being built for Dharmin Patel and his trading partner as a private system for live market data,
          portfolio tracking, research, risk management and AI-assisted decision support using their own capital.
        </p>

        <div className="about-grid">
          <article>
            <span>01</span>
            <h2>LiveMarket</h2>
            <p>One market-data layer for real-time Indian equities, indices, movers, charts and future licensed NSE feeds.</p>
          </article>
          <article>
            <span>02</span>
            <h2>MyStocks</h2>
            <p>A complete personal trade ledger and portfolio record for every buy, sell, position, P&amp;L and future performance statistic.</p>
          </article>
          <article>
            <span>03</span>
            <h2>TradingAgent</h2>
            <p>A private research committee combining live data, technicals, web research, portfolio context and deterministic risk controls.</p>
          </article>
        </div>

        <div className="concept-disclaimer">
          DP Alpha Terminal is a private decision-support system. It is designed to improve research quality, discipline and risk control; it does not guarantee profitable outcomes.
        </div>
      </section>
    </main>
  );
}
