"use client";

import { useState } from "react";

export default function ContributionDecide({ requestId }: { requestId: string }) {
  const [busy, setBusy] = useState(false);

  async function decide(decision: "approve" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/contributions/${requestId}/decide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <div className="review-actions">
      <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => decide("approve")}>Approve</button>
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => decide("reject")}>Reject</button>
    </div>
  );
}
