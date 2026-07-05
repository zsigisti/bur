// Central RBAC. Every mutation calls into here; the UI never decides access.
//
// Global roles:  AUTHOR (can do anything) > MAINTAINER (review gate) > CONTRIBUTOR
// Package roles: OWNER (the package author) and CONTRIBUTOR (granted per package)
// Trust:         approvedCount >= TRUST_THRESHOLD (or manual) => submissions auto-approve

import { prisma } from "./db";
import { TRUST_THRESHOLD, type GlobalRole } from "./types";

export interface Principal {
  id: string;
  globalRole: GlobalRole;
  trusted: boolean;
  approvedCount: number;
}

export const isAuthor = (u: Principal) => u.globalRole === "AUTHOR";
export const isMaintainer = (u: Principal) =>
  u.globalRole === "MAINTAINER" || u.globalRole === "AUTHOR";

/** A user is trusted once they have TRUST_THRESHOLD approved recipes (or manual flag). */
export const isTrusted = (u: Principal) =>
  u.trusted || u.approvedCount >= TRUST_THRESHOLD;

/** OWNER or CONTRIBUTOR on this specific package (Authors count everywhere). */
export async function hasPackageAccess(
  u: Principal,
  packageId: string,
): Promise<boolean> {
  if (isAuthor(u)) return true;
  const role = await prisma.packageRole.findUnique({
    where: { packageId_userId: { packageId, userId: u.id } },
  });
  return role != null; // OWNER or CONTRIBUTOR
}

/** Only the package OWNER or a global AUTHOR. */
export async function isPackageOwner(
  u: Principal,
  packageId: string,
): Promise<boolean> {
  if (isAuthor(u)) return true;
  const role = await prisma.packageRole.findUnique({
    where: { packageId_userId: { packageId, userId: u.id } },
  });
  return role?.role === "OWNER";
}

/** Can this user edit/submit recipes for the package without further review? */
export async function canEditPackage(u: Principal, packageId: string) {
  return hasPackageAccess(u, packageId);
}

/**
 * When a user submits a recipe, does it need human review?
 * No review if: the submitter is trusted, is an Author, or owns/contributes to
 * the package (editing their own package). Otherwise a Maintainer/Author reviews.
 */
export async function submissionNeedsReview(
  u: Principal,
  packageId: string,
): Promise<boolean> {
  if (isTrusted(u) || isAuthor(u)) return false;
  if (await hasPackageAccess(u, packageId)) return false;
  return true;
}

/** Who may approve/reject a pending recipe: any Maintainer or Author. */
export const canReviewRecipes = (u: Principal) => isMaintainer(u);

/** Who may approve a contribution request to a package: that package's OWNER, or an Author. */
export async function canDecideContribution(u: Principal, packageId: string) {
  return isPackageOwner(u, packageId);
}

/** Who may publish an APPROVED recipe's .bpm to the mirror: owner, package
 *  contributor, the original submitter, or an Author. */
export async function canPublish(
  u: Principal,
  packageId: string,
  submittedById: string,
): Promise<boolean> {
  if (isAuthor(u)) return true;
  if (u.id === submittedById) return true;
  return hasPackageAccess(u, packageId);
}
