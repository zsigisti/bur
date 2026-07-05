// Session cookie helpers (Next 15: cookies() is async).
import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "./auth";
import { prisma } from "./db";
import type { Principal } from "./permissions";

const MAXAGE = 60 * 60 * 24 * 30; // 30 days

export async function currentUser(): Promise<Principal | null> {
  const jar = await cookies();
  return resolveSession(jar.get(SESSION_COOKIE)?.value);
}

export interface FullUser extends Principal {
  username: string;
  email: string;
}

export async function currentUserFull(): Promise<FullUser | null> {
  const p = await currentUser();
  if (!p) return null;
  const u = await prisma.user.findUnique({
    where: { id: p.id },
    select: { username: true, email: true },
  });
  if (!u) return null;
  return { ...p, username: u.username, email: u.email };
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Secure only when actually served over HTTPS. Over plain-HTTP LAN access
    // (http://192.168.0.79:82) a Secure cookie is dropped by the browser, so
    // set COOKIE_SECURE=false there and flip it to true behind Cloudflare TLS.
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: MAXAGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
