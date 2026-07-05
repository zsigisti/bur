"use client";

import { useState } from "react";

export default function PublishForm({ recipeId }: { recipeId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    if (!input.files?.[0]) {
      setErr("Choose a .bpm file first.");
      return;
    }
    const fd = new FormData();
    fd.append("file", input.files[0]);
    setBusy(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/publish`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="upload-row">
      <input type="file" name="file" accept=".bpm" />
      <button className="btn btn-primary btn-sm" disabled={busy}>
        {busy ? "Uploading…" : "Upload .bpm"}
      </button>
      {err && <span className="upload-err">{err}</span>}
    </form>
  );
}
