// Passwords, session tokens, and 2FA codes.
//
// - Passwords: argon2id.
// - Sessions: 256-bit opaque token, only its SHA-256 hash is stored; the raw
//   token lives in an HttpOnly/Secure/SameSite=Lax cookie.
// - 2FA/verify codes: 6-digit, hashed at rest, single-use, 10-minute TTL.

import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "./db";
import type { Principal } from "./permissions";
import type { GlobalRole, TokenPurpose } from "./types";

export const SESSION_COOKIE = "bur_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const CODE_TTL_MS = 1000 * 60 * 10; // 10 minutes

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// ---- passwords ------------------------------------------------------------
export const hashPassword = (pw: string) =>
  argonHash(pw, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
export const verifyPassword = (hashStr: string, pw: string) =>
  argonVerify(hashStr, pw).catch(() => false);

// ---- sessions -------------------------------------------------------------
export async function createSession(userId: string, ip?: string, ua?: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      ip,
      userAgent: ua?.slice(0, 512),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token; // raw token -> cookie
}

export async function resolveSession(token: string | undefined): Promise<Principal | null> {
  if (!token) return null;
  const s = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!s || s.expiresAt < new Date()) return null;
  return {
    id: s.user.id,
    globalRole: s.user.globalRole as GlobalRole,
    trusted: s.user.trusted,
    approvedCount: s.user.approvedCount,
  };
}

export async function revokeSession(token: string) {
  await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
}

// ---- 2FA / email codes ----------------------------------------------------
export async function issueCode(userId: string, purpose: TokenPurpose) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.twoFactorToken.create({
    data: {
      userId,
      purpose,
      codeHash: sha256(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  return code; // send via Resend, never store raw
}

export async function consumeCode(
  userId: string,
  purpose: TokenPurpose,
  code: string,
): Promise<boolean> {
  const tok = await prisma.twoFactorToken.findFirst({
    where: { userId, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!tok) return false;
  const a = Buffer.from(sha256(code));
  const b = Buffer.from(tok.codeHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  await prisma.twoFactorToken.update({
    where: { id: tok.id },
    data: { consumedAt: new Date() },
  });
  return true;
}
