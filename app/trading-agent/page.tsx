import Link from "next/link";

export default function TradingAgentPage() {
  return (
    <main>
      <header className="nav-shell">
        <Link className="brand" href="/" aria-label="Bharat Markets home">
          <span className="brand-mark">BM</span>
          <span>Bharat Markets</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          <Link href="/">LiveMarket</Link>
          <Link href="/my-stocks">MyStocks</Link>
          <Link className="active" href="/trading-agent">TradingAgent</Link>
          <Link href="/#indices">Indices</Link>
        </nav>
        <div className="session-pill"><span className="pulse" />Concept mode</div>
      </header>

      <section className="workspace-shell">
        <p className="eyebrow">AI MARKET ASSISTANT</p>
        <h1 className="workspace-title">TradingAgent</h1>
        <p className="workspace-sub">A concept workspace for market screening, trade ideas, risk checks and research prompts.</p>

        <div className="agent-layout">
          <section className="agent-panel">
            <div className="agent-intro">
              <span className="agent-orb">AI</span>
              <div>
                <h2>Ask the market agent</h2>
                <p>Try prompts like “show strong banking momentum”, “compare TCS and Infosys”, or “find large-cap stocks near 52-week highs”.</p>
              </div>
            </div>

            <div className="agent-suggestions">
              <button type="button">Find today’s strongest sectors</button>
              <button type="button">Compare RELIANCE vs LT</button>
              <button type="button">Show stocks with positive momentum</button>
              <button type="button">Build a conservative watchlist</button>
            </div>

            <div className="agent-input">
              <input aria-label="Trading agent prompt" placeholder="Ask about the market..." />
              <button type="button">Send</button>
            </div>
            <small className="agent-note">Concept only. This assistant does not place trades and should not be treated as investment advice.</small>
          </section>

          <aside className="side-card">
            <div className="side-title"><h3>Agent modules</h3></div>
            <div className="status-row"><span>Market screener</span><strong className="open">Planned</strong></div>
            <div className="status-row"><span>Risk analysis</span><strong>Planned</strong></div>
            <div className="status-row"><span>News context</span><strong>Planned</strong></div>
            <div className="status-row"><span>Trade execution</span><strong>Disabled</strong></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
