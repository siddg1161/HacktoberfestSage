import { Request, Response } from "express";
import { query } from "../config/db.js";
import { InventoryService } from "../services/inventory.service.js";
import { AgentService } from "../services/agent.service.js";

export class PortalController {
  /**
   * GET /api/portal/:threadId
   * Public endpoint for customer ("Sharma Ji") to review their quotation.
   * No auth required.
   */
  static async getPortalQuote(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;

      const quoteRes = await query(
        `SELECT id, thread_id, client_name, client_phone, subtotal, gst_total, 
                grand_total, status, created_at
         FROM quotes
         WHERE thread_id = $1;`,
        [threadId]
      );

      if (quoteRes.rows.length === 0) {
        // Fallback: Check if quote is currently in LangGraph draft/review state
        const draftValues = await AgentService.getQuoteState(threadId);
        const draftItems = draftValues?.extracted_items || draftValues?.extractedItems;
        if (draftValues && Array.isArray(draftItems) && draftItems.length > 0) {
          const subtotal = Number(draftValues.subtotal ?? draftValues.subTotal ?? 0);
          const gstTotal = Number(draftValues.gst_total ?? draftValues.gstTotal ?? 0);
          const grandTotal = Number(draftValues.grand_total ?? draftValues.grandTotal ?? 0);

          res.status(200).json({
            success: true,
            data: {
              id: 0,
              thread_id: threadId,
              client_name: draftValues.client_name || draftValues.clientName || "Valued Client",
              client_phone: draftValues.client_phone || draftValues.clientPhone || "+91-9826012345",
              business_name: draftValues.business_name || draftValues.businessName || "QuoteFlow Verified Partner",
              business_category: draftValues.business_category || draftValues.businessCategory || "Trade Services",
              currency_symbol: draftValues.currency_symbol || "₹",
              subtotal,
              gst_total: gstTotal,
              grand_total: grandTotal,
              status: "DRAFT_PENDING_APPROVAL",
              isDraftPreview: true,
              created_at: new Date().toISOString(),
              items: draftItems.map((item: any, idx: number) => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.unit_price) || 0;
                const gstRate = Number(item.gst_rate ?? 18);
                const lineTotal = Number(item.line_total) || (qty * price * (1 + gstRate / 100));
                const gstAmount = Number(item.gst_amount) || (lineTotal - qty * price);
                return {
                  id: idx + 1,
                  item_name: item.item_name || "Quoted Item",
                  quantity: qty,
                  unit_price: price,
                  gst_rate: gstRate,
                  gst_amount: Math.round(gstAmount * 100) / 100,
                  line_total: Math.round(lineTotal * 100) / 100,
                  is_ai_suggested: Boolean(item.is_ai_suggested),
                };
              }),
              seller: {
                businessName: draftValues.business_name || draftValues.businessName || "Sharma Electricals & Hardware Depot",
                address: "Plot 42, Jawahar Marg, Indore, MP - 452001",
                phone: "+91-9826012345",
                gstin: "23AABCP9876Q1Z8",
              },
            },
          });
          return;
        }

        res.status(404).json({ success: false, error: "Quotation not found or link expired." });
        return;
      }

      const quote = quoteRes.rows[0];
      const itemsRes = await query(
        `SELECT id, item_name, quantity, unit_price, gst_rate, gst_amount, line_total, is_ai_suggested
         FROM quote_line_items
         WHERE quote_id = $1
         ORDER BY id ASC;`,
        [quote.id]
      );

      res.status(200).json({
        success: true,
        data: {
          ...quote,
          items: itemsRes.rows,
          seller: {
            businessName: "Sharma Electricals & Hardware Depot",
            address: "Plot 42, Jawahar Marg, Indore, MP - 452001",
            phone: "+91-9826012345",
            gstin: "23AABCP9876Q1Z8",
          },
        },
      });
    } catch (error: any) {
      console.error("[PortalController] getPortalQuote error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to load quotation portal.",
      });
    }
  }

  /**
   * POST /api/portal/:threadId/approve
   * Customer clicks "Approve & Place Order".
   * Automatically deducts stock from catalog_items and converts status to WON.
   */
  static async approvePortalQuote(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;

      const quoteRes = await query(
        "SELECT id, status, grand_total, client_name FROM quotes WHERE thread_id = $1;",
        [threadId]
      );

      if (quoteRes.rows.length === 0) {
        res.status(404).json({ success: false, error: "Quote not found." });
        return;
      }

      const quote = quoteRes.rows[0];

      if (quote.status === "WON" || quote.status === "INVOICED") {
        res.status(200).json({
          success: true,
          message: "Quote has already been confirmed and approved.",
          data: { quoteId: quote.id, status: quote.status },
        });
        return;
      }

      // Deduct stock in catalog_items
      await InventoryService.deductStockForQuote(quote.id);

      // Update quote status to WON
      await query(
        "UPDATE quotes SET status = 'WON', updated_at = CURRENT_TIMESTAMP WHERE id = $1;",
        [quote.id]
      );

      res.status(200).json({
        success: true,
        message: "Thank you! Your quotation has been approved and order confirmed.",
        data: {
          quoteId: quote.id,
          threadId,
          status: "WON",
          invoiceUrl: `/api/quotes/${threadId}/invoice`,
        },
      });
    } catch (error: any) {
      console.error("[PortalController] approvePortalQuote error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to approve quotation.",
      });
    }
  }
}
