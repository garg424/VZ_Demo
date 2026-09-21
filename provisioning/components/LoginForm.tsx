"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUser } from "@/lib/session";
import { Logo } from "@/components/Logo";

export default function LoginForm({
  appRole,
  appName,
}: {
  appRole: "provisioning" | "activation";
  appName: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.message || "Invalid email or password");
        return;
      }
      if (json.data.role !== appRole) {
        setError(
          `This account has role '${json.data.role}'. ${appName} requires the '${appRole}' role.`
        );
        return;
      }
      setUser(json.data);
      router.push("/");
    } catch {
      setError("Login request failed");
    } finally {
      setBusy(false);
    }
  }

  const blurb =
    appRole === "provisioning"
      ? {
          title: "Provision circuit orders",
          body: "Capture orders, assign circuits and ports, then hand off to activation.",
        }
      : {
          title: "Activate & test circuits",
          body: "Pick up work orders, run acceptance tests, and place circuits in service.",
        };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-vz-black lg:block">
        <div className="brand-panel-bg absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="a-fade">
            <Logo wordmarkClassName="text-white" />
          </div>
          <div className="a-rise">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
              {appName} console
            </div>
            <h2 className="max-w-sm text-4xl font-semibold leading-tight">
              {blurb.title}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/60">{blurb.body}</p>
          </div>
          <div className="text-xs text-white/40">
            Corvia Telecom · internal demo environment
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="a-rise w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">
            {appName} console · {appRole} access
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="username"
                placeholder="you@demo.io"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div
                data-testid="login-error"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}
            <button
              data-testid="login-submit-btn"
              type="submit"
              disabled={busy}
              className="btn btn-primary w-full"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <div className="font-semibold text-slate-600">Demo credentials</div>
            <div className="mt-1">
              <span className="mono">prov@demo.io</span> ·{" "}
              <span className="mono">act@demo.io</span> — password{" "}
              <span className="mono">Demo@1234</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
