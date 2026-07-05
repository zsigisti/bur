export const metadata = { title: "Documentation — BUR" };

export default function Docs() {
  return (
    <div className="wrap prose">
      <span className="eyebrow">Documentation</span>
      <h1>Documentation</h1>
      <p>
        Everything you need to write, build, review, and publish community
        packages for Blueberry Linux.
      </p>

      <h2>The client</h2>
      <p>
        <code>bur</code> is a single, standalone binary that works alongside{" "}
        <code>bpm</code>. It is installed on demand and is not part of the base
        system.
      </p>
      <pre>{`bpm install bur          # install the client
bur search <name>        # search community packages
bur info <name>          # show package details
bur install <name>       # build and install from repo1
bur build .              # build the recipe in the current directory
bur submit .             # submit a recipe for review
bur publish .            # publish an approved package`}</pre>

      <h2>Recipe format</h2>
      <p>
        Recipes use the <code>bpm.toml</code> format. A recipe declares package
        metadata, one or more sources with pinned <code>sha256</code> checksums,
        and <code>build</code> / <code>package</code> steps.
      </p>
      <ul>
        <li><code>[package]</code> — name, version, release, summary, license, dependencies.</li>
        <li><code>[[source]]</code> — one per source; each with a <code>url</code> and <code>sha256</code>.</li>
        <li><code>[steps]</code> — <code>build</code> and <code>package</code> shell snippets.</li>
      </ul>

      <h2>Roles</h2>
      <table className="table">
        <thead>
          <tr><th>Role</th><th>What it can do</th></tr>
        </thead>
        <tbody>
          <tr><td>Contributor</td><td>The default. Create packages, submit recipes, and apply to contribute to others&apos; packages.</td></tr>
          <tr><td>Package owner</td><td>The author of a package. Edits their own package freely and approves contribution requests to it.</td></tr>
          <tr><td>Maintainer</td><td>Reviews and approves recipe submissions from any contributor.</td></tr>
          <tr><td>Author</td><td>The top role. Full administrative control over packages, users, and publishing.</td></tr>
        </tbody>
      </table>

      <h2>Trusted contributors</h2>
      <p>
        Once you have twenty approved recipes, you become a trusted contributor
        and your future submissions are published without review.
      </p>

      <h2>Review and publishing</h2>
      <p>
        A submission is reviewed by a maintainer (unless you are trusted, or it is
        your own package). After approval, the built <code>.bpm</code> is
        published to <code>repo1.blueberrylinux.org</code>, the community mirror — kept
        separate from the official <code>repo.mmzsigmond.me</code>.
      </p>
    </div>
  );
}
