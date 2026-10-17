import { pool, query } from "../config/db.js";
import { sendStockAlertEmail, LowStockItemAlert } from "./email.service.js";

export interface CatalogItem {
  sku_id: string;
  item_name: string;
  category: string;
  unit: string;
  unit_price: number;
  gst_rate: number;
  current_stock: number;
  reorder_threshold: number;
  preferred_supplier: string;
  supplier_lead_time_days: number;
}

export interface SupplierPurchaseOrder {
  id: number;
  thread_id: string;
  po_number: string;
  supplier_name: string;
  items_payload: any;
  urgency: string;
  status: string;
  created_at: string;
}

export class InventoryService {
  /**
   * Fetches all catalog items with real-time stock levels and reorder thresholds.
   */
  static async getAllCatalogItems(): Promise<CatalogItem[]> {
    const result = await query<CatalogItem>(
      `SELECT sku_id, item_name, category, unit, unit_price, gst_rate, 
              current_stock, reorder_threshold, preferred_supplier, supplier_lead_time_days
       FROM catalog_items 
       ORDER BY category, item_name;`
    );
    return result.rows;
  }

  /**
   * Fetches all supplier purchase orders.
   */
  static async getAllPurchaseOrders(): Promise<SupplierPurchaseOrder[]> {
    const result = await query<SupplierPurchaseOrder>(
      `SELECT id, thread_id, po_number, supplier_name, items_payload, urgency, status, created_at
       FROM supplier_purchase_orders
       ORDER BY created_at DESC;`
    );
    return result.rows;
  }

  /**
   * Marks a warehouse PO as RECEIVED and automatically restocks current_stock in catalog_items.
   * Wrapped in an atomic transaction.
   */
  static async markPurchaseOrderReceived(poNumber: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

      const poRes = await client.query(
        "SELECT id, items_payload, status FROM supplier_purchase_orders WHERE po_number = $1 FOR UPDATE;",
        [poNumber]
      );

      if (poRes.rows.length === 0) {
        throw new Error(`PO ${poNumber} not found.`);
      }

      const po = poRes.rows[0];
      if (po.status === "RECEIVED") {
        await client.query("COMMIT;");
        return true; // Already received
      }

      // Restock catalog items
      const items = Array.isArray(po.items_payload)
        ? po.items_payload
        : (po.items_payload as any)?.po_items || [];

      for (const item of items) {
        const skuId = item.sku_id;
        const qtyToAdd = Number(item.order_qty || 0);

        if (skuId && qtyToAdd > 0) {
          await client.query(
            "UPDATE catalog_items SET current_stock = current_stock + $1 WHERE sku_id = $2;",
            [qtyToAdd, skuId]
          );
        }
      }

      // Mark PO as RECEIVED
      await client.query(
        "UPDATE supplier_purchase_orders SET status = 'RECEIVED' WHERE po_number = $1;",
        [poNumber]
      );

      await client.query("COMMIT;");
      return true;
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Deducts stock when a customer approves a quote.
   * If any item's stock drops to or below the safety reorder threshold,
   * automatically sends an urgent low-stock alert email to the store owner via Brevo.
   */
  static async deductStockForQuote(quoteId: number): Promise<{
    deductedItemsCount: number;
    lowStockAlerts: LowStockItemAlert[];
  }> {
    const client = await pool.connect();
    const lowStockAlerts: LowStockItemAlert[] = [];
    let clientName: string | undefined;
    let threadId: string | undefined;

    try {
      await client.query("BEGIN;");

      // Fetch quote metadata for context
      const quoteRes = await client.query(
        "SELECT client_name, thread_id FROM quotes WHERE id = $1;",
        [quoteId]
      );
      if (quoteRes.rows.length > 0) {
        clientName = quoteRes.rows[0].client_name;
        threadId = quoteRes.rows[0].thread_id;
      }

      const itemsRes = await client.query(
        "SELECT sku_id, quantity FROM quote_line_items WHERE quote_id = $1;",
        [quoteId]
      );

      for (const row of itemsRes.rows) {
        const skuId = row.sku_id;
        const qty = Number(row.quantity || 0);

        if (skuId && qty > 0) {
          const updateRes = await client.query(
            `UPDATE catalog_items 
             SET current_stock = GREATEST(0, current_stock - $1) 
             WHERE sku_id = $2
             RETURNING sku_id, item_name, category, unit, unit_price, 
                       current_stock, reorder_threshold, preferred_supplier, supplier_lead_time_days;`,
            [qty, skuId]
          );

          if (updateRes.rows.length > 0) {
            const updated = updateRes.rows[0];
            const currentStock = Number(updated.current_stock);
            const threshold = Number(updated.reorder_threshold);

            // Trigger low stock warning if current stock is at or below threshold
            if (currentStock <= threshold) {
              lowStockAlerts.push({
                sku_id: updated.sku_id,
                item_name: updated.item_name,
                category: updated.category,
                unit: updated.unit,
                current_stock: currentStock,
                reorder_threshold: threshold,
                preferred_supplier: updated.preferred_supplier,
                supplier_lead_time_days: Number(updated.supplier_lead_time_days || 2),
                deficit_qty: Math.max(0, threshold - currentStock),
                previous_stock: currentStock + qty,
              });
            }
          }
        }
      }

      await client.query("COMMIT;");
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }

    // Trigger asynchronous alert email to owner if any items breached safety thresholds
    if (lowStockAlerts.length > 0) {
      console.log(
        `[InventoryService] Stock depleted below threshold for ${lowStockAlerts.length} item(s). Sending alert email to owner...`
      );
      sendStockAlertEmail({
        items: lowStockAlerts,
        triggerReason: `Stock deduction following approval of Quote #${quoteId}`,
        quoteId,
        threadId,
        clientName,
      }).catch((emailErr) => {
        console.error(
          `[InventoryService] Background email alert failed (non-blocking):`,
          emailErr.message
        );
      });
    }

    return {
      deductedItemsCount: lowStockAlerts.length,
      lowStockAlerts,
    };
  }

  /**
   * Manually adjusts item stock (e.g., from warehouse UI or stock check).
   * Automatically sends an email alert to the owner if stock drops to or below threshold.
   */
  static async adjustStock(
    skuId: string,
    quantityDelta: number,
    mode: "add" | "remove" | "set" = "remove"
  ): Promise<{ item: CatalogItem; triggeredAlert: boolean }> {
    let sql: string;
    let params: any[];

    if (mode === "set") {
      sql = `UPDATE catalog_items 
             SET current_stock = GREATEST(0, $1) 
             WHERE sku_id = $2 
             RETURNING *;`;
      params = [Math.max(0, quantityDelta), skuId];
    } else if (mode === "add") {
      sql = `UPDATE catalog_items 
             SET current_stock = current_stock + $1 
             WHERE sku_id = $2 
             RETURNING *;`;
      params = [Math.max(0, quantityDelta), skuId];
    } else {
      // remove
      sql = `UPDATE catalog_items 
             SET current_stock = GREATEST(0, current_stock - $1) 
             WHERE sku_id = $2 
             RETURNING *;`;
      params = [Math.max(0, quantityDelta), skuId];
    }

    const res = await query<CatalogItem>(sql, params);
    if (res.rows.length === 0) {
      throw new Error(`Catalog item with SKU ${skuId} not found.`);
    }

    const updatedItem = res.rows[0];
    const currentStock = Number(updatedItem.current_stock);
    const threshold = Number(updatedItem.reorder_threshold);
    let triggeredAlert = false;

    if (mode !== "add" && currentStock <= threshold) {
      triggeredAlert = true;
      sendStockAlertEmail({
        items: [
          {
            sku_id: updatedItem.sku_id,
            item_name: updatedItem.item_name,
            category: updatedItem.category,
            unit: updatedItem.unit,
            current_stock: currentStock,
            reorder_threshold: threshold,
            preferred_supplier: updatedItem.preferred_supplier,
            supplier_lead_time_days: Number(updatedItem.supplier_lead_time_days || 2),
            deficit_qty: Math.max(0, threshold - currentStock),
          },
        ],
        triggerReason: `Manual stock adjustment (${mode === "set" ? "set to" : "removed"} ${quantityDelta} ${updatedItem.unit || "unit"})`,
      }).catch((emailErr) => {
        console.error(
          `[InventoryService] Manual adjust email alert failed (non-blocking):`,
          emailErr.message
        );
      });
    }

    return { item: updatedItem, triggeredAlert };
  }

  /**
   * Scans all catalog items, finds any currently below their reorder threshold,
   * and emails the owner with a consolidated alert report.
   */
  static async checkAndAlertLowStock(ownerEmail?: string): Promise<{
    alerted: boolean;
    count: number;
    items: CatalogItem[];
    message: string;
  }> {
    const res = await query<CatalogItem>(
      `SELECT * FROM catalog_items 
       WHERE current_stock <= reorder_threshold 
       ORDER BY current_stock ASC;`
    );

    const lowStockItems = res.rows;
    if (lowStockItems.length === 0) {
      return {
        alerted: false,
        count: 0,
        items: [],
        message: "All catalog items have healthy stock levels above safety threshold.",
      };
    }

    const alertItems: LowStockItemAlert[] = lowStockItems.map((item) => ({
      sku_id: item.sku_id,
      item_name: item.item_name,
      category: item.category,
      unit: item.unit,
      current_stock: Number(item.current_stock),
      reorder_threshold: Number(item.reorder_threshold),
      preferred_supplier: item.preferred_supplier,
      supplier_lead_time_days: Number(item.supplier_lead_time_days || 2),
      deficit_qty: Math.max(0, Number(item.reorder_threshold) - Number(item.current_stock)),
    }));

    await sendStockAlertEmail({
      ownerEmail,
      items: alertItems,
      triggerReason: "On-demand inventory safety scan",
    });

    return {
      alerted: true,
      count: lowStockItems.length,
      items: lowStockItems,
      message: `Low stock alert email successfully sent to owner for ${lowStockItems.length} item(s).`,
    };
  }
}

