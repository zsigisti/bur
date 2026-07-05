"use client";

export default function SignOut() {
  async function out() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button className="linklike" onClick={out} type="button">
      Sign out
    </button>
  );
}
