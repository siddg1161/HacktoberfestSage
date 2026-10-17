import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";

const router = Router();

// Live inventory catalog with stock levels and safety thresholds
router.get("/catalog", InventoryController.getCatalog);

// Autonomous supplier purchase orders
router.get("/pos", InventoryController.getPurchaseOrders);

// Mark warehouse purchase order as received (replenishes stock)
router.post("/pos/:poNumber/receive", InventoryController.receivePurchaseOrder);

// Manual stock adjustment (triggers owner email if stock drops below threshold)
router.post("/adjust", InventoryController.adjustStock);

// Check catalog for low-stock items and send email to owner
router.post("/alerts/check", InventoryController.checkStockAlerts);

// Send a test low-stock alert email to verify Brevo configuration
router.post("/alerts/test", InventoryController.sendTestStockAlert);

export default router;

