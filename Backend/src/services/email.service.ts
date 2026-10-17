import { config } from "../config/env.js";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export interface LowStockItemAlert {
  sku_id: string;
  item_name: string;
  category?: string;
  unit?: string;
  current_stock: number;
  reorder_threshold: number;
  preferred_supplier?: string;
  supplier_lead_time_days?: number;
  deficit_qty?: number;
  previous_stock?: number;
}

export interface StockAlertOptions {
  ownerEmail?: string;
  ownerName?: string;
  items: LowStockItemAlert[];
  triggerReason?: string;
  quoteId?: number | string;
  threadId?: string;
  clientName?: string;
}

export interface SendEmailPayload {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
}

/**
 * Returns the Brevo API key or throws a descriptive error if missing.
 */
function getBrevoApiKey(): string {
  let apiKey = process.env.BREVO_API_KEY || config.brevoApiKey || "";
  apiKey = apiKey.trim().replace(/^["']|["';]+$/g, "").trim();
  if (!apiKey) {
    throw new Error(
      "BREVO_API_KEY is not defined. Please configure BREVO_API_KEY in your environment variables or .env file."
    );
  }
  return apiKey;
}

/**
 * Core generic helper to send transactional emails via Brevo API v3.
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
  senderName,
  senderEmail,
}: SendEmailPayload) {
  const apiKey = getBrevoApiKey();
  const effectiveSenderEmail =
    senderEmail || process.env.EMAIL_FROM || config.emailFrom || "nitin20071501@gmail.com";
  const effectiveSenderName =
    senderName || process.env.EMAIL_SENDER_NAME || config.emailSenderName || "QuoteFlow Inventory Alert";

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: effectiveSenderName,
        email: effectiveSenderEmail,
      },
      to,
      subject,
      htmlContent,
      textContent: textContent || htmlContent.replace(/<[^>]*>?/gm, ""),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    messageId?: string;
    message?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new Error(
      `Failed to send email: ${data.message ?? `Brevo API error ${response.status}`}`
    );
  }

  return data;
}

/**
 * Sends OTP verification or password reset emails.
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: "verification" | "password-reset"
) {
  const isVerification = purpose === "verification";

  const subject = isVerification
    ? "Verify your IP-SAKTI Sahayak account"
    : "Reset your IP-SAKTI Sahayak password";

  const heading = isVerification
    ? "Verify your email"
    : "Reset your password";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
      <div style="margin-bottom: 24px; text-align: center;">
        <span style="display: inline-block; padding: 8px 16px; background: #f0fdf4; color: #166534; font-weight: 700; font-size: 13px; border-radius: 9999px; letter-spacing: 0.05em; text-transform: uppercase;">
          IP-SAKTI Sahayak
        </span>
      </div>
      <h2 style="color: #111827; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 8px; text-align: center;">
        ${heading}
      </h2>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.5; text-align: center; margin-top: 0; margin-bottom: 24px;">
        Use the following one-time password (OTP) to complete your request.
      </p>

      <div style="background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">
          Your OTP Code
        </div>
        <h1 style="font-family: monospace; letter-spacing: 10px; font-size: 36px; font-weight: 800; color: #111827; margin: 0; padding-left: 10px;">
          ${otp}
        </h1>
        <p style="color: #dc2626; font-size: 12px; font-weight: 600; margin-top: 10px; margin-bottom: 0;">
          ⏱ Valid for 10 minutes only
        </p>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; text-align: center; margin: 0;">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;

  const text =
    `${heading}\n\nYour OTP is: ${otp}\n\n` +
    `This OTP is valid for 10 minutes.\n\n` +
    `If you did not request this, you can safely ignore this email.`;

  return await sendEmail({
    to: [{ email }],
    subject,
    htmlContent: html,
    textContent: text,
    senderName: "IP-SAKTI Sahayak",
    senderEmail: process.env.EMAIL_FROM || config.emailFrom || "nitin20071501@gmail.com",
  });
}

/**
 * Sends a rich, formatted Low Stock / Out of Stock alert email to the store owner
 * when catalog item stock drops to or below the safety reorder threshold.
 */
export async function sendStockAlertEmail(options: StockAlertOptions) {
  const {
    ownerEmail = process.env.OWNER_EMAIL || config.ownerEmail || "nitin20071501@gmail.com",
    ownerName = "Store Owner",
    items,
    triggerReason = "Automatic stock depletion following customer quote confirmation",
    quoteId,
    threadId,
    clientName,
  } = options;

  if (!items || items.length === 0) {
    console.log("[email.service.ts]: No items to alert for.");
    return { messageId: "none", message: "No low stock items provided" };
  }

  const outOfStockCount = items.filter((i) => Number(i.current_stock) <= 0).length;
  const isSevere = outOfStockCount > 0;

  // Dynamic email subject based on severity
  let subject: string;
  if (items.length === 1) {
    const item = items[0];
    const isZero = Number(item.current_stock) <= 0;
    subject = isZero
      ? `🚨 CRITICAL OUT OF STOCK: ${item.item_name} (0 remaining)`
      : `⚠️ Low Stock Alert: ${item.item_name} reached reorder threshold (${item.current_stock}/${item.reorder_threshold})`;
  } else {
    subject = isSevere
      ? `🚨 URGENT: ${outOfStockCount} Out-of-Stock & ${items.length - outOfStockCount} Low Stock Item(s) Need Reordering`
      : `⚠️ Low Stock Alert: ${items.length} item(s) dropped below reorder threshold`;
  }

  const timestamp = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Build table rows for items
  const tableRowsHtml = items
    .map((item) => {
      const stock = Number(item.current_stock);
      const threshold = Number(item.reorder_threshold);
      const isZero = stock <= 0;
      const deficit = item.deficit_qty ?? Math.max(0, threshold - stock);
      const unit = item.unit || "unit";

      const badgeBg = isZero ? "#fee2e2" : "#fef3c7";
      const badgeText = isZero ? "#991b1b" : "#92400e";
      const badgeLabel = isZero ? "OUT OF STOCK" : "LOW STOCK";

      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 14px 12px; vertical-align: top;">
            <div style="font-weight: 700; color: #111827; font-size: 14px;">${item.item_name}</div>
            <div style="font-family: monospace; font-size: 11px; color: #6b7280; margin-top: 2px;">
              SKU: ${item.sku_id} ${item.category ? `• ${item.category}` : ""}
            </div>
          </td>
          <td style="padding: 14px 12px; vertical-align: top; text-align: center;">
            <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; background: ${badgeBg}; color: ${badgeText};">
              ${badgeLabel}
            </span>
            <div style="font-weight: 800; font-size: 15px; color: ${isZero ? "#dc2626" : "#b45309"}; margin-top: 4px;">
              ${stock} <span style="font-size: 11px; font-weight: normal; color: #6b7280;">${unit}s</span>
            </div>
          </td>
          <td style="padding: 14px 12px; vertical-align: top; text-align: center;">
            <div style="font-weight: 700; font-size: 14px; color: #374151;">
              ${threshold} ${unit}s
            </div>
            ${
              deficit > 0
                ? `<div style="font-size: 11px; color: #dc2626; font-weight: 600; margin-top: 2px;">-${deficit} under safety</div>`
                : ""
            }
          </td>
          <td style="padding: 14px 12px; vertical-align: top;">
            <div style="font-weight: 600; font-size: 13px; color: #1f2937;">
              ${item.preferred_supplier || "Standard Depot Supplier"}
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
              Lead time: ~${item.supplier_lead_time_days ?? 2} day(s)
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  // Context metadata block
  const contextHtml =
    quoteId || threadId || clientName
      ? `
      <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
          <strong>Order Context:</strong> Stock deducted for 
          ${clientName ? `<strong>${clientName}</strong> ` : ""}
          ${quoteId ? `(Quote #${quoteId}) ` : ""}
          ${threadId ? `<span style="font-family: monospace; font-size: 11px; color: #64748b;">[Thread: ${threadId}]</span>` : ""}
        </p>
      </div>
    `
      : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        
        <!-- Header Banner -->
        <div style="background: ${isSevere ? "#991b1b" : "#b45309"}; padding: 24px; color: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <span style="display: inline-block; padding: 4px 10px; background: rgba(255, 255, 255, 0.2); border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">
                ⚡ IP-SAKTI / QuoteFlow Sentinel
              </span>
              <h1 style="margin: 10px 0 4px 0; font-size: 22px; font-weight: 800; line-height: 1.2;">
                ${isSevere ? "🚨 Critical Stock Warning" : "⚠️ Low Inventory Notice"}
              </h1>
              <p style="margin: 0; font-size: 13px; opacity: 0.9;">
                ${triggerReason} • ${timestamp}
              </p>
            </div>
          </div>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 15px; color: #334155; margin-top: 0; line-height: 1.5;">
            Hello <strong>${ownerName}</strong>,
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
            The automated inventory monitor detected that <strong>${items.length} catalog item(s)</strong> have dropped to or below their required safety reorder levels. Immediate replenishment is advised to avoid stockouts.
          </p>

          ${contextHtml}

          <!-- Items Table -->
          <div style="overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">
                  <th style="padding: 12px; font-weight: 800;">Item & SKU</th>
                  <th style="padding: 12px; font-weight: 800; text-align: center;">Stock</th>
                  <th style="padding: 12px; font-weight: 800; text-align: center;">Safety Threshold</th>
                  <th style="padding: 12px; font-weight: 800;">Supplier</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Suggested Action Callout -->
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-start;">
              <div>
                <h4 style="margin: 0 0 6px 0; color: #065f46; font-size: 14px; font-weight: 800;">
                  📦 Recommended Action: Autonomous Restock Purchase Order
                </h4>
                <p style="margin: 0; font-size: 13px; color: #047857; line-height: 1.5;">
                  Purchase order drafts have been prepared in your PulseOps Restock dashboard. You can review supplier lead times and approve restocking with a single click.
                </p>
              </div>
            </div>
          </div>

          <!-- Footer Note -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 24px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0 0 6px 0;">
              This is an automated operational notification sent by QuoteFlow AI / IP-SAKTI Sahayak.
            </p>
            <p style="margin: 0;">
              Indore, MP • Sharma Electricals & Hardware Depot
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain-text alternative
  const textLines = [
    `URGENT INVENTORY ALERT - ${isSevere ? "CRITICAL OUT OF STOCK" : "LOW STOCK"}`,
    `Triggered: ${timestamp}`,
    `Reason: ${triggerReason}`,
    quoteId ? `Quote ID: #${quoteId}` : "",
    clientName ? `Client: ${clientName}` : "",
    "",
    "AFFECTED ITEMS:",
    ...items.map(
      (it) =>
        `- ${it.item_name} (SKU: ${it.sku_id}): Current Stock: ${it.current_stock} ${it.unit || "units"} (Reorder Threshold: ${it.reorder_threshold}) | Supplier: ${it.preferred_supplier || "N/A"}`
    ),
    "",
    "Action Required: Please review your Restock Purchase Orders dashboard and reorder from preferred suppliers.",
  ].filter(Boolean);

  const textContent = textLines.join("\n");

  console.log(
    `[email.service.ts] Sending stock alert to owner: ${ownerEmail} for ${items.length} item(s)...`
  );

  return await sendEmail({
    to: [{ email: ownerEmail, name: ownerName }],
    subject,
    htmlContent: html,
    textContent,
  });
}
