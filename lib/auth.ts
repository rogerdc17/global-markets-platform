const API_BASE = process.env.NEXT_PUBLIC_TRADING_AGENT_API_BASE_URL?.replace(/\/$/, "");
const TOKEN_KEY = "dp-alpha-session";

export type UserRole = "internal" | "client";

export type Session = {
  token: string;
  expires_at: string;
  username: string;
  role: UserRole;
  client_id?: string | null;
  display_name?: string | null;
};

export function authConfigured() {
  return Boolean(API_BASE);
}

export function apiBase() {
  return API_BASE || "";
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session.token || !session.expires_at || !session.role) return null;
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      window.sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return getSession()?.token || "";
}

export function logout() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event("dp-alpha-auth-changed"));
  }
}

export async function login(username: string, password: string): Promise<Session> {
  if (!API_BASE) throw new Error("Private backend is not configured.");

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let message = "Login failed.";
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {}
    throw new Error(message);
  }

  const session = (await response.json()) as Session;
  window.sessionStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("dp-alpha-auth-changed"));
  return session;
}

export async function validateSession(session: Session): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}
