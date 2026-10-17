import { Request, Response } from "express";
import { AgentService } from "../services/agent.service.js";
import { InvoiceService } from "../services/invoice.service.js";
import { query } from "../config/db.js";

export class QuoteController {
  /**
   * POST /api/quotes/start
   * Triggers LangGraph multimodal extraction & inventory analysis.
   * Pauses at HITL interrupt gate.
   */
  static async startQuote(req: Request, res: Response): Promise<void> {
    try {
      const { voice_transcript, slip_image, client_name, client_phone } = req.body;

      console.log(`[QuoteController] Starting quote generation for "${client_name || "New Client"}"...`);
      const result = await AgentService.startQuote({
        voiceTranscript: voice_transcript,
        slipImage: slip_image,
        clientName: client_name,
        clientPhone: client_phone,
      });

      res.status(200).json({
        success: true,
        message: "Quotation processed and awaiting human approval.",
        data: result,
      });
    } catch (error: any) {
      console.error("[QuoteController] startQuote error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to start quote pipeline.",
      });
    }
  }

  /**
   * POST /api/quotes/:threadId/approve
   * Simulates human vendor approval in Tab 1 (Magic Studio).
   * Resumes LangGraph execution and commits quote and POs to Neon DB.
   */
  static async approveQuote(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const { accept_quote, accept_addon, approve_po, edited_line_items } = req.body;

      console.log(`[QuoteController] Resuming post-HITL for thread ${threadId}...`);
      const result = await AgentService.approveAndDispatch({
        threadId,
        acceptQuote: accept_quote,
        acceptAddon: accept_addon,
        approvePo: approve_po,
        editedLineItems: edited_line_items,
      });

      res.status(200).json({
        success: true,
        message: "Quotation finalized and dispatched successfully.",
        data: result,
      });
    } catch (error: any) {
      console.error("[QuoteController] approveQuote error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to approve and dispatch quotation.",
      });
    }
  }

  /**
   * PUT /api/quotes/:threadId/edit
   * Human edit: updates line items (quantities, rates, item additions/deletions)
   * in both LangGraph checkpoint and Neon DB.
   */
  static async editQuote(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const { edited_line_items } = req.body;

      if (!Array.isArray(edited_line_items)) {
        res.status(400).json({
          success: false,
          error: "edited_line_items must be an array.",
        });
        return;
      }

      console.log(`[QuoteController] Editing quotation for thread ${threadId} with ${edited_line_items.length} items...`);
      const result = await AgentService.editQuote(threadId, edited_line_items);

      res.status(200).json({
        success: true,
        message: "Quotation updated successfully.",
        data: result,
      });
    } catch (error: any) {
      console.error("[QuoteController] editQuote error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to edit quotation.",
      });
    }
  }

  /**
   * GET /api/quotes
   * Returns all quotes for the Tab 3 Kanban / Lead Tracker.
   */
  static async getAllQuotes(req: Request, res: Response): Promise<void> {
    try {
      const quotesRes = await query(
        `SELECT id, thread_id, client_name, client_phone, subtotal, gst_total, 
                grand_total, status, ai_revenue_alert, created_at, updated_at
         FROM quotes
         ORDER BY created_at DESC;`
      );

      res.status(200).json({
        success: true,
        count: quotesRes.rows.length,
        data: quotesRes.rows,
      });
    } catch (error: any) {
      console.error("[QuoteController] getAllQuotes error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch quotes.",
      });
    }
  }

  /**
   * GET /api/quotes/:threadId
   * Returns single quote with all its child line items.
   */
  static async getQuoteByThreadId(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;

      const quoteRes = await query(
        "SELECT * FROM quotes WHERE thread_id = $1;",
        [threadId]
      );

      if (quoteRes.rows.length === 0) {
        res.status(404).json({ success: false, error: "Quote not found." });
        return;
      }

      const quote = quoteRes.rows[0];
      const itemsRes = await query(
        `SELECT id, sku_id, item_name, quantity, unit_price, gst_rate, 
                gst_amount, line_total, stock_tier, is_ai_suggested
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
        },
      });
    } catch (error: any) {
      console.error("[QuoteController] getQuoteByThreadId error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch quote details.",
      });
    }
  }

  /**
   * GET /api/quotes/:threadId/invoice
   * Renders the printable HTML GST Tax invoice.
   */
  static async getInvoiceHtml(req: Request, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;

      const quoteRes = await query("SELECT * FROM quotes WHERE thread_id = $1;", [threadId]);
      if (quoteRes.rows.length === 0) {
        res.status(404).send("<h2>Quote not found</h2>");
        return;
      }

      const quote = quoteRes.rows[0];
      const itemsRes = await query(
        "SELECT item_name, sku_id, quantity, unit_price, gst_rate, line_total, is_ai_suggested FROM quote_line_items WHERE quote_id = $1;",
        [quote.id]
      );

      const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
      const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "hacktoberfestsage.onrender.com";
      const invoiceUrl = `${protocol}://${host}/api/quotes/${quote.thread_id}/invoice`;

      const html = InvoiceService.generateInvoiceHtml({
        invoiceNumber: `INV-${quote.id.toString().padStart(5, "0")}`,
        invoiceDate: new Date(quote.created_at || Date.now()).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        clientName: quote.client_name,
        clientPhone: quote.client_phone,
        threadId: quote.thread_id,
        subtotal: parseFloat(quote.subtotal),
        gstTotal: parseFloat(quote.gst_total),
        grandTotal: parseFloat(quote.grand_total),
        invoiceUrl,
        items: itemsRes.rows.map((r: any) => ({
          itemName: r.item_name,
          skuId: r.sku_id,
          quantity: r.quantity,
          unitPrice: parseFloat(r.unit_price),
          gstRate: parseFloat(r.gst_rate),
          lineTotal: parseFloat(r.line_total),
          isAiSuggested: r.is_ai_suggested,
        })),
      });

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error: any) {
      console.error("[QuoteController] getInvoiceHtml error:", error);
      res.status(500).send("<h2>Error generating tax invoice</h2>");
    }
  }
}
