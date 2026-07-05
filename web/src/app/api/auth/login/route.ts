import { prisma } from "@/lib/db";
import { verifyPassword, issueCode } from "@/lib/auth";
import { sendTwoFactorCode } from "@/lib/email";
import { loginSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid username or password." }, { status: 400 });
  }
  const { identifier, password } = parsed.data;

  try {
    // Accept a username or an email address.
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });
    const ok = user ? await verifyPassword(user.passwordHash, password) : false;

    if (user) {
      await prisma.loginEvent.create({ data: { userId: user.id, ip, success: ok } });
    }
    if (!user || !ok) {
      // Uniform message — don't reveal whether the account exists.
      return Response.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const code = await issueCode(user.id, "LOGIN_2FA");
    await sendTwoFactorCode(user.email, code).catch(() => {});

    return Response.json({ twoFactor: true });
  } catch {
    return Response.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
