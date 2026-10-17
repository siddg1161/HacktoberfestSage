import { Request, Response } from "express";
import { InventoryService } from "../services/inventory.service.js";

export class InventoryController {
  /**
   * GET /api/inventory/catalog
   * Fetches real-time catalog stock levels and reorder thresholds.
   */
  static async getCatalog(req: Request, res: Response): Promise<void> {
    try {
      const items = await InventoryService.getAllCatalogItems();
      res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (error: any) {
      console.error("[InventoryController] getCatalog error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch catalog items.",
      });
    }
  }

  /**
   * GET /api/inventory/pos
   * Fetches all supplier restock purchase orders.
   */
  static async getPurchaseOrders(req: Request, res: Response): Promise<void> {
    try {
      const pos = await InventoryService.getAllPurchaseOrders();
      res.status(200).json({
        success: true,
        count: pos.length,
        data: pos,
      });
    } catch (error: any) {
      console.error("[InventoryController] getPurchaseOrders error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch purchase orders.",
      });
    }
  }

  /**
   * POST /api/inventory/pos/:poNumber/receive
   * Warehouse action: marks PO as RECEIVED and auto-increments catalog current_stock.
   */
  static async receivePurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { poNumber } = req.params;
      await InventoryService.markPurchaseOrderReceived(poNumber);

      res.status(200).json({
        success: true,
        message: `Purchase Order ${poNumber} received successfully. Inventory stock has been replenished.`,
      });
    } catch (error: any) {
      console.error("[InventoryController] receivePurchaseOrder error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to receive purchase order.",
      });
    }
  }
}
