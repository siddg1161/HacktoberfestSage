import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";

const router = Router();

// Live inventory catalog with stock levels and safety thresholds
router.get("/catalog", InventoryController.getCatalog);

// Business owner inventory editing: update item, create item, delete item
router.put("/catalog/:skuId", InventoryController.updateCatalogItem);
router.post("/catalog", InventoryController.createCatalogItem);
router.delete("/catalog/:skuId", InventoryController.deleteCatalogItem);

// Autonomous supplier purchase orders
router.get("/pos", InventoryController.getPurchaseOrders);

// Mark warehouse purchase order as received (replenishes stock)
router.post("/pos/:poNumber/receive", InventoryController.receivePurchaseOrder);

export default router;
