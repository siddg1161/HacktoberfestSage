import { useEffect, useMemo, useState } from "react";
import { api, CatalogItem, PurchaseOrder } from "./api";

type StockStatus = "In stock" | "Low stock" | "Out of stock";

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderAt: number;
  unitCost: number;
  supplier: string;
  location: string;
  lastUpdated: string;
};

const initialItems: InventoryItem[] = [
  {
    id: "INV-001",
    name: "2.5 sq mm copper wire",
    category: "Electrical",
    unit: "coil",
    quantity: 18,
    reorderAt: 8,
    unitCost: 2450,
    supplier: "Jain Electricals",
    location: "Rack A-01",
    lastUpdated: "Today, 10:42 AM",
  },
  {
    id: "INV-002",
    name: "16A modular switch",
    category: "Electrical",
    unit: "piece",
    quantity: 7,
    reorderAt: 10,
    unitCost: 180,
    supplier: "Anchor Distributors",
    location: "Bin B-04",
    lastUpdated: "Today, 9:16 AM",
  },
  {
    id: "INV-003",
    name: "8-way MCB box",
    category: "Electrical",
    unit: "piece",
    quantity: 12,
    reorderAt: 4,
    unitCost: 1250,
    supplier: "Jain Electricals",
    location: "Rack A-03",
    lastUpdated: "Yesterday, 5:30 PM",
  },
  {
    id: "INV-004",
    name: "R32 refrigerant gas",
    category: "AC service",
    unit: "cylinder",
    quantity: 2,
    reorderAt: 3,
    unitCost: 6800,
    supplier: "CoolTech Supplies",
    location: "Store C-01",
    lastUpdated: "Yesterday, 2:18 PM",
  },
  {
    id: "INV-005",
    name: "LED profile light 12W",
    category: "Lighting",
    unit: "metre",
    quantity: 64,
    reorderAt: 20,
    unitCost: 390,
    supplier: "BrightLite India",
    location: "Rack D-02",
    lastUpdated: "16 Oct, 4:12 PM",
  },
  {
    id: "INV-006",
    name: "2MP dome camera",
    category: "Security",
    unit: "piece",
    quantity: 0,
    reorderAt: 4,
    unitCost: 2900,
    supplier: "Secure Vision",
    location: "Cabinet E-01",
    lastUpdated: "16 Oct, 11:06 AM",
  },
  {
    id: "INV-007",
    name: "PVC drain pipe 20mm",
    category: "AC service",
    unit: "metre",
    quantity: 42,
    reorderAt: 15,
    unitCost: 65,
    supplier: "CoolTech Supplies",
    location: "Rack C-04",
    lastUpdated: "15 Oct, 3:45 PM",
  },
  {
    id: "INV-008",
    name: "24V LED driver",
    category: "Lighting",
    unit: "piece",
    quantity: 9,
    reorderAt: 6,
    unitCost: 1200,
    supplier: "BrightLite India",
    location: "Bin D-06",
    lastUpdated: "15 Oct, 10:22 AM",
  },
];

type InventoryIcon =
  | "arrow"
  | "box"
  | "check"
  | "chevron"
  | "file"
  | "store"
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
    store: (
      <>
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
        <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 10V7" />
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

export default function InventoryDashboard({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [stockFilter, setStockFilter] = useState<"All stock" | StockStatus>("All stock");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustment, setAdjustment] = useState(1);
  const [adjustMode, setAdjustMode] = useState<"add" | "remove">("add");
  const [saved, setSaved] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [receivingPo, setReceivingPo] = useState<string | null>(null);
  const [emailAlertStatus, setEmailAlertStatus] = useState<string | null>(null);

  // Load live catalog and purchase orders from backend
  const loadData = async () => {
    try {
      const catRes = await api.getCatalog();
      const catList: CatalogItem[] = Array.isArray(catRes)
        ? catRes
        : (catRes as any)?.catalog || (catRes as any)?.data || [];
      if (catList.length > 0) {
        const liveItems: InventoryItem[] = catList.map((c: CatalogItem) => ({
          id: c.sku_id,
          name: c.item_name,
          category: c.category,
          unit: c.unit,
          quantity: Number(c.current_stock) || 0,
          reorderAt: Number(c.reorder_threshold) || 5,
          unitCost: Number(c.unit_price) || 0,
          supplier: c.preferred_supplier || "Local Warehouse",
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
    loadData();
  }, []);

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

  const handleSendStockAlert = async () => {
    try {
      setEmailAlertStatus("sending");
      const res = await api.checkStockAlerts();
      setEmailAlertStatus("sent");
      setTimeout(() => setEmailAlertStatus(null), 3500);
      alert(res.message || "Low-stock alert email sent to store owner!");
    } catch (err: any) {
      alert("Error sending alert email: " + (err.message || err));
      setEmailAlertStatus(null);
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

  const updateStock = async () => {
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
    setSaved(true);

    try {
      const res = await api.adjustStock(
        selectedItem.id,
        adjustment,
        adjustMode === "add" ? "add" : "remove"
      );
      if (res.alertTriggered) {
        setSavedNote("⚠️ Alert emailed to owner!");
      } else {
        setSavedNote(null);
      }
      await loadData();
    } catch (e) {
      console.warn("Stock update API note:", e);
    }

    window.setTimeout(() => {
      setSaved(false);
      setSavedNote(null);
    }, 2800);
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
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#17221d] text-[#caff52] shadow-sm">
                <Icon name="store" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[18px] font-extrabold leading-none tracking-[-0.04em]">
                  dukaan<span className="text-[#5f7a13]">pay</span>
                </p>
                <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8b938f]">
                  Inventory
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold">Rajesh Mehta</p>
              <p className="text-[10px] font-semibold text-[#87908b]">Business owner</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d6ff78] text-sm font-extrabold">
              RM
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={emailAlertStatus === "sending"}
                onClick={handleSendStockAlert}
                className="whitespace-nowrap rounded-full border border-[#17221d] px-4 py-2.5 text-xs font-extrabold text-[#17221d] transition hover:bg-[#17221d] hover:text-white disabled:opacity-50"
              >
                {emailAlertStatus === "sending"
                  ? "Sending Email…"
                  : emailAlertStatus === "sent"
                  ? "✓ Email Alert Sent!"
                  : "📧 Send Alert to Owner"}
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("Low stock")}
                className="whitespace-nowrap rounded-full bg-[#17221d] px-4 py-2.5 text-xs font-extrabold text-white"
              >
                Review low stock
              </button>
            </div>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-[26px] border border-[#17221d]/8 bg-white">
          <div className="flex flex-col gap-4 border-b border-[#17221d]/8 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-[-0.025em]">All inventory</h2>
              <p className="mt-1 text-xs text-[#818a85]">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} shown
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
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
                  className="h-11 w-full rounded-xl border border-[#17221d]/10 bg-[#fafbf8] pl-10 pr-4 text-xs font-semibold outline-none focus:border-[#789524] sm:w-56"
                />
              </label>
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
                    onClick={() => {
                      setSelectedItem(item);
                      setAdjustment(1);
                    }}
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
                      {item.category}
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
                onClick={() => {
                  setSelectedItem(item);
                  setAdjustment(1);
                }}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef1e9]">
                      <Icon name="box" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">{item.name}</p>
                      <p className="mt-1 text-[10px] text-[#89918d]">{item.category}</p>
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
                        <span>For Quote #{po.quote_id || (po.thread_id ? po.thread_id.slice(0, 8) : po.id)}</span>
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

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#17221d]/35 backdrop-blur-[2px]">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedItem(null)}
            aria-label="Close inventory details"
          />
          <aside className="relative h-full w-full max-w-[460px] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#17221d]/8 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#87908b]">
                  Inventory details
                </p>
                <p className="mt-1 text-lg font-extrabold">{selectedItem.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#17221d]/10"
                aria-label="Close details"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#d6ff78]">
                <Icon name="box" className="h-7 w-7" />
              </span>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.035em]">
                    {selectedItem.name}
                  </h2>
                  <p className="mt-2 text-sm text-[#76807b]">{selectedItem.category}</p>
                </div>
                <StockBadge item={selectedItem} />
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  ["Available", `${selectedItem.quantity} ${selectedItem.unit}s`],
                  ["Reorder at", `${selectedItem.reorderAt} ${selectedItem.unit}s`],
                  ["Unit cost", currency(selectedItem.unitCost)],
                  ["Stock value", currency(selectedItem.quantity * selectedItem.unitCost)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f4f5f0] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b938f]">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-extrabold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-[#17221d]/8 p-4">
                <div className="flex justify-between border-b border-[#17221d]/7 pb-3">
                  <span className="text-xs text-[#7b8580]">Supplier</span>
                  <strong className="text-xs">{selectedItem.supplier}</strong>
                </div>
                <div className="flex justify-between border-b border-[#17221d]/7 py-3">
                  <span className="text-xs text-[#7b8580]">Storage location</span>
                  <strong className="text-xs">{selectedItem.location}</strong>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-xs text-[#7b8580]">Last updated</span>
                  <strong className="text-xs">{selectedItem.lastUpdated}</strong>
                </div>
              </div>

              <div className="mt-7">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7b8580]">
                  Adjust stock
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#eef0ea] p-1">
                  <button
                    type="button"
                    onClick={() => setAdjustMode("add")}
                    className={`rounded-lg py-2.5 text-xs font-extrabold ${
                      adjustMode === "add" ? "bg-white shadow-sm" : "text-[#77817c]"
                    }`}
                  >
                    Stock in
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode("remove")}
                    className={`rounded-lg py-2.5 text-xs font-extrabold ${
                      adjustMode === "remove" ? "bg-white shadow-sm" : "text-[#77817c]"
                    }`}
                  >
                    Stock out
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex flex-1 items-center justify-between rounded-full border border-[#17221d]/12 p-1.5">
                    <button
                      type="button"
                      onClick={() => setAdjustment((value) => Math.max(1, value - 1))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-[#eef0ea]"
                      aria-label="Decrease adjustment"
                    >
                      <Icon name="minus" className="h-4 w-4" />
                    </button>
                    <strong className="text-sm">{adjustment}</strong>
                    <button
                      type="button"
                      onClick={() => setAdjustment((value) => value + 1)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-[#eef0ea]"
                      aria-label="Increase adjustment"
                    >
                      <Icon name="plus" className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={updateStock}
                    className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[#17221d] px-4 text-xs font-extrabold text-white"
                  >
                    {saved && <Icon name="check" className="h-4 w-4" />}
                    {saved ? (savedNote || "Stock updated") : "Update stock"}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
