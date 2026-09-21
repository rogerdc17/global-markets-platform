import Link from "next/link";

type HeaderProps = {
  active: "live" | "stocks" | "agent" | "about";
  status?: string;
};

export default function Header({ active, status = "Concept mode" }: HeaderProps) {
  return (
    <header className="nav-shell">
      <Link className="brand" href="/" aria-label="Bharat Markets home">
        <span className="brand-mark">BM</span>
        <span>Bharat Markets</span>
      </Link>

      <nav className="desktop-nav" aria-label="Primary">
        <Link className={active === "live" ? "active" : ""} href="/">LiveMarket</Link>
        <Link className={active === "stocks" ? "active" : ""} href="/my-stocks">MyStocks</Link>
        <Link className={active === "agent" ? "active" : ""} href="/trading-agent">TradingAgent</Link>
        <Link className={active === "about" ? "active" : ""} href="/about">About</Link>
      </nav>

      <div className="session-pill">
        <span className="pulse" />
        {status}
      </div>
    </header>
  );
}
