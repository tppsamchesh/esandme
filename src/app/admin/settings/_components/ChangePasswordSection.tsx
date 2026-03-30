"use client";

import { useState } from "react";

export function ChangePasswordSection() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      setOk(data.message ?? "Password updated in Vercel.");
      setPassword("");
      setConfirm("");
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-brand-text/10 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-xl text-brand-text">Admin password</h2>
      <p className="mt-1 text-sm text-brand-text/65">
        Updates <code className="text-xs">ADMIN_PASSWORD</code> in your Vercel
        project via the Vercel API. Requires{" "}
        <code className="text-xs">VERCEL_TOKEN</code> and{" "}
        <code className="text-xs">VERCEL_PROJECT_ID</code>.
      </p>

      <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            New password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-text/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text/60">
            Confirm password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-text/20 px-3 py-2 text-sm"
          />
        </label>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="text-sm text-green-800" role="status">
            {ok}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-text px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update password in Vercel"}
        </button>
      </form>
    </section>
  );
}
