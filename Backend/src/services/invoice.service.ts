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
}

export class InvoiceService {
  /**
   * Generates a sleek, professional GST Tax Invoice HTML document.
   * Features CGST (9%) and SGST (9%) split with Indian Rupee formatting.
   */
  static generateInvoiceHtml(data: InvoiceData): string {
    const cgstTotal = (data.gstTotal / 2).toFixed(2);
    const sgstTotal = (data.gstTotal / 2).toFixed(2);

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

    <!-- Print Action -->
    <div class="no-print" style="margin-top: 24px; text-align: center;">
      <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>
</body>
</html>
    `;
  }
}
