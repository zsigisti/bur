"use client";

import { useState } from "react";

export default function Login() {
  const [stage, setStage] = useState<"credentials" | "twofactor">("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sign-in failed");
      setStage("twofactor");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      window.location.href = "/";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="panel">
        <h1>Sign in</h1>
        <p className="muted">Access your BUR account</p>
        {err && <div className="notice notice-err">{err}</div>}

        {stage === "credentials" ? (
          <form onSubmit={submitCredentials}>
            <div className="field">
              <label htmlFor="identifier">Username or email</label>
              <input id="identifier" type="text" autoComplete="username" required
                value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Signing in…" : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode}>
            <p className="muted">We emailed you a 6-digit code.</p>
            <div className="field">
              <label htmlFor="code">Verification code</label>
              <input id="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required
                value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Verifying…" : "Verify and sign in"}
            </button>
          </form>
        )}

        <p className="alt">
          New here? <a href="/register">Create an account</a>
        </p>
      </div>
    </div>
  );
}
