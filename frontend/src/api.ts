export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://hacktoberfestsage.onrender.com");

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  try {
    const rawWorker = typeof localStorage !== "undefined" ? localStorage.getItem("quoteflow_active_worker") : null;
    if (rawWorker) {
      const worker = JSON.parse(rawWorker);
      if (worker?.email) {
        headers.set("x-worker-email", worker.email);
      }
    }
  } catch {
    // Ignore storage parse issues
  }
  return fetch(input, { ...init, headers, credentials: "include" });
}

export interface StartQuotePayload {
  client_name?: string;
  client_phone?: string;
  voice_transcript?: string;
  slip_image?: string; // Base64 data URL
  business_name?: string;
  business_category?: string;
  worker_name?: string;
  currency_symbol?: string;
}

export interface BusinessProfile {
  id?: number;
  business_id: string;
  business_name: string;
  industry: string;
  tagline?: string;
  owner_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  currency_symbol: string;
  created_at?: string;
  worker_count?: number | string;
  item_count?: number | string;
}

export interface WorkerProfile {
  id: number;
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  pin_code?: string;
  status: string;
  created_at?: string;
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
  refinementExplanation?: string;
}

export interface DbQuote {
  id: number;
  quote_id?: string | number;
  thread_id: string;
  client_name: string;
  client_phone: string;
  business_name?: string;
  business_category?: string;
  subtotal: string;
  gst_total: string;
  grand_total: string;
  status: "NEW" | "QUOTED" | "WON" | "INVOICED" | "DRAFT" | string;
  ai_revenue_alert: any;
  slip_image_url?: string;
  voice_transcript?: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  sku_id: string;
  item_name: string;
  category: string;
  industry?: string;
  unit: string;
  unit_price: number | string;
  gst_rate: number | string;
  current_stock: number;
  reorder_threshold: number;
  preferred_supplier: string;
  supplier_lead_time_days: number;
}

export interface PurchaseOrder {
  id: number;
  thread_id: string;
  quote_id?: string | number;
  po_number: string;
  supplier_name: string;
  items_payload: any;
  urgency: string;
  status: "ORDERED_FROM_WAREHOUSE" | "RECEIVED" | "DRAFTED" | "PENDING_APPROVAL" | string;
  total_wholesale_cost?: number | string;
  created_at?: string;
}

export interface WorkspaceContext {
  user: { id: string; email: string; name: string };
  worker: WorkerProfile;
  business: BusinessProfile;
}

export const api = {
  // 1. Start Quote Pipeline (Node 1 -> 2 -> 3, Pauses at HITL Gate)
  async startQuote(payload: StartQuotePayload): Promise<QuoteResult> {
    const res = await apiFetch(`${API_BASE}/api/quotes/start`, {
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
    decisions?: {
      accept_quote?: boolean;
      accept_addon?: boolean;
      approve_po?: boolean;
      edited_line_items?: any[];
      edited_po_drafts?: RestockPoDraft[];
      accepted_addon_skus?: string[];
    }
  ): Promise<{ threadId: string; status: string; clientPortalUrl: string; grandTotal: number }> {
    const res = await apiFetch(`${API_BASE}/api/quotes/${threadId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(decisions || { accept_quote: true, approve_po: true }),
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
    const res = await apiFetch(`${API_BASE}/api/quotes/${threadId}/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edited_line_items: editedLineItems }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to update quote");
    return json.data;
  },

  // 2c. Natural Language Refinement Loop (Re-drafts quote via LLM and loops back to Node 2)
  async refineQuote(threadId: string, instruction: string): Promise<QuoteResult> {
    const res = await apiFetch(`${API_BASE}/api/quotes/${threadId}/refine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to refine quote");
    return json.data;
  },

  // 3. Get all quotes (Kanban)
  async getQuotes(businessName?: string): Promise<DbQuote[]> {
    const url = businessName
      ? `${API_BASE}/api/quotes?business_name=${encodeURIComponent(businessName)}`
      : `${API_BASE}/api/quotes`;
    const res = await apiFetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch quotes");
    return json.data;
  },

  // 4. Get single quote with line items
  async getQuote(threadId: string): Promise<any> {
    const res = await apiFetch(`${API_BASE}/api/quotes/${threadId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch quote");
    return json.data;
  },

  // 5. Inventory Catalog (Optionally filtered by industry)
  async getCatalog(industry?: string): Promise<CatalogItem[]> {
    const url = industry && industry.toLowerCase() !== "all"
      ? `${API_BASE}/api/inventory/catalog?industry=${encodeURIComponent(industry)}`
      : `${API_BASE}/api/inventory/catalog`;
    const res = await apiFetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch catalog");
    return json.data;
  },

  // 6. Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const res = await apiFetch(`${API_BASE}/api/inventory/pos`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch POs");
    return json.data;
  },

  // 7. Receive Stock
  async receivePurchaseOrder(poNumber: string): Promise<void> {
    const res = await apiFetch(`${API_BASE}/api/inventory/pos/${poNumber}/receive`, {
      method: "POST",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to receive PO");
  },

  // 7b. Update Catalog Item (Every data can be changed)
  async updateCatalogItem(skuId: string, itemData: Partial<CatalogItem>): Promise<CatalogItem> {
    const res = await apiFetch(`${API_BASE}/api/inventory/catalog/${skuId}`, {
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
    const res = await apiFetch(`${API_BASE}/api/inventory/catalog`, {
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
    const res = await apiFetch(`${API_BASE}/api/inventory/catalog/${skuId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to delete item");
  },

  // 7e. Bulk Import Catalog Items from Excel/CSV
  async bulkImportCatalogItems(items: any[]): Promise<{ count: number; items: CatalogItem[] }> {
    const res = await apiFetch(`${API_BASE}/api/inventory/catalog/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to bulk import items");
    return json.data;
  },

  // 7f. Clear Catalog Items
  async clearCatalogItems(industry?: string): Promise<number> {
    const url = industry
      ? `${API_BASE}/api/inventory/catalog/clear?industry=${encodeURIComponent(industry)}`
      : `${API_BASE}/api/inventory/catalog/clear`;
    const res = await apiFetch(url, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to clear catalog");
    return json.count;
  },

  // 8. Public Customer Portal Preview
  async getPortalQuote(threadId: string): Promise<any> {
    const res = await apiFetch(`${API_BASE}/api/portal/${threadId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch portal quote");
    return json.data;
  },

  // 9. Customer Approval (Auto deducts stock & generates invoice)
  async approvePortalQuote(threadId: string): Promise<any> {
    const res = await apiFetch(`${API_BASE}/api/portal/${threadId}/approve`, {
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

  // 11. Multi-Business Profiles
  async getMyWorkspace(): Promise<WorkspaceContext> {
    const res = await apiFetch(`${API_BASE}/api/business/me`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to load your workspace");
    return json.data;
  },

  async createAuthenticatedBusiness(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const res = await apiFetch(`${API_BASE}/api/business`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to create business profile");
    return json.data;
  },

  // 12. Team & Worker Management
  async getWorkers(businessId: string): Promise<WorkerProfile[]> {
    const res = await apiFetch(`${API_BASE}/api/business/${businessId}/workers`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to fetch workers");
    return json.data;
  },

  async addWorker(businessId: string, data: { name: string; email?: string; phone?: string; role?: string; pin_code?: string }): Promise<WorkerProfile> {
    const res = await apiFetch(`${API_BASE}/api/business/${businessId}/workers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to add worker");
    return json.data;
  },

  // 13. Technician Authentication
  async workerLogin(emailOrPhone: string, pin_code?: string): Promise<{ worker: WorkerProfile; business: BusinessProfile }> {
    const res = await apiFetch(`${API_BASE}/api/business/workers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailOrPhone, phone: emailOrPhone, pin_code }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to log in technician");
    return json.data;
  },

  async technicianSignup(data: { name: string; email: string; phone?: string; role?: string; pin_code?: string; business_id?: string }): Promise<{ worker: WorkerProfile; business: BusinessProfile }> {
    const res = await apiFetch(`${API_BASE}/api/business/workers/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to create technician account");
    return json.data;
  },

};
