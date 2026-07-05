// Shared string unions (SQL Server has no native enums; we validate in app code).

export const GLOBAL_ROLES = ["AUTHOR", "MAINTAINER", "CONTRIBUTOR"] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export const RECIPE_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
] as const;
export type RecipeStatus = (typeof RECIPE_STATUSES)[number];

export const PACKAGE_ROLES = ["OWNER", "CONTRIBUTOR"] as const;
export type PackageRoleType = (typeof PACKAGE_ROLES)[number];

export const REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const TOKEN_PURPOSES = [
  "LOGIN_2FA",
  "EMAIL_VERIFY",
  "PASSWORD_RESET",
] as const;
export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

/** The number of approved recipes after which a user's submissions auto-approve. */
export const TRUST_THRESHOLD = 20;
