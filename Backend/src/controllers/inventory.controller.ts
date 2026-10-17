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

  /**
   * POST /api/inventory/adjust
   * Adjusts stock quantity for a single SKU. Automatically triggers an email alert
   * to the owner if stock drops to or below the safety reorder threshold.
   */
  static async adjustStock(req: Request, res: Response): Promise<void> {
    try {
      const { sku_id, quantity, mode } = req.body;
      if (!sku_id || typeof quantity !== "number") {
        res.status(400).json({
          success: false,
          error: "Missing required fields: sku_id (string) and quantity (number).",
        });
        return;
      }

      const result = await InventoryService.adjustStock(
        sku_id,
        quantity,
        mode || "remove"
      );

      res.status(200).json({
        success: true,
        message: `Stock updated for ${sku_id}. Current stock: ${result.item.current_stock}.`,
        data: result.item,
        alertTriggered: result.triggeredAlert,
      });
    } catch (error: any) {
      console.error("[InventoryController] adjustStock error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to adjust stock.",
      });
    }
  }

  /**
   * POST /api/inventory/alerts/check
   * Runs an inventory scan for items below reorder thresholds and sends
   * an alert email to the store owner.
   */
  static async checkStockAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { ownerEmail } = req.body || {};
      const result = await InventoryService.checkAndAlertLowStock(ownerEmail);

      res.status(200).json({
        success: true,
        alerted: result.alerted,
        count: result.count,
        items: result.items,
        message: result.message,
      });
    } catch (error: any) {
      console.error("[InventoryController] checkStockAlerts error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to run stock alert check.",
      });
    }
  }

  /**
   * POST /api/inventory/alerts/test
   * Sends a test low-stock alert email to verify Brevo configuration.
   */
  static async sendTestStockAlert(req: Request, res: Response): Promise<void> {
    try {
      const { ownerEmail } = req.body || {};
      const items = await InventoryService.getAllCatalogItems();
      const sampleItem = items[0] || {
        sku_id: "SKU-WIRE-25",
        item_name: "Finolex 2.5 sq mm Flame Retardant Wire Coil (90m Red)",
        category: "Wiring",
        unit: "coil",
        current_stock: 2,
        reorder_threshold: 10,
        preferred_supplier: "Havells & Finolex Depot Indore",
        supplier_lead_time_days: 2,
      };

      const { sendStockAlertEmail } = await import("../services/email.service.js");
      const result = await sendStockAlertEmail({
        ownerEmail,
        items: [
          {
            sku_id: sampleItem.sku_id,
            item_name: sampleItem.item_name,
            category: sampleItem.category,
            unit: sampleItem.unit,
            current_stock: Number(sampleItem.current_stock),
            reorder_threshold: Number(sampleItem.reorder_threshold),
            preferred_supplier: sampleItem.preferred_supplier,
            supplier_lead_time_days: Number(sampleItem.supplier_lead_time_days || 2),
            deficit_qty: Math.max(
              1,
              Number(sampleItem.reorder_threshold) - Number(sampleItem.current_stock)
            ),
          },
        ],
        triggerReason: "Test Email from Inventory Management System",
      });

      res.status(200).json({
        success: true,
        message: "Test stock alert email dispatched via Brevo.",
        data: result,
      });
    } catch (error: any) {
      console.error("[InventoryController] sendTestStockAlert error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to send test alert email.",
      });
    }
  }
}
