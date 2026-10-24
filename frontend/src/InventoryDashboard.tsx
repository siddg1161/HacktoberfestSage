import { useEffect, useMemo, useState } from "react";
import { api, CatalogItem, PurchaseOrder } from "./api";
import { useBusiness } from "./businessContext";

type StockStatus = "In stock" | "Low stock" | "Out of stock";

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  industry?: string;
  unit: string;
  quantity: number;
  reorderAt: number;
  unitCost: number;
  gstRate?: number;
  supplier: string;
  leadTimeDays?: number;
  location: string;
  lastUpdated: string;
};

type InventoryIcon =
  | "arrow"
  | "box"
  | "check"
  | "chevron"
  | "file"
  | "minus"
  | "plus"
  | "search"
  | "warning"
  | "x";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: InventoryIcon;
  className?: string;
}) {
  const paths: Record<InventoryIcon, React.ReactNode> = {
    arrow: <path d="M19 12H5m6 6-6-6 6-6" />,
    box: (
      <>
        <path d="m21 8-9 5-9-5 9-5 9 5Z" />
        <path d="m3 8 9 5 9-5v8l-9 5-9-5Z" />
        <path d="M12 13v8" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    warning: (
      <>
        <path d="M10.3 3.7 2.4 17.3A1.8 1.8 0 0 0 4 20h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.7a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getStatus = (item: InventoryItem): StockStatus => {
  if (item.quantity === 0) return "Out of stock";
  if (item.quantity <= item.reorderAt) return "Low stock";
  return "In stock";
};

const statusStyle: Record<StockStatus, string> = {
  "In stock": "bg-[#e8f7d3] text-[#4d6817]",
  "Low stock": "bg-[#fff2cf] text-[#84600b]",
  "Out of stock": "bg-[#ffe2de] text-[#9b3d34]",
};

function StockBadge({ item }: { item: InventoryItem }) {
  const status = getStatus(item);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

const TRADES = ["All Trades", "Electrical", "Plumbing", "HVAC", "Automotive", "General"];

export default function InventoryDashboard({ onBack }: { onBack: () => void }) {
  const { activeBusiness } = useBusiness();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState<string>("All Trades");
  const [category, setCategory] = useState("All categories");
  const [stockFilter, setStockFilter] = useState<"All stock" | StockStatus>("All stock");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustment, setAdjustment] = useState(1);
  const [adjustMode, setAdjustMode] = useState<"add" | "remove">("add");
  const [saved, setSaved] = useState(false);
  const [receivingPo, setReceivingPo] = useState<string | null>(null);

  // Business Owner Full Editing States
  const [editForm, setEditForm] = useState<InventoryItem | null>(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    sku_id: "",
    item_name: "",
    category: "Electrical",
    industry: "Electrical",
    unit: "piece",
    unit_price: 150,
    gst_rate: 18,
    current_stock: 20,
    reorder_threshold: 5,
    preferred_supplier: "Local Distributor",
    supplier_lead_time_days: 2,
  });
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");

  // Load live catalog and purchase orders from backend
  const loadData = async (tradeOverride?: string) => {
    try {
      const activeTrade = tradeOverride !== undefined ? tradeOverride : tradeFilter;
      const catRes = await api.getCatalog(activeTrade !== "All Trades" ? activeTrade : undefined);
      const catList: CatalogItem[] = Array.isArray(catRes)
        ? catRes
        : (catRes as any)?.catalog || (catRes as any)?.data || [];
      if (catList.length > 0) {
        const liveItems: InventoryItem[] = catList.map((c: CatalogItem) => ({
          id: c.sku_id,
          name: c.item_name,
          category: c.category || "General",
          industry: c.industry || "General",
          unit: c.unit || "piece",
          quantity: Number(c.current_stock) || 0,
          reorderAt: Number(c.reorder_threshold) || 5,
          unitCost: Number(c.unit_price) || 0,
          gstRate: Number(c.gst_rate) || 18,
          supplier: c.preferred_supplier || "Local Warehouse",
          leadTimeDays: Number(c.supplier_lead_time_days) || 2,
          location: "Warehouse Bay 1",
          lastUpdated: "Synced with Neon DB",
        }));
        setItems(liveItems);
      }

      const poRes = await api.getPurchaseOrders();
      const poList: PurchaseOrder[] = Array.isArray(poRes)
        ? poRes
        : (poRes as any)?.purchase_orders || (poRes as any)?.data || [];
      if (poList) {
        setPurchaseOrders(poList);
      }
    } catch (err) {
      console.warn("Using demo inventory fallback:", err);
    }
  };

  useEffect(() => {
    if (activeBusiness?.industry) {
      setTradeFilter(activeBusiness.industry);
      setNewItemForm((prev) => ({ ...prev, industry: activeBusiness.industry }));
      loadData(activeBusiness.industry);
    } else {
      loadData("All Trades");
    }
  }, [activeBusiness?.industry]);

  const handleReceivePo = async (poNumber: string) => {
    try {
      setReceivingPo(poNumber);
      await api.receivePurchaseOrder(poNumber);
      await loadData();
    } catch (err: any) {
      alert("Error receiving PO: " + (err.message || err));
    } finally {
      setReceivingPo(null);
    }
  };

  const categories = ["All categories", ...new Set(items.map((item) => item.category))];

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (category === "All categories" || item.category === category) &&
        (stockFilter === "All stock" || getStatus(item) === stockFilter) &&
        (!query ||
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.supplier.toLowerCase().includes(query)),
    );
  }, [category, items, search, stockFilter]);

  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );
  const lowStock = items.filter((item) => getStatus(item) === "Low stock").length;
  const outOfStock = items.filter((item) => getStatus(item) === "Out of stock").length;

  const updateStock = () => {
    if (!selectedItem || adjustment < 1) return;
    const nextQuantity =
      adjustMode === "add"
        ? selectedItem.quantity + adjustment
        : Math.max(0, selectedItem.quantity - adjustment);
    setItems((current) =>
      current.map((item) =>
        item.id === selectedItem.id
          ? { ...item, quantity: nextQuantity, lastUpdated: "Just now" }
          : item,
      ),
    );
    setSelectedItem({ ...selectedItem, quantity: nextQuantity, lastUpdated: "Just now" });
    if (editForm) setEditForm({ ...editForm, quantity: nextQuantity });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditForm({ ...item, gstRate: item.gstRate ?? 18, leadTimeDays: item.leadTimeDays ?? 2 });
    setAdjustment(1);
    setSaved(false);
  };

  const handleSaveItemChanges = async () => {
    if (!editForm) return;
    setIsUpdatingItem(true);
    setActionFeedback("");
    try {
      await api.updateCatalogItem(editForm.id, {
        item_name: editForm.name,
        category: editForm.category,
        unit: editForm.unit,
        unit_price: Number(editForm.unitCost),
        gst_rate: Number(editForm.gstRate ?? 18),
        current_stock: Number(editForm.quantity),
        reorder_threshold: Number(editForm.reorderAt),
        preferred_supplier: editForm.supplier,
        supplier_lead_time_days: Number(editForm.leadTimeDays ?? 2),
      });

      setItems((prev) =>
        prev.map((it) => (it.id === editForm.id ? { ...editForm, lastUpdated: "Just updated" } : it))
      );
      setSelectedItem({ ...editForm, lastUpdated: "Just updated" });
      setActionFeedback("Item successfully updated in database!");
      setTimeout(() => setActionFeedback(""), 3500);
    } catch (err: any) {
      alert("Failed to update item: " + err.message);
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleDeleteItem = async (skuId: string) => {
    if (!window.confirm(`Are you sure you want to delete catalog item "${skuId}"?`)) return;
    try {
      await api.deleteCatalogItem(skuId);
      setItems((prev) => prev.filter((it) => it.id !== skuId));
      setSelectedItem(null);
      setEditForm(null);
      setActionFeedback(`Item ${skuId} deleted.`);
      setTimeout(() => setActionFeedback(""), 3500);
    } catch (err: any) {
      alert("Failed to delete item: " + err.message);
    }
  };

  const handleCreateNewItem = async () => {
    if (!newItemForm.sku_id.trim() || !newItemForm.item_name.trim()) {
      alert("Please provide both SKU ID and Item Name.");
      return;
    }
    setIsCreatingItem(true);
    try {
      await api.createCatalogItem({
        sku_id: newItemForm.sku_id.trim(),
        item_name: newItemForm.item_name.trim(),
        category: newItemForm.category,
        industry: newItemForm.industry,
        unit: newItemForm.unit,
        unit_price: Number(newItemForm.unit_price) || 0,
        gst_rate: Number(newItemForm.gst_rate) || 18,
        current_stock: Number(newItemForm.current_stock) || 0,
        reorder_threshold: Number(newItemForm.reorder_threshold) || 5,
        preferred_supplier: newItemForm.preferred_supplier,
        supplier_lead_time_days: Number(newItemForm.supplier_lead_time_days) || 2,
      });

      await loadData();
      setShowAddModal(false);
      setNewItemForm({
        sku_id: "",
        item_name: "",
        category: "Electrical",
        industry: activeBusiness?.industry || "Electrical",
        unit: "piece",
        unit_price: 150,
        gst_rate: 18,
        current_stock: 20,
        reorder_threshold: 5,
        preferred_supplier: "Local Distributor",
        supplier_lead_time_days: 2,
      });
      setActionFeedback("New catalog item created!");
      setTimeout(() => setActionFeedback(""), 3500);
    } catch (err: any) {
      alert("Failed to create item: " + err.message);
    } finally {
      setIsCreatingItem(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5ef] text-[#17221d]">
      <header className="border-b border-[#17221d]/8 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onBack}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#17221d]/10 text-[#66716b]"
              aria-label="Back to jobs dashboard"
            >
              <Icon name="arrow" className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#17221d] text-[#caff52]">
                <Icon name="file" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[18px] font-extrabold leading-none tracking-[-0.04em]">
                  parchi<span className="text-[#5f7a13]">pay</span>
                </p>
                <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8b938f]">
                  Inventory
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold">{activeBusiness?.business_name || "QuoteFlow AI"}</p>
              <p className="text-[10px] font-semibold text-[#87908b]">
                {activeBusiness?.industry ? `${activeBusiness.industry} · ` : ""}Business Owner
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d6ff78] text-sm font-extrabold">
              {(activeBusiness?.business_name || "QF").slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 sm:py-10">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6a841d]">
            Stock control
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">
            Inventory
          </h1>
          <p className="mt-2 text-sm text-[#6f7974]">
            Know what&apos;s available before assigning the next job.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Stock items",
              value: String(items.length),
              detail: `${items.reduce((sum, item) => sum + item.quantity, 0)} units available`,
              icon: "box" as InventoryIcon,
              color: "bg-[#d6ff78]",
            },
            {
              label: "Inventory value",
              value: currency(totalValue),
              detail: "At current unit cost",
              icon: "file" as InventoryIcon,
              color: "bg-[#e5e8ff]",
            },
            {
              label: "Low stock",
              value: String(lowStock),
              detail: "Needs reordering soon",
              icon: "warning" as InventoryIcon,
              color: "bg-[#fff0c7]",
            },
            {
              label: "Out of stock",
              value: String(outOfStock),
              detail: outOfStock ? "Action required" : "Everything available",
              icon: "x" as InventoryIcon,
              color: "bg-[#ffe2de]",
            },
          ].map((metric) => (
            <article
              key={metric.label}
              className="rounded-[22px] border border-[#17221d]/8 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[#7b8580]">{metric.label}</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-[#9aa19d]">
                    {metric.detail}
                  </p>
                </div>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${metric.color}`}>
                  <Icon name={metric.icon} className="h-5 w-5" />
                </span>
              </div>
            </article>
          ))}
        </section>

        {(lowStock > 0 || outOfStock > 0) && (
          <section className="mt-6 flex flex-col gap-4 rounded-[22px] border border-[#e4c977] bg-[#fff9e9] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ffe39b] text-[#72530d]">
                <Icon name="warning" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold">Some items need your attention</p>
                <p className="mt-1 text-xs leading-5 text-[#7c6a3d]">
                  {lowStock} low-stock items and {outOfStock} out-of-stock item should be
                  reordered.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStockFilter("Low stock")}
              className="whitespace-nowrap rounded-full bg-[#17221d] px-4 py-2.5 text-xs font-extrabold text-white"
            >
              Review low stock
            </button>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-[26px] border border-[#17221d]/8 bg-white">
          <div className="flex flex-col gap-4 border-b border-[#17221d]/8 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-extrabold tracking-[-0.025em]">All inventory</h2>
                <p className="mt-1 text-xs text-[#818a85]">
                  {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} shown · Click any item to edit all data
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-full bg-[#17221d] px-4 py-2 text-xs font-extrabold text-[#caff52] shadow-sm transition hover:bg-[#273830]"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                + Add Item
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="relative">
                <span className="sr-only">Search inventory</span>
                <Icon
                  name="search"
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f9793]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search items…"
                  className="h-11 w-full rounded-xl border border-[#17221d]/10 bg-[#fafbf8] pl-10 pr-4 text-xs font-semibold outline-none focus:border-[#789524] sm:w-48"
                />
              </label>
              <select
                value={tradeFilter}
                onChange={(event) => {
                  const val = event.target.value;
                  setTradeFilter(val);
                  loadData(val);
                }}
                className="h-11 rounded-xl border border-[#17221d]/10 bg-[#fafbf8] px-4 text-xs font-bold outline-none focus:border-[#789524]"
                aria-label="Filter by trade / industry"
              >
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    Trade: {t}
                  </option>
                ))}
              </select>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 rounded-xl border border-[#17221d]/10 bg-[#fafbf8] px-4 text-xs font-bold outline-none focus:border-[#789524]"
                aria-label="Filter by category"
              >
                {categories.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                value={stockFilter}
                onChange={(event) =>
                  setStockFilter(event.target.value as "All stock" | StockStatus)
                }
                className="h-11 rounded-xl border border-[#17221d]/10 bg-[#fafbf8] px-4 text-xs font-bold outline-none focus:border-[#789524]"
                aria-label="Filter by stock level"
              >
                <option>All stock</option>
                <option>In stock</option>
                <option>Low stock</option>
                <option>Out of stock</option>
              </select>
            </div>
          </div>

          {actionFeedback && (
            <div className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
              ✓ {actionFeedback}
            </div>
          )}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#fafbf8] text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8a928e]">
                  <th className="px-5 py-3.5">Item</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Available</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Stock value</th>
                  <th className="w-12 px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="cursor-pointer border-t border-[#17221d]/7 transition hover:bg-[#f8faf4]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef1e9]">
                          <Icon name="box" className="h-5 w-5 text-[#69746e]" />
                        </span>
                        <div>
                          <p className="text-sm font-extrabold">{item.name}</p>
                          <p className="mt-1 text-[10px] text-[#8a928e]">
                            {item.id} · {item.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-[#59645f]">
                      <div className="flex flex-col gap-0.5">
                        <span>{item.category}</span>
                        {item.industry && (
                          <span className="inline-flex w-fit items-center rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-black text-sky-800">
                            {item.industry}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold">{item.quantity}</p>
                      <p className="text-[10px] text-[#8a928e]">{item.unit}s</p>
                    </td>
                    <td className="px-5 py-4">
                      <StockBadge item={item} />
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-extrabold">
                      {currency(item.quantity * item.unitCost)}
                    </td>
                    <td className="px-5 py-4">
                      <Icon name="chevron" className="h-4 w-4 text-[#9ba29e]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#17221d]/7 md:hidden">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectItem(item)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef1e9]">
                      <Icon name="box" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">{item.name}</p>
                      <p className="mt-1 text-[10px] text-[#89918d]">
                        {item.category} {item.industry ? `· ${item.industry}` : ""}
                      </p>
                    </div>
                  </div>
                  <StockBadge item={item} />
                </div>
                <div className="mt-4 flex justify-between text-xs">
                  <span className="text-[#7e8782]">{item.location}</span>
                  <strong>
                    {item.quantity} {item.unit}s
                  </strong>
                </div>
              </button>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="px-5 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eef0ea]">
                <Icon name="search" className="h-5 w-5 text-[#828b86]" />
              </span>
              <p className="mt-4 text-sm font-extrabold">No inventory found</p>
              <p className="mt-1 text-xs text-[#8c9490]">Try adjusting your filters.</p>
            </div>
          )}
        </section>

        {/* PulseOps Autonomous Restock Purchase Orders */}
        <section className="mt-8 overflow-hidden rounded-[26px] border border-[#17221d]/8 bg-white">
          <div className="flex flex-col gap-2 border-b border-[#17221d]/8 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#caff52] text-[#17221d]">
                  <Icon name="box" className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-extrabold tracking-[-0.025em]">
                  Autonomous Supplier Restock POs (PulseOps)
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#818a85]">
                Triggered automatically by LangGraph when warehouse stock drops into Tier 2 or Tier 3.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#17221d] px-3 py-1 text-[11px] font-extrabold text-[#caff52]">
              {purchaseOrders.length} {purchaseOrders.length === 1 ? "PO Active" : "POs Active"}
            </span>
          </div>

          {purchaseOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eef0ea]">
                <Icon name="check" className="h-5 w-5 text-[#828b86]" />
              </span>
              <p className="mt-4 text-sm font-extrabold">All Restock Orders Up To Date</p>
              <p className="mt-1 text-xs text-[#8c9490]">
                When an AI quote triggers Tier 2 threshold or Tier 3 deficit, the PO will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#17221d]/7">
              {purchaseOrders.map((po) => {
                const isReceived = po.status === "RECEIVED";
                const isInstant = po.urgency === "INSTANT_ORDER";
                return (
                  <div
                    key={po.po_number}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-[#17221d]">
                          {po.po_number}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                            isInstant
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {po.urgency}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold ${
                            isReceived
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm font-extrabold text-[#17221d]">
                        Supplier: {po.supplier_name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#6e7773]">
                        <span>For Quote #{po.quote_id}</span>
                        <span>·</span>
                        <span className="font-semibold">
                          Items:{" "}
                          {Array.isArray(po.items_payload)
                            ? po.items_payload
                                .map(
                                  (it: any) =>
                                    `${it.item_name || it.name || "Item"} (×${
                                      it.requested_qty || it.qty || 1
                                    })`,
                                )
                                .join(", ")
                            : "Restock items"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#838d88]">Wholesale Cost</p>
                        <p className="text-base font-extrabold text-[#17221d]">
                          {currency(Number(po.total_wholesale_cost) || 0)}
                        </p>
                      </div>

                      {!isReceived ? (
                        <button
                          type="button"
                          disabled={receivingPo === po.po_number}
                          onClick={() => handleReceivePo(po.po_number)}
                          className="flex items-center gap-1.5 rounded-full bg-[#17221d] px-4 py-2.5 text-xs font-extrabold text-[#caff52] shadow transition hover:bg-[#25362e] disabled:opacity-50"
                        >
                          <Icon name="check" className="h-3.5 w-3.5" />
                          {receivingPo === po.po_number
                            ? "Updating Stock…"
                            : "Mark Stock Received"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <Icon name="check" className="h-4 w-4" /> Received & Stocked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {selectedItem && editForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#17221d]/35 backdrop-blur-[2px]">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedItem(null)}
            aria-label="Close inventory details"
          />
          <aside className="relative h-full w-full max-w-[500px] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#17221d]/8 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#87908b]">
                  Edit Catalog Item
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-base font-black text-[#17221d]">{editForm.id}</span>
                  <StockBadge item={editForm} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#17221d]/10 hover:bg-[#f4f5ef]"
                aria-label="Close details"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                  Item Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm font-bold text-[#17221d] outline-none focus:border-[#789524] focus:ring-2 focus:ring-[#caff52]/30"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="AC service">AC service</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Security">Security</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Hardware">Hardware</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    placeholder="e.g. piece, coil"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
                  />
                </div>
              </div>

              {/* Unit Price & GST Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.unitCost}
                    onChange={(e) => setEditForm({ ...editForm, unitCost: parseFloat(e.target.value) || 0 })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm font-black text-[#17221d] outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                    GST Rate (%)
                  </label>
                  <select
                    value={editForm.gstRate ?? 18}
                    onChange={(e) => setEditForm({ ...editForm, gstRate: parseFloat(e.target.value) || 0 })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
                  >
                    <option value="0">0% (Nil)</option>
                    <option value="5">5% (Essential)</option>
                    <option value="12">12% (Standard)</option>
                    <option value="18">18% (Standard Services)</option>
                    <option value="28">28% (Luxury / Heavy)</option>
                  </select>
                </div>
              </div>

              {/* Stock Levels & Reorder Threshold */}
              <div className="rounded-2xl border border-[#17221d]/10 bg-[#f7f8f4] p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#49544f]">
                  Warehouse Stock & Safety Threshold
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#727c77]">Current Stock</label>
                    <div className="mt-1 flex items-center gap-1 rounded-xl border border-[#17221d]/12 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, quantity: Math.max(0, editForm.quantity - 1) })}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f2eb] text-sm font-bold hover:bg-[#e4e7de]"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                        className="w-full text-center text-sm font-black text-[#17221d] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, quantity: editForm.quantity + 1 })}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f2eb] text-sm font-bold hover:bg-[#e4e7de]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#727c77]">Reorder Threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.reorderAt}
                      onChange={(e) => setEditForm({ ...editForm, reorderAt: parseInt(e.target.value) || 0 })}
                      className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/12 bg-white px-3 text-center text-sm font-bold text-[#17221d] outline-none"
                    />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[#78827d]">
                  When stock falls below {editForm.reorderAt} {editForm.unit}s, QuoteFlow triggers autonomous restock POs.
                </p>
              </div>

              {/* Supplier & Lead Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                    Preferred Supplier
                  </label>
                  <input
                    type="text"
                    value={editForm.supplier}
                    onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.leadTimeDays ?? 2}
                    onChange={(e) => setEditForm({ ...editForm, leadTimeDays: parseInt(e.target.value) || 2 })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
                  />
                </div>
              </div>

              {/* Storage Location */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                  Storage Location / Bay
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="e.g. Rack A-01, Bin B-04"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={handleSaveItemChanges}
                  disabled={isUpdatingItem}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#17221d] py-3.5 text-xs font-black text-[#caff52] shadow-lg transition hover:bg-[#273a30] disabled:opacity-50"
                >
                  <Icon name="check" className="h-4 w-4" />
                  {isUpdatingItem ? "Saving to Database..." : "Save Changes to Neon DB"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  className="w-full rounded-full border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                >
                  Delete Item from Catalog
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Add New Catalog Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17221d]/50 p-4 backdrop-blur-[3px]">
          <div className="relative w-full max-w-lg rounded-[28px] border border-[#17221d]/10 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-[#17221d]/8 pb-4">
              <div>
                <h3 className="text-xl font-extrabold tracking-[-0.03em]">Add New Catalog Item</h3>
                <p className="text-xs text-[#7d8782]">Creates SKU in Neon DB & empowers AI quote matching</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-[#17221d]/10 hover:bg-[#f4f5ef]"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">SKU ID *</label>
                  <input
                    type="text"
                    value={newItemForm.sku_id}
                    onChange={(e) => setNewItemForm({ ...newItemForm, sku_id: e.target.value })}
                    placeholder="e.g. SKU-PIPE-PVC"
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-mono outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">Industry / Trade</label>
                  <select
                    value={newItemForm.industry}
                    onChange={(e) => setNewItemForm({ ...newItemForm, industry: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Automotive">Automotive</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">Item Name *</label>
                  <input
                    type="text"
                    value={newItemForm.item_name}
                    onChange={(e) => setNewItemForm({ ...newItemForm, item_name: e.target.value })}
                    placeholder="e.g. 10A Modular Switch White"
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 text-sm outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">Category</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="AC service">AC service</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Security">Security</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">Unit</label>
                  <input
                    type="text"
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    placeholder="piece"
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">Selling Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemForm.unit_price}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-bold outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">GST %</label>
                  <input
                    type="number"
                    value={newItemForm.gst_rate}
                    onChange={(e) => setNewItemForm({ ...newItemForm, gst_rate: parseFloat(e.target.value) || 0 })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-bold outline-none focus:border-[#789524]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemForm.current_stock}
                    onChange={(e) => setNewItemForm({ ...newItemForm, current_stock: parseInt(e.target.value) || 0 })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-bold outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">Reorder Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemForm.reorder_threshold}
                    onChange={(e) => setNewItemForm({ ...newItemForm, reorder_threshold: parseInt(e.target.value) || 5 })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-bold outline-none focus:border-[#789524]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">Preferred Supplier</label>
                  <input
                    type="text"
                    value={newItemForm.preferred_supplier}
                    onChange={(e) => setNewItemForm({ ...newItemForm, preferred_supplier: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#69736e] uppercase">Lead Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemForm.supplier_lead_time_days}
                    onChange={(e) => setNewItemForm({ ...newItemForm, supplier_lead_time_days: parseInt(e.target.value) || 2 })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full border border-[#17221d]/15 px-5 py-2.5 text-xs font-bold text-[#17221d] hover:bg-[#f4f5ef]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewItem}
                  disabled={isCreatingItem}
                  className="rounded-full bg-[#17221d] px-6 py-2.5 text-xs font-black text-[#caff52] shadow hover:bg-[#25362e] disabled:opacity-50"
                >
                  {isCreatingItem ? "Creating..." : "Create Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
