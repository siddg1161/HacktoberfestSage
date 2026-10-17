const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface StartQuotePayload {
  client_name?: string;
  client_phone?: string;
  voice_transcript?: string;
  slip_image?: string; // Base64 data URL
}

export interface ExtractedItem {
  sku_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  gst_rate: number;
  gst_amount: number;
  line_total: number;
  stock_tier: "HEALTHY" | "THRESHOLD_WARNING" | "INSTANT_DEFICIT";
  deficit_qty?: number;
  is_ai_suggested?: boolean;
}

export interface AiRevenueAlert {
  has_warning: boolean;
  reason: string;
  suggested_addons: {
    suggested_sku_id: string;
    suggested_item_name: string;
    suggested_qty: number;
    unit_price: number;
    line_total: number;
    reason: string;
  }[];
  total_estimated_added_revenue: number;
}

export interface RestockPoDraft {
  supplier_name: string;
  urgency: "STANDARD_RESTOCK" | "INSTANT_ORDER";
  po_items: {
    sku_id: string;
    item_name: string;
    order_qty: number;
    unit_price: number;
    line_total: number;
  }[];
  order_note: string;
}

export interface QuoteResult {
  threadId: string;
  status: string;
  clientName: string;
  clientPhone: string;
  extractedItems: ExtractedItem[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  aiRevenueAlert: AiRevenueAlert | null;
  restockPoDrafts: RestockPoDraft[];
}

export interface DbQuote {
  id: number;
  thread_id: string;
  client_name: string;
  client_phone: string;
  subtotal: string;
  gst_total: string;
  grand_total: string;
  status: "NEW" | "QUOTED" | "WON" | "INVOICED" | "DRAFT";
  ai_revenue_alert: any;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  sku_id: string;
  item_name: string;
  category: string;
  unit: string;
  unit_price: string;
  gst_rate: string;
  current_stock: number;
  reorder_threshold: number;
  preferred_supplier: string;
  supplier_lead_time_days: number;
}

export interface PurchaseOrder {
  id: number;
  thread_id: string;
  po_number: string;
  supplier_name: string;
  items_payload: any;
  urgency: string;
  status: "ORDERED_FROM_WAREHOUSE" | "RECEIVED" | "DRAFTED";
  created_at: string;
}

export const api = {
  // 1. Start Quote Pipeline (Node 1 -> 2 -> 3, Pauses at HITL Gate)
  async startQuote(payload: StartQuotePayload): Promise<QuoteResult> {
    const res = await fetch(`${API_BASE}/api/quotes/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to start quote");
    return json.data;
  },

  // 2. Vendor HITL Approval (Resumes Node 4 -> Neon DB Commit)
  async approveQuote(
    threadId: string,
    decisions: {
      accept_quote?: boolean;
      accept_addon?: boolean;
      approve_po?: boolean;
      edited_line_items?: any[];
    }
  ): Promise<{ threadId: string; status: string; clientPortalUrl: string; grandTotal: number }> {
    const res = await fetch(`${API_BASE}/api/quotes/${threadId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(decisions),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to approve quote");
    return json.data;
  },

  // 2b. Vendor Human Edit (Updates quantities/rates/items in state and DB)
  async editQuote(
    threadId: string,
    editedLineItems: any[]
  ): Promise<{ threadId: string; subtotal: number; gstTotal: number; grandTotal: number; extractedItems: ExtractedItem[] }> {
    const res = await fetch(`${API_BASE}/api/quotes/${threadId}/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edited_line_items: editedLineItems }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to update quote");
    return json.data;
  },

  // 3. Get all quotes (Kanban)
  async getQuotes(): Promise<DbQuote[]> {
    const res = await fetch(`${API_BASE}/api/quotes`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch quotes");
    return json.data;
  },

  // 4. Get single quote with line items
  async getQuote(threadId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/quotes/${threadId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch quote");
    return json.data;
  },

  // 5. Inventory Catalog
  async getCatalog(): Promise<CatalogItem[]> {
    const res = await fetch(`${API_BASE}/api/inventory/catalog`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch catalog");
    return json.data;
  },

  // 6. Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const res = await fetch(`${API_BASE}/api/inventory/pos`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch POs");
    return json.data;
  },

  // 7. Receive Stock
  async receivePurchaseOrder(poNumber: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/inventory/pos/${poNumber}/receive`, {
      method: "POST",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to receive PO");
  },

  // 7b. Update Catalog Item (Every data can be changed)
  async updateCatalogItem(skuId: string, itemData: Partial<CatalogItem>): Promise<CatalogItem> {
    const res = await fetch(`${API_BASE}/api/inventory/catalog/${skuId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to update item");
    return json.data;
  },

  // 7c. Create New Catalog Item
  async createCatalogItem(itemData: Partial<CatalogItem> & { sku_id: string; item_name: string }): Promise<CatalogItem> {
    const res = await fetch(`${API_BASE}/api/inventory/catalog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to create item");
    return json.data;
  },

  // 7d. Delete Catalog Item
  async deleteCatalogItem(skuId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/inventory/catalog/${skuId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to delete item");
  },

  // 8. Public Customer Portal Preview
  async getPortalQuote(threadId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/portal/${threadId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch portal quote");
    return json.data;
  },

  // 9. Customer Approval (Auto deducts stock & generates invoice)
  async approvePortalQuote(threadId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/portal/${threadId}/approve`, {
      method: "POST",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to approve portal quote");
    return json.data;
  },

  // 10. Printable GST Invoice URL
  getInvoiceUrl(threadId: string): string {
    return `${API_BASE}/api/quotes/${threadId}/invoice`;
  },
};
