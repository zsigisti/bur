import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { isPackageOwner } from "@/lib/permissions";
import { clientIp } from "@/lib/ratelimit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const decision = body?.decision === "approve" ? "approve" : body?.decision === "reject" ? "reject" : null;
  if (!decision) return Response.json({ error: "Invalid decision." }, { status: 400 });

  try {
    const reqRow = await prisma.contributionRequest.findUnique({ where: { id } });
    if (!reqRow) return Response.json({ error: "Request not found." }, { status: 404 });
    // Package owner (or Author) decides.
    if (!(await isPackageOwner(user, reqRow.packageId))) {
      return Response.json({ error: "Not authorized." }, { status: 403 });
    }
    if (reqRow.status !== "PENDING") {
      return Response.json({ error: "Already decided." }, { status: 409 });
    }

    if (decision === "approve") {
      await prisma.$transaction([
        prisma.contributionRequest.update({
          where: { id },
          data: { status: "APPROVED", decidedById: user.id, decidedAt: new Date() },
        }),
        prisma.packageRole.upsert({
          where: { packageId_userId: { packageId: reqRow.packageId, userId: reqRow.userId } },
          update: { role: "CONTRIBUTOR" },
          create: { packageId: reqRow.packageId, userId: reqRow.userId, role: "CONTRIBUTOR", grantedBy: user.id },
        }),
      ]);
    } else {
      await prisma.contributionRequest.update({
        where: { id },
        data: { status: "REJECTED", decidedById: user.id, decidedAt: new Date() },
      });
    }

    await prisma.auditLog.create({
      data: { actorId: user.id, action: `contribution.${decision}`, targetType: "contribution", targetId: id, ip: clientIp(req) },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not process the request." }, { status: 503 });
  }
}
