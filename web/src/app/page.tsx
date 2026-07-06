import Reveal from "@/components/Reveal";
import HeroTerminal from "@/components/HeroTerminal";

const HEADLINE = ["Build", "it.", "Review", "it.", "Publish", "it."];

const STEPS: [string, string, string][] = [
  ["01", "Write", "Author a bpm.toml recipe — the exact format the official Blueberry repository uses."],
  ["02", "Build", "Build the package on your own machine with bur build. Every submission is built by its author."],
  ["03", "Review", "Submit for review. A maintainer approves it — and after twenty approved recipes, yours publish without review."],
  ["04", "Publish", "Publish to the community mirror. Anyone can install it with bur install."],
];

const VALUES: [string, string][] = [
  ["Signed & verified", "Every package is ed25519-signed in the index and checksum-verified on download. Nothing installs unverified."],
  ["Reviewed by maintainers", "Submissions are reviewed before they reach the mirror — and trusted contributors earn auto-publish after twenty approvals."],
  ["Built by the author", "No opaque build farm. Every package is compiled on the submitter's own machine and uploaded."],
  ["One command to install", "bur install <name> resolves, downloads, verifies and installs — the same experience as the base repo."],
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero-dark on-dark">
        <div className="hero-grid" />
        <div className="wrap">
          <div className="hero-eyebrow">Community packages for Blueberry Linux</div>
          <h1>
            {HEADLINE.map((w, i) => (
              <span key={i} className="word" style={{ animationDelay: `${i * 90}ms` }}>
                {w}
                {i < HEADLINE.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p className="lede">
            BUR is the community package repository for Blueberry Linux. Write a
            recipe, build it on your machine, get it reviewed, and publish it so
            anyone can install it with a single command.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="/packages">Browse packages</a>
            <a className="btn btn-ghost" href="/submit">Submit a package</a>
          </div>
          <HeroTerminal />
        </div>
      </section>

      {/* BRAND SHOWCASE */}
      <section className="brandshow">
        <div className="wrap">
          <Reveal dir="left">
            <div>
              <div className="kicker">Grown by the community</div>
              <p className="statement">Every package, planted by someone who needed it.</p>
              <p className="lede muted" style={{ maxWidth: "42ch", marginTop: "1.25rem" }}>
                BUR is where Blueberry users share the software they build — from a
                one-line CLI tool to a full server stack. Ripe, reviewed, and ready
                to install.
              </p>
            </div>
          </Reveal>
          <Reveal dir="right" delay={120}>
            <img src="/banner.png" alt="Blueberries" loading="lazy" />
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS — grid */}
      <section>
        <div className="wrap section" style={{ paddingBottom: "3rem" }}>
          <Reveal>
            <div className="kicker">How it works</div>
            <h2>Four steps from recipe to install.</h2>
          </Reveal>
          <div className="features">
            {STEPS.map(([num, title, body], i) => (
              <Reveal key={num} delay={i * 90}>
                <div className="feature">
                  <div className="num">{num}</div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY BUR — value band */}
      <section className="band">
        <div className="wrap section">
          <Reveal>
            <div className="kicker">Why BUR</div>
            <h2 style={{ maxWidth: "18ch" }}>Community packages you can actually trust.</h2>
          </Reveal>
          <div className="valuegrid" style={{ marginTop: "2.5rem" }}>
            {VALUES.map(([title, body], i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="value">
                  <div className="dot" />
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TERMINAL DEMO */}
      <section className="dark on-dark">
        <div className="wrap section split">
          <Reveal dir="left">
            <div>
              <div className="kicker" style={{ color: "var(--accent-soft)" }}>Watch it work</div>
              <h2 style={{ color: "#fff" }}>One client. Search, build, submit, publish.</h2>
              <p className="lede" style={{ color: "rgba(255,255,255,.82)", marginTop: "1rem" }}>
                The <code>bur</code> client does it all from the command line —
                installed on demand with <code>bpm install bur</code>.
              </p>
            </div>
          </Reveal>
          <Reveal dir="right" delay={120}>
            <HeroTerminal />
          </Reveal>
        </div>
      </section>

      {/* THE MODEL */}
      <section>
        <div className="wrap section">
          <Reveal>
            <div className="kicker">The model</div>
          </Reveal>
          <Reveal delay={80}>
            <p className="statement" style={{ maxWidth: "30ch" }}>
              Open to everyone. Reviewed by maintainers. Trusted after twenty.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <p className="lede muted" style={{ marginTop: "1.5rem", maxWidth: "60ch" }}>
              Package authors own their packages. Contributors apply for access.
              Maintainers keep the mirror trustworthy. Nothing ships unbuilt.
            </p>
          </Reveal>
        </div>
      </section>

      {/* GET THE CLIENT */}
      <section className="band">
        <div className="wrap section" style={{ maxWidth: "800px" }}>
          <Reveal>
            <div className="kicker">Get started</div>
            <h2>Install the client.</h2>
            <p className="muted">
              The <code>bur</code> client is installed on demand — it is not part
              of the base system.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <pre>{`# install the client
bpm install bur

# find and install a community package
bur search <name>
bur install <name>

# contribute a package
bur build .        # build the recipe in the current directory
bur submit .       # submit it for review`}</pre>
          </Reveal>
        </div>
      </section>

      {/* SUPPORT TEASER */}
      <section>
        <div className="wrap section teaser" style={{ maxWidth: "620px" }}>
          <Reveal>
            <div className="heart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 1.9 5 5.2 5c2 0 3.3 1.1 4 2.1C9.9 6.1 11.2 5 13.2 5c3.3 0 4.8 3.4 3.2 6.7C19.5 16.4 12 21 12 21z" />
              </svg>
            </div>
            <h2>Made by a small team.</h2>
            <p className="lede muted" style={{ margin: "0 auto 1.75rem", maxWidth: "48ch" }}>
              Blueberry and BUR are built by a small team with a little corporate
              backing. If it saves you time, you can help keep the mirror running.
            </p>
            <a className="btn btn-primary" href="/support">Support the project</a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
