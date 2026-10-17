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

  /**
   * Updates every field of an existing catalog item.
   */
  static async updateCatalogItem(skuId: string, itemData: Partial<CatalogItem>): Promise<CatalogItem> {
    const result = await query<CatalogItem>(
      `UPDATE catalog_items
       SET item_name = COALESCE($1, item_name),
           category = COALESCE($2, category),
           unit = COALESCE($3, unit),
           unit_price = COALESCE($4, unit_price),
           gst_rate = COALESCE($5, gst_rate),
           current_stock = COALESCE($6, current_stock),
           reorder_threshold = COALESCE($7, reorder_threshold),
           preferred_supplier = COALESCE($8, preferred_supplier),
           supplier_lead_time_days = COALESCE($9, supplier_lead_time_days)
       WHERE sku_id = $10
       RETURNING *;`,
      [
        itemData.item_name ?? null,
        itemData.category ?? null,
        itemData.unit ?? null,
        itemData.unit_price !== undefined ? Number(itemData.unit_price) : null,
        itemData.gst_rate !== undefined ? Number(itemData.gst_rate) : null,
        itemData.current_stock !== undefined ? Number(itemData.current_stock) : null,
        itemData.reorder_threshold !== undefined ? Number(itemData.reorder_threshold) : null,
        itemData.preferred_supplier ?? null,
        itemData.supplier_lead_time_days !== undefined ? Number(itemData.supplier_lead_time_days) : null,
        skuId,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error(`Catalog item with SKU "${skuId}" not found.`);
    }
    return result.rows[0];
  }

  /**
   * Creates a brand new catalog item.
   */
  static async createCatalogItem(itemData: CatalogItem): Promise<CatalogItem> {
    const result = await query<CatalogItem>(
      `INSERT INTO catalog_items (
         sku_id, item_name, category, unit, unit_price, gst_rate,
         current_stock, reorder_threshold, preferred_supplier, supplier_lead_time_days
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [
        itemData.sku_id,
        itemData.item_name,
        itemData.category || "General",
        itemData.unit || "piece",
        Number(itemData.unit_price) || 0,
        itemData.gst_rate !== undefined ? Number(itemData.gst_rate) : 18.0,
        Number(itemData.current_stock) || 0,
        Number(itemData.reorder_threshold) || 5,
        itemData.preferred_supplier || "Local Warehouse",
        Number(itemData.supplier_lead_time_days) || 2,
      ]
    );
    return result.rows[0];
  }

  /**
   * Deletes a catalog item by skuId.
   */
  static async deleteCatalogItem(skuId: string): Promise<boolean> {
    const result = await query(`DELETE FROM catalog_items WHERE sku_id = $1;`, [skuId]);
    return (result.rowCount ?? 0) > 0;
  }
}
