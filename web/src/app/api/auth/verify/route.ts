import { prisma } from "@/lib/db";
import { consumeCode, createSession } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { verifySchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`verify:${ip}`, 15, 15 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const parsed = verifySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid code" }, { status: 400 });
  }
  const { identifier, code } = parsed.data;

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });
    if (!user || !(await consumeCode(user.id, "LOGIN_2FA", code))) {
      return Response.json({ error: "That code is invalid or has expired." }, { status: 401 });
    }

    // First successful sign-in also confirms the address.
    if (!user.emailVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    }

    const ua = req.headers.get("user-agent") ?? undefined;
    const token = await createSession(user.id, ip, ua);
    await setSessionCookie(token);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
