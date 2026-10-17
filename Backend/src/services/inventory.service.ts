import { pool, query } from "../config/db.js";

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
   */
  static async deductStockForQuote(quoteId: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

      const itemsRes = await client.query(
        "SELECT sku_id, quantity FROM quote_line_items WHERE quote_id = $1;",
        [quoteId]
      );

      for (const row of itemsRes.rows) {
        const skuId = row.sku_id;
        const qty = Number(row.quantity || 0);

        if (skuId && qty > 0) {
          await client.query(
            "UPDATE catalog_items SET current_stock = GREATEST(0, current_stock - $1) WHERE sku_id = $2;",
            [qty, skuId]
          );
        }
      }

      await client.query("COMMIT;");
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  }
}
