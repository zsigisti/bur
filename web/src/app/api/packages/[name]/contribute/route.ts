import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { hasPackageAccess } from "@/lib/permissions";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in to request access." }, { status: 401 });
  if (!rateLimit(`contrib:${user.id}`, 20, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }
  const { name } = await params;

  try {
    const pkg = await prisma.package.findUnique({ where: { name } });
    if (!pkg) return Response.json({ error: "Package not found." }, { status: 404 });
    if (await hasPackageAccess(user, pkg.id)) {
      return Response.json({ error: "You already have access to this package." }, { status: 409 });
    }

    const body = await req.json().catch(() => null);
    const message = String(body?.message ?? "").slice(0, 1000) || null;

    await prisma.contributionRequest.upsert({
      where: { packageId_userId: { packageId: pkg.id, userId: user.id } },
      update: { status: "PENDING", message, decidedById: null, decidedAt: null },
      create: { packageId: pkg.id, userId: user.id, message, status: "PENDING" },
    });
    await prisma.auditLog.create({
      data: { actorId: user.id, action: "contribution.request", targetType: "package", targetId: pkg.id, ip: clientIp(req) },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not submit the request." }, { status: 503 });
  }
}
