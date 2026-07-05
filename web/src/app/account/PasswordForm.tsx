"use client";

import { useState } from "react";

export default function PasswordForm() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setOk(true);
      setCur("");
      setNext("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: "420px" }}>
      {err && <div className="notice notice-err">{err}</div>}
      {ok && <div className="notice notice-ok">Your password was changed.</div>}
      <div className="field">
        <label htmlFor="cur">Current password</label>
        <input id="cur" type="password" autoComplete="current-password" required
          value={cur} onChange={(e) => setCur(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="next">New password</label>
        <input id="next" type="password" autoComplete="new-password" required
          value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
