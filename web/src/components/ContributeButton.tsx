"use client";

import { useState } from "react";

export default function ContributeButton({ packageName }: { packageName: string }) {
  const [state, setState] = useState<"idle" | "done">("idle");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function request() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/packages/${packageName}/contribute`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setState("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (state === "done") {
    return <div className="notice notice-ok" style={{ marginTop: "1rem" }}>Access requested. The package owner will review it.</div>;
  }
  return (
    <div style={{ marginTop: "1rem" }}>
      <button className="btn btn-ghost" onClick={request} disabled={busy} type="button">
        {busy ? "Requesting…" : "Request contributor access"}
      </button>
      {err && <div className="upload-err" style={{ marginTop: "0.5rem" }}>{err}</div>}
    </div>
  );
}
