import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Row = { name: string; description: string | null; version: string | null };

async function loadPackages(): Promise<{ rows: Row[]; ok: boolean }> {
  try {
    const pkgs = await prisma.package.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        recipes: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 1,
        },
      },
    });
    return {
      ok: true,
      rows: pkgs.map((p) => ({
        name: p.name,
        description: p.description,
        version: p.recipes[0]?.version ?? null,
      })),
    };
  } catch {
    // DB not reachable yet — show the empty state rather than an error page.
    return { ok: false, rows: [] };
  }
}

export default async function Packages() {
  const { rows } = await loadPackages();

  return (
    <section className="section">
      <div className="wrap">
        <h1 style={{ fontSize: "2rem" }}>Packages</h1>
        <p style={{ color: "var(--fg-muted)", marginBottom: "2rem" }}>
          Community packages available from <code>repo1.blueberrylinux.org</code>.
        </p>

        {rows.length === 0 ? (
          <div className="empty">
            <h2>No packages yet</h2>
            <p style={{ maxWidth: "48ch", margin: "0 auto 1.5rem" }}>
              Be the first to contribute. Write a recipe, build it, and submit it
              for review.
            </p>
            <a className="btn btn-primary" href="/submit">Submit a package</a>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Version</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td><a href={`/packages/${r.name}`}><code>{r.name}</code></a></td>
                  <td>{r.version ?? "—"}</td>
                  <td>{r.description ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
