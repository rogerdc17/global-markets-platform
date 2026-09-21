import Header from "@/components/Header";

export default function TradingAgentPage() {
  return (
    <main>
      <Header active="agent" status="Coming later" />
      <section className="workspace-shell">
        <p className="eyebrow">TRADING AGENT</p>
        <h1 className="workspace-title">TradingAgent</h1>
        <p className="workspace-sub">
          This section is intentionally being kept minimal until its full behaviour, logic and role are defined.
        </p>
        <section className="placeholder-panel">
          <span className="agent-orb">AI</span>
          <div>
            <h2>Reserved for the TradingAgent</h2>
            <p>We will design this module after LiveMarket and MyStocks are complete.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
