import { Router } from "express";
import { QuoteController } from "../controllers/quote.controller.js";

const router = Router();

// Start quote extraction & 3-tier inventory analysis (Pauses at HITL)
router.post("/start", QuoteController.startQuote);

// Human vendor approval (Resumes post-HITL)
router.post("/:threadId/approve", QuoteController.approveQuote);

// List all quotes (for Kanban)
router.get("/", QuoteController.getAllQuotes);

// Get single quote details
router.get("/:threadId", QuoteController.getQuoteByThreadId);

// Render printable GST Tax Invoice HTML
router.get("/:threadId/invoice", QuoteController.getInvoiceHtml);

export default router;
