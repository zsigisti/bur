import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const schema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(10, "New password must be at least 10 characters").max(256),
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (!rateLimit(`pw:${user.id}`, 10, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    if (!u || !(await verifyPassword(u.passwordHash, parsed.data.currentPassword))) {
      return Response.json({ error: "Your current password is incorrect." }, { status: 401 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });
    await prisma.auditLog.create({
      data: { actorId: user.id, action: "account.password", targetType: "user", targetId: user.id, ip: clientIp(req) },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not update the password." }, { status: 503 });
  }
}
