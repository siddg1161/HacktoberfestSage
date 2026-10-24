import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";
import { requireSession, requireBusinessManager } from "../middleware/require-session.js";

const router = Router();

// Live inventory catalog (sanitized for technicians, full stock metrics for business managers)
router.get("/catalog", requireSession, InventoryController.getCatalog);

// Business owner inventory editing: update item, create item, delete item (Restricted to Managers)
router.put("/catalog/:skuId", requireSession, requireBusinessManager, InventoryController.updateCatalogItem);
router.post("/catalog", requireSession, requireBusinessManager, InventoryController.createCatalogItem);
router.delete("/catalog/:skuId", requireSession, requireBusinessManager, InventoryController.deleteCatalogItem);

// Autonomous supplier purchase orders (Restricted to Managers)
router.get("/pos", requireSession, requireBusinessManager, InventoryController.getPurchaseOrders);

// Mark warehouse purchase order as received (Restricted to Managers)
router.post("/pos/:poNumber/receive", requireSession, requireBusinessManager, InventoryController.receivePurchaseOrder);

// Manual stock adjustment (Restricted to Managers)
router.post("/adjust", requireSession, requireBusinessManager, InventoryController.adjustStock);

// Check catalog for low-stock items and send email to owner (Restricted to Managers)
router.post("/alerts/check", requireSession, requireBusinessManager, InventoryController.checkStockAlerts);

// Send a test low-stock alert email to verify Brevo configuration (Restricted to Managers)
router.post("/alerts/test", requireSession, requireBusinessManager, InventoryController.sendTestStockAlert);

export default router;

