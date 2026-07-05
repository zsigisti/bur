"use client";

import { useState } from "react";

const ROLES = ["CONTRIBUTOR", "MAINTAINER", "AUTHOR"];

export default function RoleControls({
  userId,
  role,
  trusted,
}: {
  userId: string;
  role: string;
  trusted: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>) {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Update failed");
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
      setBusy(false);
    }
  }

  return (
    <div className="role-controls">
      <select
        defaultValue={role}
        disabled={busy}
        onChange={(e) => patch({ globalRole: e.target.value })}
      >
        {ROLES.map((r) => <option key={r} value={r}>{r.toLowerCase()}</option>)}
      </select>
      <label className="trust-toggle">
        <input
          type="checkbox"
          defaultChecked={trusted}
          disabled={busy}
          onChange={(e) => patch({ trusted: e.target.checked })}
        />
        trusted
      </label>
      {err && <span className="upload-err">{err}</span>}
    </div>
  );
}
