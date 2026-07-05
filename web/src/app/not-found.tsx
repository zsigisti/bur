export default function NotFound() {
  return (
    <section className="empty" style={{ padding: "6rem 1.5rem" }}>
      <div className="wrap">
        <span className="eyebrow">Error 404</span>
        <h2>We couldn&apos;t find that page</h2>
        <p style={{ maxWidth: "48ch", margin: "0 auto 1.5rem" }}>
          The page you were looking for doesn&apos;t exist or may have moved.
          Try the package index or head back to the homepage.
        </p>
        <div className="actions" style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <a className="btn btn-primary" href="/">Go home</a>
          <a className="btn btn-ghost" href="/packages">Browse packages</a>
        </div>
      </div>
    </section>
  );
}
