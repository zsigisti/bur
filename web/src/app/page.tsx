export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Blueberry User Repository</h1>
        <p>
          Community-maintained recipes for Blueberry Linux. Write a{" "}
          <code>bpm.toml</code>, build the <code>.bpm</code> on your machine, get
          it reviewed, and publish it for everyone.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          <a className="btn" href="/packages">
            Browse packages
          </a>
        </p>
      </section>

      <div className="container">
        <div className="grid">
          <div className="card">
            <h3>1 · Write</h3>
            <p>
              Author a <code>bpm.toml</code> recipe — the same format the official
              repo uses.
            </p>
          </div>
          <div className="card">
            <h3>2 · Build</h3>
            <p>
              Build it locally with <code>bur build .</code>. Every package must be
              built by its submitter.
            </p>
          </div>
          <div className="card">
            <h3>3 · Review</h3>
            <p>
              Submit it. A maintainer approves it — or, once you have 20 approved
              recipes, yours publish without review.
            </p>
          </div>
          <div className="card">
            <h3>4 · Publish</h3>
            <p>
              Upload the built <code>.bpm</code> to{" "}
              <code>repo1.mmzsigmond.me</code>. Install anywhere with{" "}
              <code>bur install</code>.
            </p>
          </div>
        </div>

        <h2 style={{ marginTop: "2.5rem" }}>Get the client</h2>
        <pre>{`bpm install bur       # the BUR client (not installed by default)
bur search <name>     # find community packages
bur install <name>    # build + install from repo1
bur build .           # build the recipe in the current dir
bur submit .          # submit it for review`}</pre>
      </div>
    </>
  );
}
