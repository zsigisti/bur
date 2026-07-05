"use client";

import { useState } from "react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="panel">
        <h1>Create account</h1>
        <p className="muted">Join the Blueberry User Repository</p>

        {done ? (
          <div className="notice notice-ok">
            Your account was created. You can now <a href="/login">sign in</a>.
          </div>
        ) : (
          <>
            {err && <div className="notice notice-err">{err}</div>}
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="username">Username</label>
                <input id="username" autoComplete="username" required
                  value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" autoComplete="new-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </button>
            </form>
          </>
        )}

        <p className="alt">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
