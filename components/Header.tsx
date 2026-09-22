"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession, UserRole } from "@/lib/auth";

type ActiveKey =
  | "live"
  | "stocks"
  | "clients"
  | "agent"
  | "research"
  | "performance"
  | "portfolio"
  | "transactions"
  | "reports"
  | "about";

type HeaderProps = {
  active: ActiveKey;
  status?: string;
};

const internalNav = [
  ["live", "/", "LiveMarket"],
  ["stocks", "/my-stocks", "MyStocks"],
  ["clients", "/client-portfolios", "Client Portfolios"],
  ["agent", "/trading-agent", "TradingAgent"],
  ["research", "/research", "Research"],
  ["performance", "/performance", "Performance"],
  ["about", "/about", "About"],
] as const;

const clientNav = [
  ["portfolio", "/client-dashboard", "Dashboard"],
  ["live", "/", "LiveMarket"],
  ["portfolio", "/my-portfolio", "MyPortfolio"],
  ["performance", "/performance", "Performance"],
  ["transactions", "/transactions", "Transactions"],
  ["reports", "/reports", "Reports"],
  ["about", "/about", "About"],
] as const;

export default function Header({ active, status = "Private terminal" }: HeaderProps) {
  const [role, setRole] = useState<UserRole>("internal");

  useEffect(() => {
    const session = getSession();
    if (session?.role) setRole(session.role);
  }, []);

  const nav = role === "client" ? clientNav : internalNav;

  return (
    <header className="nav-shell">
      <Link
        className="brand"
        href={role === "client" ? "/client-dashboard" : "/"}
        aria-label="DP Alpha home"
      >
        <span className="brand-mark">DP</span>
        <span>DP Alpha <small className="brand-terminal">{role === "client" ? "Client Portal" : "Terminal"}</small></span>
      </Link>

      <nav className="desktop-nav role-nav" aria-label="Primary">
        {nav.map(([key, href, label]) => (
          <Link className={active === key ? "active" : ""} href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="session-pill">
        <span className="pulse" />
        {status}
      </div>
    </header>
  );
}
