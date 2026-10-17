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
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_RaxmX3EWiZ2f@ep-billowing-bar-b5f1nxza.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require",
  agentApiUrl: process.env.AGENT_API_URL || "http://localhost:2024",
  clientPortalBaseUrl:
    process.env.CLIENT_PORTAL_BASE_URL || "http://localhost:5173/portal",
  brevoApiKey: process.env.BREVO_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "nitin20071501@gmail.com",
  emailSenderName: process.env.EMAIL_SENDER_NAME || "DUKAAN",
  ownerEmail: process.env.OWNER_EMAIL || process.env.EMAIL_FROM || "nitin20071501@gmail.com",
};

