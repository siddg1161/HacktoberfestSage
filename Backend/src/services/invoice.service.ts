export interface InvoiceItem {
  itemName: string;
  skuId?: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  lineTotal: number;
  isAiSuggested?: boolean;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  clientPhone?: string;
  threadId: string;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  items: InvoiceItem[];
  invoiceUrl?: string;
}

export class InvoiceService {
  /**
   * Generates a sleek, professional GST Tax Invoice HTML document.
   * Features CGST (9%) and SGST (9%) split with Indian Rupee formatting.
   * Includes a direct WhatsApp wa.me link to share the invoice with the customer.
   */
  static generateInvoiceHtml(data: InvoiceData): string {
    const cgstTotal = (data.gstTotal / 2).toFixed(2);
    const sgstTotal = (data.gstTotal / 2).toFixed(2);

    let phoneDigits = (data.clientPhone || "").replace(/\D/g, "");
    if (phoneDigits.length === 10) {
      phoneDigits = "91" + phoneDigits;
    }

    const invoiceUrl =
      data.invoiceUrl || `https://hacktoberfestsage.onrender.com/api/quotes/${data.threadId}/invoice`;

    const whatsappMessage =
      `*GST Tax Invoice - ${data.invoiceNumber}*\n\n` +
      `Hello ${data.clientName},\n\n` +
      `Thank you for your order! Your quotation has been confirmed and processed.\n\n` +
      `📋 *Invoice No:* ${data.invoiceNumber}\n` +
      `💰 *Grand Total:* ₹${Number(data.grandTotal).toFixed(2)}\n` +
      `📄 *View Tax Invoice Online:* ${invoiceUrl}\n\n` +
      `_Sharma Electricals & Hardware Depot, Indore_`;

    const encodedWhatsappText = encodeURIComponent(whatsappMessage);
    const whatsappLink = phoneDigits
      ? `https://wa.me/${phoneDigits}?text=${encodedWhatsappText}`
      : `https://wa.me/?text=${encodedWhatsappText}`;

    const itemsRows = data.items
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 12px;">
            <strong style="color: #0f172a;">${it.itemName}</strong>
            ${it.skuId ? `<div style="font-size: 11px; color: #64748b;">SKU: ${it.skuId}</div>` : ""}
            ${
              it.isAiSuggested
                ? `<span style="display:inline-block; font-size: 10px; background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-top: 4px;">AI Companion Add-on</span>`
                : ""
            }
          </td>
          <td style="padding: 12px; text-align: center; color: #334155;">${it.quantity}</td>
          <td style="padding: 12px; text-align: right; color: #334155;">₹${Number(it.unitPrice).toFixed(2)}</td>
          <td style="padding: 12px; text-align: center; color: #334155;">${it.gstRate}%</td>
          <td style="padding: 12px; text-align: right; font-weight: 600; color: #0f172a;">₹${Number(it.lineTotal).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #0f172a;
      background: #f8fafc;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { box-shadow: none; border: none; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px;">
      <div>
        <h1 style="margin: 0; font-size: 26px; color: #0284c7; font-weight: 800; letter-spacing: -0.5px;">QuoteFlow AI</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">PulseOps Intelligent Electrical & Hardware Supply</p>
        <p style="margin: 2px 0 0; color: #64748b; font-size: 12px;">GSTIN: 23AABCP9876Q1Z8 | Indore, Madhya Pradesh</p>
      </div>
      <div style="text-align: right;">
        <span style="background: #0284c7; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Tax Invoice</span>
        <h2 style="margin: 8px 0 0; font-size: 16px; color: #0f172a;">${data.invoiceNumber}</h2>
        <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">Date: ${data.invoiceDate}</p>
      </div>
    </div>

    <!-- Billed To -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 28px; background: #f8fafc; padding: 16px; border-radius: 8px;">
      <div>
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Billed To (Customer):</span>
        <h3 style="margin: 4px 0 0; font-size: 16px; color: #0f172a;">${data.clientName}</h3>
        ${data.clientPhone ? `<p style="margin: 2px 0 0; font-size: 13px; color: #475569;">Contact: ${data.clientPhone}</p>` : ""}
      </div>
      <div style="text-align: right;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Reference:</span>
        <p style="margin: 4px 0 0; font-size: 12px; color: #334155; font-family: monospace;">Thread: ${data.threadId}</p>
        <p style="margin: 2px 0 0; font-size: 12px; color: #16a34a; font-weight: 600;">Status: Paid / Order Confirmed</p>
      </div>
    </div>

    <!-- Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
      <thead>
        <tr style="background: #f1f5f9; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
          <th style="padding: 10px; text-align: center; width: 40px;">#</th>
          <th style="padding: 10px; text-align: left;">Item Description</th>
          <th style="padding: 10px; text-align: center; width: 70px;">Qty</th>
          <th style="padding: 10px; text-align: right; width: 100px;">Rate</th>
          <th style="padding: 10px; text-align: center; width: 70px;">GST</th>
          <th style="padding: 10px; text-align: right; width: 110px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
      <div style="width: 280px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #475569;">
          <span>Taxable Subtotal:</span>
          <span>₹${Number(data.subtotal).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #475569;">
          <span>Central GST (CGST 9%):</span>
          <span>₹${cgstTotal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #475569;">
          <span>State GST (SGST 9%):</span>
          <span>₹${sgstTotal}</span>
        </div>
        <div style="border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #0284c7;">
          <span>Grand Total:</span>
          <span>₹${Number(data.grandTotal).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px dashed #cbd5e1; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
      <p style="margin: 0;">This is a computer-generated GST tax invoice issued via QuoteFlow AI.</p>
      <p style="margin: 4px 0 0;">Thank you for your business! Sharma Electricals & Traders, Indore.</p>
    </div>

    <!-- WhatsApp Share & Actions (Instead of PDF) -->
    <div class="no-print" style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
      <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; gap: 10px; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 14px; font-weight: 800; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35); transition: background 0.2s ease;">
        <svg style="width: 20px; height: 20px; fill: currentColor;" viewBox="0 0 24 24">
          <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.907.533 3.69 1.458 5.215L2 22l4.896-1.425a10.016 10.016 0 0 0 5.135 1.456h.005c5.534 0 10.029-4.496 10.029-10.032C22.065 6.495 17.568 2 12.031 2zm0 18.286h-.004a8.27 8.27 0 0 1-4.218-1.155l-.303-.18-3.13.911.928-3.05-.198-.316a8.285 8.285 0 0 1-1.272-4.465c0-4.57 3.719-8.288 8.293-8.288 2.215 0 4.297.863 5.862 2.43 1.565 1.566 2.427 3.649 2.427 5.864 0 4.571-3.718 8.289-8.293 8.289zm4.542-6.208c-.249-.125-1.474-.727-1.703-.81-.228-.083-.395-.125-.562.125-.166.249-.643.81-.788.977-.145.166-.291.187-.54.062-.249-.125-1.052-.388-2.003-1.237-.74-.66-1.24-1.476-1.385-1.725-.145-.249-.015-.384.11-.508.112-.112.249-.291.374-.436.124-.146.166-.249.249-.415.083-.166.042-.312-.021-.437-.062-.125-.562-1.353-.77-1.852-.202-.486-.408-.42-.562-.428l-.478-.009c-.166 0-.436.062-.664.312-.229.249-.873.853-.873 2.08s.894 2.413 1.019 2.58c.125.166 1.758 2.686 4.26 3.768.595.257 1.06.411 1.423.526.599.19 1.144.163 1.575.099.48-.072 1.474-.603 1.682-1.185.207-.582.207-1.081.145-1.185-.062-.104-.228-.166-.477-.291z"/>
        </svg>
        <span>Send Invoice to Customer on WhatsApp${data.clientPhone ? ` (${data.clientPhone})` : ""}</span>
      </a>
      <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">
        Opens WhatsApp with pre-filled message and direct invoice link for <strong>${data.clientName}</strong>
      </p>
      <button onclick="window.print()" style="margin-top: 4px; background: transparent; border: 1px solid #cbd5e1; color: #64748b; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
        🖨️ Print / Save as PDF (Internal Copy)
      </button>
    </div>
  </div>
</body>
</html>
    `;
  }
}
