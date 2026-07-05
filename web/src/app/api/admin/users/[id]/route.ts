import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { isAuthor } from "@/lib/permissions";
import { GLOBAL_ROLES, type GlobalRole } from "@/lib/types";
import { clientIp } from "@/lib/ratelimit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await currentUser();
  if (!actor || !isAuthor(actor)) return Response.json({ error: "Not authorized." }, { status: 403 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const data: { globalRole?: GlobalRole; trusted?: boolean } = {};
  if (body?.globalRole !== undefined) {
    if (!GLOBAL_ROLES.includes(body.globalRole)) {
      return Response.json({ error: "Invalid role." }, { status: 400 });
    }
    data.globalRole = body.globalRole;
  }
  if (typeof body?.trusted === "boolean") data.trusted = body.trusted;
  if (Object.keys(data).length === 0) return Response.json({ error: "Nothing to update." }, { status: 400 });

  if (data.globalRole && data.globalRole !== "AUTHOR" && id === actor.id) {
    const authors = await prisma.user.count({ where: { globalRole: "AUTHOR" } });
    if (authors <= 1) return Response.json({ error: "You are the only Author." }, { status: 409 });
  }

  try {
    const u = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, globalRole: true, trusted: true },
    });
    await prisma.auditLog.create({
      data: { actorId: actor.id, action: "user.update", targetType: "user", targetId: id, metadata: JSON.stringify(data), ip: clientIp(req) },
    });
    return Response.json({ ok: true, user: u });
  } catch {
    return Response.json({ error: "Update failed." }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await currentUser();
  if (!actor || !isAuthor(actor)) return Response.json({ error: "Not authorized." }, { status: 403 });
  const { id } = await params;
  if (id === actor.id) return Response.json({ error: "You can't delete your own account here." }, { status: 409 });

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, globalRole: true } });
    if (!target) return Response.json({ error: "User not found." }, { status: 404 });
    if (target.globalRole === "AUTHOR") {
      const authors = await prisma.user.count({ where: { globalRole: "AUTHOR" } });
      if (authors <= 1) return Response.json({ error: "Can't delete the last Author." }, { status: 409 });
    }

    // Untangle FKs (relations to User are NoAction), then delete the user
    // (sessions / 2FA / login events cascade).
    await prisma.$transaction([
      prisma.auditLog.updateMany({ where: { actorId: id }, data: { actorId: null } }),
      prisma.recipe.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } }),
      prisma.package.deleteMany({ where: { ownerId: id } }), // cascades its recipes/roles/requests
      prisma.recipe.deleteMany({ where: { submittedById: id } }),
      prisma.packageRole.deleteMany({ where: { userId: id } }),
      prisma.contributionRequest.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    await prisma.auditLog.create({
      data: { actorId: actor.id, action: "user.delete", targetType: "user", targetId: id, ip: clientIp(req) },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Delete failed." }, { status: 503 });
  }
}
