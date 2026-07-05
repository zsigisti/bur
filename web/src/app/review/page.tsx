import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { isMaintainer } from "@/lib/permissions";
import ReviewActions from "./ReviewActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review queue — BUR" };

export default async function Review() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isMaintainer(user)) redirect("/");

  const pending = await prisma.recipe.findMany({
    where: { status: "PENDING" },
    include: { package: true, submittedBy: { select: { username: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <section className="section">
      <div className="wrap">
        <h1 style={{ fontSize: "2rem" }}>Review queue</h1>
        <p style={{ color: "var(--fg-muted)", marginBottom: "2rem" }}>
          {pending.length} recipe{pending.length === 1 ? "" : "s"} awaiting review.
        </p>

        {pending.length === 0 ? (
          <div className="empty"><p>Nothing to review right now.</p></div>
        ) : (
          pending.map((r) => (
            <div className="review-card" key={r.id}>
              <div className="review-head">
                <div>
                  <code className="pkg-name">{r.package.name}</code>{" "}
                  <span className="muted">{r.version}-{r.release}</span>
                  <div className="muted mono-sm">submitted by {r.submittedBy.username}</div>
                </div>
                <ReviewActions recipeId={r.id} />
              </div>
              <pre className="review-toml">{r.bpmToml}</pre>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
