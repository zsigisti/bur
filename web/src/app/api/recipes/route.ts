import { parse as parseToml } from "smol-toml";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { hasPackageAccess, submissionNeedsReview } from "@/lib/permissions";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const NAME_RE = /^[a-z0-9][a-z0-9._+-]*$/;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in to submit a recipe." }, { status: 401 });
  if (!rateLimit(`recipe:${user.id}`, 30, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many submissions. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const bpmToml = typeof body?.bpmToml === "string" ? body.bpmToml : "";
  if (!bpmToml.trim()) return Response.json({ error: "The recipe is empty." }, { status: 400 });
  if (bpmToml.length > 100_000) return Response.json({ error: "Recipe is too large." }, { status: 400 });

  // Parse + validate the recipe.
  let doc: any;
  try {
    doc = parseToml(bpmToml);
  } catch (e) {
    return Response.json({ error: `Invalid TOML: ${e instanceof Error ? e.message : "parse error"}` }, { status: 400 });
  }
  const pkg = doc?.package ?? {};
  const name = String(pkg.name ?? "").trim();
  const version = String(pkg.version ?? "").trim();
  const release = Number.isFinite(pkg.release) ? Number(pkg.release) : 1;
  const summary = pkg.summary ? String(pkg.summary).slice(0, 1000) : null;

  if (!NAME_RE.test(name)) return Response.json({ error: "Missing or invalid [package].name" }, { status: 400 });
  if (!version) return Response.json({ error: "Missing [package].version" }, { status: 400 });
  if (!Array.isArray(doc?.source) || doc.source.length === 0) {
    return Response.json({ error: "At least one [[source]] is required" }, { status: 400 });
  }

  try {
    // New package -> the submitter becomes its owner. Existing package -> they
    // must already own or contribute to it.
    let pkgRow = await prisma.package.findUnique({ where: { name } });
    if (!pkgRow) {
      pkgRow = await prisma.package.create({
        data: {
          name,
          description: summary,
          homepage: pkg.homepage ? String(pkg.homepage).slice(0, 500) : null,
          ownerId: user.id,
          roles: { create: { userId: user.id, role: "OWNER", grantedBy: user.id } },
        },
      });
    } else if (!(await hasPackageAccess(user, pkgRow.id))) {
      return Response.json(
        { error: "You don't have access to this package. Request contributor access first." },
        { status: 403 },
      );
    }

    const needsReview = await submissionNeedsReview(user, pkgRow.id);
    const recipe = await prisma.recipe.create({
      data: {
        packageId: pkgRow.id,
        version,
        release,
        summary,
        bpmToml,
        status: needsReview ? "PENDING" : "APPROVED",
        submittedById: user.id,
        reviewedAt: needsReview ? null : new Date(),
      },
    });

    await prisma.auditLog.create({
      data: { actorId: user.id, action: "recipe.submit", targetType: "recipe", targetId: recipe.id, ip: clientIp(req) },
    });

    return Response.json({ ok: true, id: recipe.id, status: recipe.status, package: name });
  } catch {
    return Response.json({ error: "Could not save the recipe." }, { status: 503 });
  }
}
