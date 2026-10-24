import { betterAuth } from "better-auth";
import { pool } from "./config/db.js";
import { config } from "./config/env.js";

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL must be configured before starting the API.");
}

if (!config.betterAuthSecret || config.betterAuthSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long.");
}

/**
 * Central Better Auth configuration. PostgreSQL owns the user, account,
 * verification and session records; business records stay in their existing
 * tables and are joined through the authenticated user's email address.
 */
export const auth = betterAuth({
  database: pool,
  baseURL: config.betterAuthUrl,
  secret: config.betterAuthSecret,
  trustedOrigins: config.trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  advanced: {
    useSecureCookies: config.isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? "none" : "lax",
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
});

export type AuthSession = typeof auth.$Infer.Session;
