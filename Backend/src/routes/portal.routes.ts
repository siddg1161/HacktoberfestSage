import { Router } from "express";
import { PortalController } from "../controllers/portal.controller.js";

const router = Router();

// Public customer preview of quotation
router.get("/:threadId", PortalController.getPortalQuote);

// Customer approval -> automatically deducts stock and converts to WON
router.post("/:threadId/approve", PortalController.approvePortalQuote);

export default router;
