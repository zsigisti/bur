import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32)
    .regex(/^[a-z0-9][a-z0-9_-]*$/i, "Use letters, numbers, hyphens or underscores"),
  email: z.string().email("Enter a valid email address").max(254),
  password: z.string().min(10, "Password must be at least 10 characters").max(256),
});

// Sign in with either a username or an email address.
export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your username or email").max(254),
  password: z.string().min(1).max(256),
});

export const verifySchema = z.object({
  identifier: z.string().min(1).max(254),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
