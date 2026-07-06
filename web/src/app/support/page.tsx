import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — BUR",
  description:
    "Blueberry Linux and BUR are built by a small team with a little corporate backing. Help keep the community mirror running.",
};

// TODO: set these to the project's real donation handles.
const KOFI = "https://ko-fi.com/blueberrylinux";
const PAYPAL = "https://paypal.me/blueberrylinux";

const FUNDS: [string, string][] = [
  ["The mirror", "Bandwidth and storage for every community package people download."],
  ["Review & moderation", "Keeping submissions verified, signed, and trustworthy."],
  ["Build & CI", "The machines that build the base system and cut releases."],
];

export default function Support() {
  return (
    <>
      <section className="hero-dark on-dark" style={{ minHeight: "auto", padding: "5rem 0 4rem" }}>
        <div className="hero-grid" />
        <div className="wrap" style={{ textAlign: "center" }}>
          <div className="hero-eyebrow">Support the project</div>
          <h1 style={{ margin: "1rem auto 1.25rem", maxWidth: "16ch" }}>Made by a small team.</h1>
          <p className="lede" style={{ margin: "0 auto", maxWidth: "56ch" }}>
            Blueberry Linux and BUR are built by a small team with a little
            corporate backing. Everything here — the base system, the package
            manager, this repository — is free and open. If it saves you time, a
            small contribution helps keep it running.
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <a className="btn btn-primary" href={KOFI} target="_blank" rel="noopener noreferrer">
              Buy us a coffee on Ko-fi
            </a>
            <a className="btn btn-ghost" href={PAYPAL} target="_blank" rel="noopener noreferrer">
              Donate with PayPal
            </a>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap section" style={{ maxWidth: "900px" }}>
          <div className="kicker">Where it goes</div>
          <h2 style={{ maxWidth: "20ch" }}>Your support keeps the lights on.</h2>
          <div className="grid" style={{ marginTop: "2.5rem" }}>
            {FUNDS.map(([title, body]) => (
              <div className="card" key={title}>
                <div className="dot" style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--accent)", marginBottom: "0.9rem", boxShadow: "0 0 0 5px rgba(63,99,176,.14)" }} />
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: "2.5rem", fontSize: "0.95rem" }}>
            Prefer to contribute code instead? Publishing and maintaining packages
            on <a href="/submit">BUR</a> helps just as much.
          </p>
        </div>
      </section>
    </>
  );
}
