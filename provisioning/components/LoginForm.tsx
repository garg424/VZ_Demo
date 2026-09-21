"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUser } from "@/lib/session";

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

  return (
    <div className="mx-auto mt-24 max-w-sm rounded-lg border bg-white p-8 shadow-sm">
      <div className="mb-1 text-2xl font-extrabold text-vz-red">verizon</div>
      <h1 className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {appName}
      </h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            data-testid="login-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            data-testid="login-password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div data-testid="login-error" className="text-sm font-medium text-red-600">
            {error}
          </div>
        )}
        <button
          data-testid="login-submit-btn"
          type="submit"
          disabled={busy}
          className="w-full rounded bg-vz-red px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          Sign in
        </button>
      </form>
      <p className="mt-4 text-xs text-gray-400">
        Demo logins: prov@demo.io / act@demo.io — password Demo@1234
      </p>
    </div>
  );
}
