"use client";

export type SessionUser = { email: string; role: string; full_name: string };

const KEY = "demo_user";

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setUser(u: SessionUser) {
  sessionStorage.setItem(KEY, JSON.stringify(u));
}

export function clearUser() {
  sessionStorage.removeItem(KEY);
}

// Fetch wrapper that attaches the x-demo-user header from the session, so the
// UI exercises exactly the same authenticated API path a test runner would.
export async function api<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string; message?: string; status: number }> {
  const user = getUser();
  const headers = new Headers(opts.headers);
  if (user) headers.set("x-demo-user", user.email);
  if (opts.body) headers.set("content-type", "application/json");
  const res = await fetch(path, { ...opts, headers, cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  return { ...json, status: res.status };
}
