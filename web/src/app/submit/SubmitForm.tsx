"use client";

import { useState } from "react";

const TEMPLATE = `[package]
name     = "hello"
version  = "2.12.1"
release  = 1
summary  = "GNU hello, the canonical example program"
homepage = "https://www.gnu.org/software/hello/"
license  = ["GPL-3.0-or-later"]
arch     = ["x86_64"]

depends     = ["glibc"]
makedepends = ["pkgconf"]

[[source]]
url    = "https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz"
sha256 = "REPLACE_WITH_SHA256"

[steps]
build   = '''cd "$name-$version"; ./configure --prefix=/usr; make'''
package = '''cd "$name-$version"; make DESTDIR="$pkgdir" install'''
`;

export default function SubmitForm() {
  const [toml, setToml] = useState(TEMPLATE);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<{ package: string; status: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bpmToml: toml }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setOk({ package: data.package, status: data.status });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (ok) {
    return (
      <div className="notice notice-ok">
        <strong>{ok.package}</strong> submitted.{" "}
        {ok.status === "APPROVED"
          ? "It was approved automatically — you can upload the built package from your dashboard."
          : "It is now pending review. You'll be able to publish it once a maintainer approves it."}
        <div style={{ marginTop: "1rem" }}>
          <a className="btn btn-primary" href="/dashboard">Go to dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {err && <div className="notice notice-err">{err}</div>}
      <div className="field">
        <label htmlFor="toml">Recipe (bpm.toml)</label>
        <textarea
          id="toml"
          className="code-area"
          spellCheck={false}
          value={toml}
          onChange={(e) => setToml(e.target.value)}
          rows={22}
        />
      </div>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Submitting…" : "Submit recipe"}
      </button>
      <p className="muted" style={{ marginTop: "0.75rem" }}>
        The package name and version are read from the recipe. New packages make
        you their owner; you can upload the built <code>.bpm</code> after approval.
      </p>
    </form>
  );
}
