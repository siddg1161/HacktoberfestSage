import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";
import { requireSession } from "../middleware/require-session.js";

const router = Router();

// Live inventory catalog with stock levels and safety thresholds
router.get("/catalog", requireSession, InventoryController.getCatalog);

// Business owner inventory editing: update item, create item, delete item
router.put("/catalog/:skuId", requireSession, InventoryController.updateCatalogItem);
router.post("/catalog", requireSession, InventoryController.createCatalogItem);
router.delete("/catalog/:skuId", requireSession, InventoryController.deleteCatalogItem);

// Autonomous supplier purchase orders
router.get("/pos", requireSession, InventoryController.getPurchaseOrders);

// Mark warehouse purchase order as received (replenishes stock)
router.post("/pos/:poNumber/receive", requireSession, InventoryController.receivePurchaseOrder);

// Manual stock adjustment (triggers owner email if stock drops below threshold)
router.post("/adjust", requireSession, InventoryController.adjustStock);

// Check catalog for low-stock items and send email to owner
router.post("/alerts/check", requireSession, InventoryController.checkStockAlerts);

// Send a test low-stock alert email to verify Brevo configuration
router.post("/alerts/test", requireSession, InventoryController.sendTestStockAlert);

export default router;

