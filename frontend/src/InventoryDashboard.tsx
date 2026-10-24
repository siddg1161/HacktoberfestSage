import { useEffect, useMemo, useState } from "react";
import { api, CatalogItem, PurchaseOrder } from "./api";
import { useBusiness } from "./businessContext";
import { AddItemModal } from "./inventory/AddItemModal";
import { EditItemDrawer } from "./inventory/EditItemDrawer";
import { ExcelImportModal } from "./inventory/ExcelImportModal";
import { Icon } from "./inventory/InventoryIcons";
import { PulseOpsOrders } from "./inventory/PulseOpsOrders";
import { StockBadge } from "./inventory/StockBadge";
import { currency, getStatus, InventoryIcon, InventoryItem, StockStatus, TRADES } from "./inventory/types";

export default function InventoryDashboard({ onBack }: { onBack: () => void }) {
  const { activeBusiness } = useBusiness();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState<string>("All Trades");
  const [category, setCategory] = useState("All categories");
  const [stockFilter, setStockFilter] = useState<"All stock" | StockStatus>("All stock");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [receivingPo, setReceivingPo] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(""), 4000);
  };

  // Load live catalog and purchase orders from backend
  const loadData = async (tradeOverride?: string) => {
    try {
      const activeTrade = tradeOverride !== undefined ? tradeOverride : tradeFilter;
      const catRes = await api.getCatalog(activeTrade !== "All Trades" ? activeTrade : undefined);
      const catList: CatalogItem[] = Array.isArray(catRes)
        ? catRes
        : (catRes as any)?.catalog || (catRes as any)?.data || [];
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

      const poRes = await api.getPurchaseOrders();
      const poList: PurchaseOrder[] = Array.isArray(poRes)
        ? poRes
        : (poRes as any)?.purchase_orders || (poRes as any)?.data || [];
      setPurchaseOrders(poList || []);
    } catch (err) {
      console.warn("Failed to load inventory:", err);
    }
  };

  useEffect(() => {
    if (activeBusiness?.industry) {
      setTradeFilter(activeBusiness.industry);
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
      showToast(`Stock received and updated for PO ${poNumber}`);
    } catch (err: any) {
      alert("Error receiving PO: " + (err.message || err));
    } finally {
      setReceivingPo(null);
    }
  };

  const handleClearCatalog = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all catalog items? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await api.clearCatalogItems();
      await loadData();
      showToast("Catalog items cleared successfully.");
    } catch (err: any) {
      alert("Failed to clear catalog: " + (err.message || err));
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

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const lowStock = items.filter((item) => getStatus(item) === "Low stock").length;
  const outOfStock = items.filter((item) => getStatus(item) === "Out of stock").length;

  return (
    <div className="min-h-screen bg-[#f4f5ef] text-[#17221d]">
      {/* Top Header */}
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

        {/* Metrics Overview */}
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

        {/* Low Stock Warning */}
        {(lowStock > 0 || outOfStock > 0) && (
          <section className="mt-6 flex flex-col gap-4 rounded-[22px] border border-[#e4c977] bg-[#fff9e9] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ffe39b] text-[#72530d]">
                <Icon name="warning" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold">Some items need your attention</p>
                <p className="mt-1 text-xs leading-5 text-[#7c6a3d]">
                  {lowStock} low-stock items and {outOfStock} out-of-stock item should be reordered.
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

        {/* Inventory Table Section */}
        <section className="mt-6 overflow-hidden rounded-[26px] border border-[#17221d]/8 bg-white">
          <div className="flex flex-col gap-4 border-b border-[#17221d]/8 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-[-0.025em]">All inventory</h2>
                <p className="mt-1 text-xs text-[#818a85]">
                  {items.length} {items.length === 1 ? "item" : "items"} in catalog · Click any item to edit
                </p>
              </div>

              {/* Two Options requested by user */}
              <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 rounded-full bg-[#17221d] px-4 py-2 text-xs font-extrabold text-[#caff52] shadow-sm transition hover:bg-[#273830]"
                >
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  ✍️ Add Item Yourself
                </button>
                <button
                  type="button"
                  onClick={() => setShowExcelModal(true)}
                  className="flex items-center gap-1.5 rounded-full bg-[#789524] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#657d1f]"
                >
                  <Icon name="file" className="h-3.5 w-3.5" />
                  📊 Populate from Excel
                </button>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCatalog}
                    title="Clear catalog data"
                    className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                  >
                    🗑️ Clear
                  </button>
                )}
              </div>
            </div>

            {/* Filter controls */}
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

          {/* Empty Catalog State: Displays 2 Clear Options */}
          {items.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-[#fafbf8]/70">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#caff52]/30 text-2xl">
                📦
              </div>
              <h3 className="mt-4 text-xl font-extrabold tracking-tight text-[#17221d]">
                Warehouse &amp; Inventory is Clean
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs text-[#6f7974]">
                Dummy items have been removed. Choose how you want to set up your stock catalog:
              </p>

              <div className="mx-auto mt-7 grid max-w-2xl gap-5 sm:grid-cols-2">
                {/* Option 1: Manual */}
                <div className="flex flex-col justify-between rounded-2xl border-2 border-[#17221d]/10 bg-white p-6 text-left shadow-sm transition hover:border-[#789524] hover:shadow-md">
                  <div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f5ef] text-xl">
                      ✍️
                    </span>
                    <h4 className="mt-3 text-sm font-extrabold text-[#17221d]">Option 1: Add Item Yourself</h4>
                    <p className="mt-1 text-xs leading-5 text-[#6f7974]">
                      Add individual catalog items one by one with SKU, selling price, GST slab, and reorder levels.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17221d] py-2.5 text-xs font-extrabold text-[#caff52] shadow hover:bg-[#25362e] transition"
                  >
                    <Icon name="plus" className="h-3.5 w-3.5" />
                    Add Item Yourself
                  </button>
                </div>

                {/* Option 2: Excel */}
                <div className="flex flex-col justify-between rounded-2xl border-2 border-[#789524]/40 bg-[#f7faef] p-6 text-left shadow-sm transition hover:border-[#789524] hover:shadow-md">
                  <div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl border border-[#789524]/20">
                      📊
                    </span>
                    <h4 className="mt-3 text-sm font-extrabold text-[#17221d]">Option 2: Populate from Excel</h4>
                    <p className="mt-1 text-xs leading-5 text-[#6f7974]">
                      Bulk import multiple catalog products at once by uploading an Excel (.xlsx / .xls) or CSV sheet.
                    </p>
                  </div>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setShowExcelModal(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#789524] py-2.5 text-xs font-extrabold text-white shadow hover:bg-[#657d1f] transition"
                    >
                      <Icon name="file" className="h-3.5 w-3.5" />
                      Populate from Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
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
                        onClick={() => setSelectedItem(item)}
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

              {/* Mobile Card List View */}
              <div className="divide-y divide-[#17221d]/7 md:hidden">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
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
                  <p className="mt-1 text-xs text-[#8c9490]">Try adjusting your search or filters.</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* PulseOps Autonomous Restock Purchase Orders */}
        <PulseOpsOrders
          orders={purchaseOrders}
          onReceivePo={handleReceivePo}
          receivingPo={receivingPo}
        />
      </main>

      {/* Edit Item Drawer */}
      <EditItemDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSaved={(updated) => {
          setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
          setSelectedItem(updated);
          showToast(`Item "${updated.name}" updated successfully.`);
        }}
        onDeleted={(skuId) => {
          setItems((prev) => prev.filter((it) => it.id !== skuId));
          setSelectedItem(null);
          showToast(`Item ${skuId} deleted.`);
        }}
      />

      {/* Manual Add Item Modal */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(msg) => {
          showToast(msg);
          loadData();
        }}
        defaultIndustry={activeBusiness?.industry}
      />

      {/* Excel / CSV Import Modal */}
      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onSuccess={(msg) => {
          showToast(msg);
          loadData();
        }}
        defaultIndustry={activeBusiness?.industry}
      />
    </div>
  );
}
