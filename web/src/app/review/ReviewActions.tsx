"use client";

import { useState } from "react";

export default function ReviewActions({ recipeId }: { recipeId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function act(kind: "approve" | "reject") {
    setErr(null);
    let reason = "";
    if (kind === "reject") {
      reason = window.prompt("Reason for rejection:") ?? "";
      if (!reason) return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/${kind}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed");
      setBusy(false);
    }
  }

  return (
    <div className="review-actions">
      <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act("approve")}>Approve</button>
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act("reject")}>Reject</button>
      {err && <span className="upload-err">{err}</span>}
    </div>
  );
}
