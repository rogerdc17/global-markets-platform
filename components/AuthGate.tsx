"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  authConfigured,
  getSession,
  login,
  logout,
  UserRole,
  validateSession,
} from "@/lib/auth";

const internalOnly = ["/my-stocks", "/client-portfolios", "/trading-agent", "/research"];
const clientOnly = ["/client-dashboard", "/my-portfolio", "/transactions", "/reports"];

function routeAllowed(pathname: string, role: UserRole) {
  if (role === "client") {
    return !internalOnly.some((path) => pathname === path || pathname.startsWith(path + "/"));
  }
  return !clientOnly.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [loginUser, setLoginUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverOffline, setServerOffline] = useState(false);

  async function refresh() {
    const session = getSession();
    if (!session) {
      setAuthenticated(false);
      setUsername("");
      setRole(null);
      setReady(true);
      return;
    }

    const validation = await validateSession(session);
    if (validation === "offline") {
      setServerOffline(true);
      setAuthenticated(true);
      setUsername(session.username);
      setDisplayName(session.display_name || session.username);
      setRole(session.role);
      setReady(true);
      return;
    }

    setServerOffline(false);
    if (validation === "invalid") {
      logout();
      setAuthenticated(false);
      setUsername("");
      setRole(null);
    } else {
      setAuthenticated(true);
      setUsername(session.username);
      setDisplayName(session.display_name || session.username);
      setRole(session.role);
    }
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("dp-alpha-auth-changed", handler);
    return () => window.removeEventListener("dp-alpha-auth-changed", handler);
  }, []);

  useEffect(() => {
    if (!ready || !authenticated || !role) return;
    if (!routeAllowed(pathname, role)) {
      router.replace(role === "client" ? "/client-dashboard" : "/");
    }
  }, [ready, authenticated, role, pathname, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = await login(loginUser.trim(), password);
      setServerOffline(false);
      setAuthenticated(true);
      setUsername(session.username);
      setDisplayName(session.display_name || session.username);
      setRole(session.role);
      setPassword("");
      router.replace(session.role === "client" ? "/client-dashboard" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
      setReady(true);
    }
  }

  if (!ready) {
    return (
      <main className="auth-screen">
        <div className="auth-card auth-loading">Checking private session…</div>
      </main>
    );
  }

  if (!authConfigured()) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-mark">DP</span>
          <p className="eyebrow">DP ALPHA</p>
          <h1>Private backend not connected</h1>
          <p>Configure the private backend URL before using the protected platform.</p>
        </div>
      </main>
    );
  }

  if (serverOffline && authenticated) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <span className="auth-mark">DP</span>
          <p className="eyebrow">SERVER STATUS</p>
          <h1>DP Alpha server is offline</h1>
          <p>
            The private server computer is not reachable right now. The GitHub interface is online,
            but login, portfolios, research and TradingAgent require the DP Alpha computer to be running.
          </p>
          <button className="primary-btn auth-submit" type="button" onClick={refresh}>
            Retry connection
          </button>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={submit}>
          <span className="auth-mark">DP</span>
          <p className="eyebrow">PRIVATE ACCESS</p>
          <h1>DP Alpha</h1>
          <p>Sign in to your internal terminal or client portfolio portal.</p>

          <label>
            Username
            <input
              autoComplete="username"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          <button className="primary-btn auth-submit" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Enter DP Alpha"}
          </button>
        </form>
      </main>
    );
  }

  if (role && !routeAllowed(pathname, role)) {
    return (
      <main className="auth-screen">
        <div className="auth-card auth-loading">Opening your portal…</div>
      </main>
    );
  }

  return (
    <>
      <div className="auth-session-bar">
        <span className="role-badge">{role === "client" ? "CLIENT" : "INTERNAL"}</span>
        <span>Signed in as <strong>{displayName || username}</strong></span>
        <button type="button" onClick={logout}>Sign out</button>
      </div>
      {children}
    </>
  );
}
