import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { hasPackageAccess } from "@/lib/permissions";
import ContributeButton from "@/components/ContributeButton";

export const dynamic = "force-dynamic";

const REPO = process.env.COMMUNITY_REPO_HOST ?? "repo1.blueberrylinux.org";

export default async function PackageDetail({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  const pkg = await prisma.package.findUnique({
    where: { name },
    include: {
      owner: { select: { username: true } },
      recipes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!pkg) notFound();

  const user = await currentUser();
  const canContribute = user && user.id !== pkg.ownerId && !(await hasPackageAccess(user, pkg.id));

  const published = pkg.recipes.filter((r) => r.status === "PUBLISHED");
  const latest = published[0];

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: "820px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}><code>{pkg.name}</code></h1>
        {pkg.description && <p style={{ color: "var(--fg-muted)" }}>{pkg.description}</p>}
        <p className="mono-sm muted">
          maintained by {pkg.owner.username}
          {pkg.homepage && <> · <a href={pkg.homepage}>homepage</a></>}
        </p>
        {canContribute && <ContributeButton packageName={pkg.name} />}

        {latest ? (
          <>
            <h2 style={{ fontSize: "1.3rem", marginTop: "2rem" }}>Install</h2>
            <pre>{`bur install ${pkg.name}`}</pre>
            <p className="mono-sm muted">
              latest published: {latest.version}-{latest.release} ·
              sha256 {latest.artifactSha256?.slice(0, 24)}…
            </p>
          </>
        ) : (
          <div className="notice notice-err" style={{ marginTop: "1.5rem" }}>
            No published build yet.
          </div>
        )}

        <h2 style={{ fontSize: "1.3rem", marginTop: "2rem" }}>Versions</h2>
        <table className="table">
          <thead><tr><th>Version</th><th>Status</th><th>Artifact</th></tr></thead>
          <tbody>
            {pkg.recipes.map((r) => (
              <tr key={r.id}>
                <td>{r.version}-{r.release}</td>
                <td>{r.status.toLowerCase()}</td>
                <td className="mono-sm">
                  {r.status === "PUBLISHED"
                    ? <a href={`https://${REPO}/${pkg.name}-${r.version}-${r.release}-x86_64.bpm`}>download</a>
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
