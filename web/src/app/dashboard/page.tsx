import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUserFull } from "@/lib/session";
import { isTrusted } from "@/lib/permissions";
import { TRUST_THRESHOLD } from "@/lib/types";
import PublishForm from "./PublishForm";
import DeleteRecipe from "@/components/DeleteRecipe";
import ContributionDecide from "@/components/ContributionDecide";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — BUR" };

function Badge({ status }: { status: string }) {
  const cls =
    status === "PUBLISHED" ? "ok" :
    status === "APPROVED" ? "info" :
    status === "PENDING" ? "warn" :
    status === "REJECTED" ? "err" : "";
  return <span className={`badge badge-${cls}`}>{status.toLowerCase()}</span>;
}

export default async function Dashboard() {
  const user = await currentUserFull();
  if (!user) redirect("/login");

  const recipes = await prisma.recipe.findMany({
    where: { submittedById: user.id },
    include: { package: true },
    orderBy: { createdAt: "desc" },
  });

  const requests = await prisma.contributionRequest.findMany({
    where: { status: "PENDING", package: { ownerId: user.id } },
    include: { package: { select: { name: true } }, user: { select: { username: true } } },
    orderBy: { createdAt: "asc" },
  });

  const trusted = isTrusted(user);
  const remaining = Math.max(0, TRUST_THRESHOLD - user.approvedCount);

  return (
    <section className="section">
      <div className="wrap">
        <h1 style={{ fontSize: "2rem" }}>Dashboard</h1>
        <p style={{ color: "var(--fg-muted)" }}>
          Signed in as <strong>{user.username}</strong> · role {user.globalRole.toLowerCase()}
        </p>

        <div className="stat-cards">
          <div className="stat"><div className="stat-n">{recipes.length}</div><div className="stat-l">recipes</div></div>
          <div className="stat"><div className="stat-n">{user.approvedCount}</div><div className="stat-l">approved</div></div>
          <div className="stat">
            <div className="stat-n">{trusted ? "Yes" : remaining}</div>
            <div className="stat-l">{trusted ? "trusted" : "to auto-approve"}</div>
          </div>
        </div>

        <div style={{ margin: "1.5rem 0" }}>
          <a className="btn btn-primary" href="/submit">Submit a recipe</a>
        </div>

        {recipes.length === 0 ? (
          <div className="empty"><p>You haven&apos;t submitted anything yet.</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Package</th><th>Version</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id}>
                  <td><a href={`/packages/${r.package.name}`}><code>{r.package.name}</code></a></td>
                  <td>{r.version}-{r.release}</td>
                  <td><Badge status={r.status} /></td>
                  <td>
                    <div className="upload-row">
                      {r.status === "APPROVED" && <PublishForm recipeId={r.id} />}
                      {r.status === "PUBLISHED" && (
                        <span className="mono-sm">published · {r.artifactSha256?.slice(0, 12)}…</span>
                      )}
                      {r.status === "PENDING" && <span className="muted">awaiting review</span>}
                      {r.status === "REJECTED" && <span className="upload-err">{r.rejectionReason}</span>}
                      <DeleteRecipe recipeId={r.id} label={`${r.package.name} ${r.version}-${r.release}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {requests.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.4rem", marginTop: "2.5rem" }}>Contribution requests to your packages</h2>
            <table className="table">
              <thead>
                <tr><th>Package</th><th>User</th><th>Message</th><th>Decision</th></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td><code>{r.package.name}</code></td>
                    <td>{r.user.username}</td>
                    <td className="muted">{r.message ?? "—"}</td>
                    <td><ContributionDecide requestId={r.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </section>
  );
}
