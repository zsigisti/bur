import { prisma } from "@/lib/db";
import { hashPassword, issueCode } from "@/lib/auth";
import { sendEmailVerification } from "@/lib/email";
import { registerSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { username, email, password } = parsed.data;

  try {
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (exists) {
      return Response.json({ error: "That username or email is already registered." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { username, email, passwordHash: await hashPassword(password) },
    });

    const code = await issueCode(user.id, "EMAIL_VERIFY");
    await sendEmailVerification(email, code).catch(() => {});

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Registration is temporarily unavailable." }, { status: 503 });
  }
}
