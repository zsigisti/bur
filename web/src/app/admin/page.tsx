import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { isAuthor } from "@/lib/permissions";
import RoleControls from "./RoleControls";
import DeleteUser from "@/components/DeleteUser";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — BUR" };

export default async function Admin() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (!isAuthor(me)) redirect("/");

  const [users, pkgCount, recipeCount, pendingCount, audit] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.package.count(),
    prisma.recipe.count(),
    prisma.recipe.count({ where: { status: "PENDING" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { actor: { select: { username: true } } },
    }),
  ]);

  return (
    <section className="section">
      <div className="wrap">
        <h1 style={{ fontSize: "2rem" }}>Admin</h1>

        <div className="stat-cards">
          <div className="stat"><div className="stat-n">{users.length}</div><div className="stat-l">users</div></div>
          <div className="stat"><div className="stat-n">{pkgCount}</div><div className="stat-l">packages</div></div>
          <div className="stat"><div className="stat-n">{recipeCount}</div><div className="stat-l">recipes</div></div>
          <div className="stat"><div className="stat-n">{pendingCount}</div><div className="stat-l">pending</div></div>
        </div>

        <h2 style={{ fontSize: "1.4rem", marginTop: "2.5rem" }}>Users</h2>
        <table className="table">
          <thead>
            <tr><th>User</th><th>Email</th><th>Approved</th><th>Role &amp; trust</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td className="mono-sm">{u.email}</td>
                <td>{u.approvedCount}</td>
                <td><RoleControls userId={u.id} role={u.globalRole} trusted={u.trusted} /></td>
                <td>{u.id !== me.id && <DeleteUser userId={u.id} username={u.username} />}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={{ fontSize: "1.4rem", marginTop: "2.5rem" }}>Recent activity</h2>
        <table className="table">
          <thead>
            <tr><th>When</th><th>Who</th><th>Action</th><th>Target</th></tr>
          </thead>
          <tbody>
            {audit.map((a) => (
              <tr key={a.id}>
                <td className="mono-sm">{a.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                <td>{a.actor?.username ?? "—"}</td>
                <td><code>{a.action}</code></td>
                <td className="mono-sm">{a.targetType}/{a.targetId?.slice(0, 8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
