import dotenv from "dotenv";

dotenv.config();

const parsePort = (val: string | undefined): number => {
  if (!val) return 5000;
  // Clean quotes, colons, or accidental whitespace
  const cleaned = val.replace(/['":]+/g, "").trim();
  const parsed = parseInt(cleaned, 10);
  return !isNaN(parsed) && parsed > 0 && parsed < 65536 ? parsed : 5000;
};

export const config = {
  port: parsePort(process.env.PORT),
  isProduction: process.env.NODE_ENV === "production",
  // Never keep connection strings or auth secrets in source control. Set these
  // values in the deployment environment (and in a local .env file only).
  databaseUrl: process.env.DATABASE_URL || "",
  betterAuthSecret:
    process.env.BETTER_AUTH_SECRET ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "development-only-secret-change-before-production-32chars"),
  betterAuthUrl: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  trustedOrigins: (process.env.TRUSTED_ORIGINS ||
    "http://localhost:5173,http://localhost:8443,https://hacktoberfest-sage.vercel.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  agentApiUrl: process.env.AGENT_API_URL || "https://quoteflow-agent.onrender.com",
  clientPortalBaseUrl:
    process.env.CLIENT_PORTAL_BASE_URL || "https://hacktoberfest-sage.vercel.app/portal",
  brevoApiKey: process.env.BREVO_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "nitin20071501@gmail.com",
  emailSenderName: process.env.EMAIL_SENDER_NAME || "DUKAAN",
  ownerEmail: process.env.OWNER_EMAIL || process.env.EMAIL_FROM || "nitin20071501@gmail.com",
};

