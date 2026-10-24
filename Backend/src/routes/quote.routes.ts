import { Router } from "express";
import { QuoteController } from "../controllers/quote.controller.js";
import { requireSession } from "../middleware/require-session.js";

const router = Router();

// Start quote extraction & 3-tier inventory analysis (Pauses at HITL)
router.post("/start", requireSession, QuoteController.startQuote);

// Human vendor approval (Resumes post-HITL)
router.post("/:threadId/approve", requireSession, QuoteController.approveQuote);

// Natural Language Refinement Loop (re-drafts quote via LLM and loops back to Node 2)
router.post("/:threadId/refine", requireSession, QuoteController.refineQuote);

// Human vendor edit (updates quantities, rates, line items)
router.put("/:threadId/edit", requireSession, QuoteController.editQuote);

// List all quotes (for Kanban)
router.get("/", requireSession, QuoteController.getAllQuotes);

// Get single quote details
router.get("/:threadId", requireSession, QuoteController.getQuoteByThreadId);

// Render printable GST Tax Invoice HTML
router.get("/:threadId/invoice", requireSession, QuoteController.getInvoiceHtml);

export default router;
