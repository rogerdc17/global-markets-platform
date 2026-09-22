"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { authConfigured, getSession, login, logout, validateSession } from "@/lib/auth";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [loginUser, setLoginUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const session = getSession();
    if (!session) {
      setAuthenticated(false);
      setUsername("");
      setReady(true);
      return;
    }

    const valid = await validateSession(session);
    if (!valid) {
      logout();
      setAuthenticated(false);
      setUsername("");
    } else {
      setAuthenticated(true);
      setUsername(session.username);
    }
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("dp-alpha-auth-changed", handler);
    return () => window.removeEventListener("dp-alpha-auth-changed", handler);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = await login(loginUser.trim(), password);
      setAuthenticated(true);
      setUsername(session.username);
      setPassword("");
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
          <p className="eyebrow">DP ALPHA TERMINAL</p>
          <h1>Private backend not connected</h1>
          <p>Configure the TradingAgent backend URL before using the protected terminal.</p>
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
          <h1>DP Alpha Terminal</h1>
          <p>Sign in to access LiveMarket, MyStocks and TradingAgent.</p>

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
            {busy ? "Signing in…" : "Enter terminal"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <>
      <div className="auth-session-bar">
        <span>Signed in as <strong>{username}</strong></span>
        <button type="button" onClick={logout}>Sign out</button>
      </div>
      {children}
    </>
  );
}
