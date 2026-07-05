"use client";

import { useState } from "react";

export default function DeleteUser({ userId, username }: { userId: string; username: string }) {
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!window.confirm(`Delete user "${username}"? This removes their account, packages, and recipes. This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={del} disabled={busy} type="button">
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
