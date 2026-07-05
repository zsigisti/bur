import { cookies } from "next/headers";
import { SESSION_COOKIE, revokeSession } from "@/lib/auth";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(token).catch(() => {});
  await clearSessionCookie();
  return Response.json({ ok: true });
}
