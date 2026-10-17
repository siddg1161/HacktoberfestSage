import { useEffect, useMemo, useState } from "react";
import InventoryDashboard from "./InventoryDashboard";
import { api, DbQuote, QuoteResult } from "./api";

type JobStatus = "Paid" | "Approved" | "Awaiting approval" | "Draft";

type Job = {
  id: string;
  thread_id?: string;
  customer: string;
  phone: string;
  service: string;
  technician: string;
  date: string;
  time: string;
  status: JobStatus;
  amount: number;
  items: { name: string; quantity: number; price: number; stock_tier?: string }[];
  notes: string;
  revenue_alert?: string;
  revenue_alert_obj?: any;
  purchase_orders?: any[];
  slip_image_url?: string;
};

const initialDemoJobs: Job[] = [
  {
    id: "PP-1048",
    thread_id: "demo-thread-1048",
    customer: "Sharma Electricals",
    phone: "+91 98261 44820",
    service: "Complete room rewiring",
    technician: "Vikram Patel",
    date: "18 Oct 2026",
    time: "10:42 AM",
    status: "Paid",
    amount: 41347,
    items: [
      { name: "Room rewiring", quantity: 3, price: 24000, stock_tier: "HEALTHY" },
      { name: "MCB distribution box", quantity: 2, price: 7600, stock_tier: "THRESHOLD_WARNING" },
      { name: "Modular switches", quantity: 18, price: 3240, stock_tier: "INSTANT_DEFICIT" },
      { name: "Fitting & labour", quantity: 1, price: 2200, stock_tier: "HEALTHY" },
    ],
    notes: "Customer requested Anchor Roma switches. Work to begin Monday morning.",
  },
  {
    id: "PP-1047",
    thread_id: "demo-thread-1047",
    customer: "Joshi Clinic",
    phone: "+91 98930 11228",
    service: "AC service and gas refill",
    technician: "Arjun Mehta",
    date: "18 Oct 2026",
    time: "9:15 AM",
    status: "Approved",
    amount: 12800,
    items: [
      { name: "Split AC servicing", quantity: 3, price: 4500, stock_tier: "HEALTHY" },
      { name: "R32 gas refill", quantity: 1, price: 5800, stock_tier: "THRESHOLD_WARNING" },
      { name: "Drain pipe replacement", quantity: 2, price: 1500, stock_tier: "HEALTHY" },
    ],
    notes: "Reception AC is priority. Complete work outside clinic hours.",
  },
  {
    id: "PP-1046",
    thread_id: "demo-thread-1046",
    customer: "Mehta Interiors",
    phone: "+91 97555 89004",
    service: "False ceiling lighting",
    technician: "Vikram Patel",
    date: "17 Oct 2026",
    time: "4:38 PM",
    status: "Awaiting approval",
    amount: 28750,
    items: [
      { name: "LED profile light", quantity: 42, price: 16800, stock_tier: "HEALTHY" },
      { name: "Driver 24V", quantity: 6, price: 7200, stock_tier: "THRESHOLD_WARNING" },
      { name: "Installation", quantity: 1, price: 4750, stock_tier: "HEALTHY" },
    ],
    notes: "Warm white 3000K profile requested for the drawing room.",
  },
  {
    id: "PP-1045",
    thread_id: "demo-thread-1045",
    customer: "Patel Traders",
    phone: "+91 99770 33219",
    service: "Shop CCTV installation",
    technician: "Sameer Khan",
    date: "17 Oct 2026",
    time: "1:20 PM",
    status: "Draft",
    amount: 35990,
    items: [
      { name: "2MP dome camera", quantity: 6, price: 17400, stock_tier: "INSTANT_DEFICIT" },
      { name: "8-channel DVR", quantity: 1, price: 9800, stock_tier: "HEALTHY" },
      { name: "Cable and installation", quantity: 1, price: 8790, stock_tier: "HEALTHY" },
    ],
    notes: "Need customer confirmation on DVR storage capacity.",
  },
  {
    id: "PP-1044",
    thread_id: "demo-thread-1044",
    customer: "Cafe Chapter One",
    phone: "+91 88170 22019",
    service: "Kitchen exhaust repair",
    technician: "Arjun Mehta",
    date: "16 Oct 2026",
    time: "5:05 PM",
    status: "Paid",
    amount: 9650,
    items: [
      { name: "Exhaust motor", quantity: 1, price: 5800, stock_tier: "HEALTHY" },
      { name: "Duct cleaning", quantity: 1, price: 2250, stock_tier: "HEALTHY" },
      { name: "Labour", quantity: 1, price: 1600, stock_tier: "HEALTHY" },
    ],
    notes: "Work completed after closing. Payment received via UPI.",
  },
  {
    id: "PP-1043",
    thread_id: "demo-thread-1043",
    customer: "Aarav Residency",
    phone: "+91 98270 66114",
    service: "Water pump replacement",
    technician: "Sameer Khan",
    date: "16 Oct 2026",
    time: "11:30 AM",
    status: "Approved",
    amount: 22400,
    items: [
      { name: "1.5 HP water pump", quantity: 1, price: 16800, stock_tier: "HEALTHY" },
      { name: "Pipe fittings", quantity: 1, price: 2200, stock_tier: "HEALTHY" },
      { name: "Installation", quantity: 1, price: 3400, stock_tier: "HEALTHY" },
    ],
    notes: "Society manager approved. Installation planned for Saturday.",
  },
];

type AdminIcon =
  | "arrow"
  | "briefcase"
  | "check"
  | "chevron"
  | "download"
  | "file"
  | "money"
  | "search"
  | "users"
  | "x";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: AdminIcon;
  className?: string;
}) {
  const paths: Record<AdminIcon, React.ReactNode> = {
    arrow: <path d="M19 12H5m6 6-6-6 6-6" />,
    briefcase: (
      <>
        <rect width="20" height="14" x="2" y="7" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 12h20M10 12v2h4v-2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    money: (
      <>
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M16 12h.01M6 9h6a2 2 0 0 1 0 4H8a2 2 0 0 0 0 4h6M10 7v10" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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

const statusStyle: Record<JobStatus, string> = {
  Paid: "bg-[#e8f7d3] text-[#4d6817]",
  Approved: "bg-[#e7f0ff] text-[#315d9b]",
  "Awaiting approval": "bg-[#fff2cf] text-[#84600b]",
  Draft: "bg-[#eceeeb] text-[#68716d]",
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const [jobsList, setJobsList] = useState<Job[]>(initialDemoJobs);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | JobStatus>("All");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // Load real quotes from backend
  const loadQuotes = async () => {
    try {
      const res = await api.getQuotes();
      const list = Array.isArray(res) ? res : (res as any)?.quotes || (res as any)?.data || [];
      if (list.length > 0) {
        const liveJobs: Job[] = list.map((q: DbQuote) => {
          let st: JobStatus = "Draft";
          if (q.status === "INVOICED") st = "Paid";
          else if (q.status === "WON") st = "Approved";
          else if (q.status === "QUOTED") st = "Awaiting approval";

          const d = new Date(q.created_at || Date.now());
          const dateStr = d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const timeStr = d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // Ensure notes and revenue_alert are always strings, never objects!
          const alertObj = typeof q.ai_revenue_alert === "object" ? q.ai_revenue_alert : null;
          const alertReason =
            alertObj?.reason ||
            (typeof q.ai_revenue_alert === "string" ? q.ai_revenue_alert : "");

          return {
            id: q.quote_id || `Q-${q.id}`,
            thread_id: q.thread_id,
            customer: q.client_name,
            phone: q.client_phone || "+91 98261 44820",
            service: `Quote #${q.quote_id || q.id}`,
            technician: "Field AI Agent",
            date: dateStr,
            time: timeStr,
            status: st,
            amount: Number(q.grand_total) || 0,
            items: [],
            notes: alertReason || "Automated GST Quote via QuoteFlow AI.",
            revenue_alert: alertReason,
            revenue_alert_obj: alertObj,
            slip_image_url: q.slip_image_url,
          };
        });

        // Merge live quotes at the top, followed by demo jobs that don't collide
        setJobsList([...liveJobs, ...initialDemoJobs.filter((d) => !liveJobs.some((l) => l.id === d.id))]);
      }
    } catch (err) {
      console.warn("Using fallback demo jobs:", err);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  // When job clicked, load live details if thread_id is available
  const handleSelectJob = async (job: Job) => {
    setSelectedJob(job);
    setActionSuccess(null);
    if (!job.thread_id) return;

    try {
      setLoadingDetail(true);
      const res = await api.getQuote(job.thread_id);
      if (res) {
        const rawQuote = res.quote || res;
        const rawItems = res.line_items || res.items || [];

        const lineItems = rawItems.map((li: any) => ({
          sku_id: li.sku_id || "CUSTOM",
          name: li.item_name || li.name || "Item",
          quantity: Number(li.requested_qty ?? li.quantity) || 1,
          unit_price: Number(li.unit_price) || Math.round(((Number(li.line_total ?? li.price) || 0) / 1.18 / (Number(li.quantity) || 1)) * 100) / 100,
          gst_rate: Number(li.gst_rate) || 18,
          price: Number(li.line_total ?? li.price) || 0,
          stock_tier: li.stock_tier,
        }));

        const alertObj = typeof rawQuote.ai_revenue_alert === "object" ? rawQuote.ai_revenue_alert : null;
        const alertReason =
          alertObj?.reason ||
          (typeof rawQuote.ai_revenue_alert === "string" ? rawQuote.ai_revenue_alert : "");

        setSelectedJob((prev) =>
          prev
            ? {
                ...prev,
                items: lineItems.length > 0 ? lineItems : prev.items,
                revenue_alert: alertReason || prev.revenue_alert,
                revenue_alert_obj: alertObj || prev.revenue_alert_obj,
                purchase_orders: res.purchase_orders || rawQuote.purchase_orders || prev.purchase_orders || [],
                slip_image_url: rawQuote.slip_image_url || prev.slip_image_url,
              }
            : null,
        );
      }
    } catch (err) {
      console.warn("Could not load live quote detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Admin inline item quantity adjustment
  const handleAdminUpdateItemQty = (idx: number, delta: number) => {
    if (!selectedJob || !selectedJob.items) return;
    const items = [...selectedJob.items];
    const target = { ...items[idx] };
    target.quantity = Math.max(1, target.quantity + delta);
    const unitPrice = (target as any).unit_price || (target.price / (target.quantity - delta || 1));
    target.price = Math.round(target.quantity * unitPrice * 1.18 * 100) / 100;
    items[idx] = target;

    const newAmount = items.reduce((sum, it) => sum + it.price, 0);
    setSelectedJob({
      ...selectedJob,
      items,
      amount: newAmount,
    });
  };

  // Admin save quote edits to LangGraph state and Neon DB
  const handleAdminSaveQuoteEdits = async () => {
    if (!selectedJob || !selectedJob.thread_id || !selectedJob.items) return;
    try {
      setLoadingDetail(true);
      const payloadItems = selectedJob.items.map((it: any) => ({
        sku_id: it.sku_id || "CUSTOM",
        item_name: it.name,
        quantity: it.quantity,
        unit_price: it.unit_price || Math.round((it.price / 1.18 / it.quantity) * 100) / 100,
        gst_rate: it.gst_rate || 18,
      }));
      await api.editQuote(selectedJob.thread_id, payloadItems);
      setActionSuccess("Quote updated in state and database!");
      await loadQuotes();
    } catch (err: any) {
      alert("Error saving edits: " + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Vendor HITL Approval
  const handleApproveQuote = async (threadId: string) => {
    try {
      setLoadingDetail(true);
      await api.approveQuote(threadId);
      setActionSuccess("Quote approved and dispatched to customer portal!");
      await loadQuotes();
      if (selectedJob) {
        setSelectedJob({ ...selectedJob, status: "Awaiting approval" });
      }
    } catch (err: any) {
      alert("Approval error: " + (err.message || err));
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobsList.filter(
      (job) =>
        (status === "All" || job.status === status) &&
        (!query ||
          job.customer.toLowerCase().includes(query) ||
          job.id.toLowerCase().includes(query) ||
          job.technician.toLowerCase().includes(query) ||
          job.service.toLowerCase().includes(query)),
    );
  }, [jobsList, search, status]);

  const exportJobs = () => {
    const headings = [
      "Job ID",
      "Date",
      "Time",
      "Customer",
      "Phone",
      "Service",
      "Technician",
      "Status",
      "Amount (INR)",
      "Notes",
    ];
    const escapeCell = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;
    const rows = filteredJobs.map((job) =>
      [
        job.id,
        job.date,
        job.time,
        job.customer,
        job.phone,
        job.service,
        job.technician,
        job.status,
        job.amount,
        job.notes,
      ]
        .map(escapeCell)
        .join(","),
    );
    const csv = `\uFEFF${headings.map(escapeCell).join(",")}\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `parchipay-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 2200);
  };

  const collected = jobsList
    .filter((job) => job.status === "Paid")
    .reduce((sum, job) => sum + job.amount, 0);
  const pending = jobsList
    .filter((job) => job.status !== "Paid")
    .reduce((sum, job) => sum + job.amount, 0);

  if (showInventory) {
    return <InventoryDashboard onBack={() => setShowInventory(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f5ef] text-[#17221d]">
      <header className="border-b border-[#17221d]/8 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => {
                window.location.hash = "";
              }}
              className="hidden h-9 w-9 place-items-center rounded-full border border-[#17221d]/10 text-[#66716b] sm:grid"
              aria-label="Back to home"
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
                  Admin
                </p>
              </div>
            </div>

            {/* Top Navigation Switcher */}
            <div className="hidden sm:flex items-center gap-1.5 ml-6 bg-[#f4f5ef] p-1 rounded-full border border-[#17221d]/8">
              <button
                type="button"
                onClick={() => setShowInventory(false)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition ${
                  !showInventory
                    ? "bg-[#17221d] text-white shadow-sm"
                    : "text-[#59645f] hover:text-[#17221d]"
                }`}
              >
                📋 Jobs & Quotes
              </button>
              <button
                type="button"
                onClick={() => setShowInventory(true)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition ${
                  showInventory
                    ? "bg-[#17221d] text-white shadow-sm"
                    : "text-[#59645f] hover:text-[#17221d]"
                }`}
              >
                📦 Warehouse & Inventory
              </button>
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
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6a841d]">
              Operations overview
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">
              Jobs dashboard
            </h1>
            <p className="mt-2 text-sm text-[#6f7974]">
              Track every site visit, quote and payment in one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#technician-auth"
              className="flex items-center justify-center gap-2 rounded-full border border-[#17221d]/15 bg-white px-5 py-3.5 text-sm font-extrabold transition hover:-translate-y-0.5"
            >
              <Icon name="users" className="h-4 w-4" />
              Technician portal
            </a>
            <button
              type="button"
              onClick={() => setShowInventory(true)}
              className="flex items-center justify-center gap-2 rounded-full bg-[#caff52] text-[#17221d] border border-[#17221d]/15 px-5 py-3.5 text-sm font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:bg-[#bbf33a]"
            >
              <Icon name="briefcase" className="h-4 w-4" />
              Warehouse & Inventory Hub
            </button>
            <button
              type="button"
              onClick={exportJobs}
              className="flex items-center justify-center gap-2 rounded-full bg-[#17221d] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              <Icon name={exported ? "check" : "download"} className="h-4 w-4" />
              {exported ? "Excel sheet downloaded" : "Export Excel"}
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Quotes",
              value: String(jobsList.length),
              detail: "Active in database",
              icon: "briefcase" as AdminIcon,
              color: "bg-[#d6ff78]",
            },
            {
              label: "Amount collected",
              value: currency(collected),
              detail: `${jobsList.filter((j) => j.status === "Paid").length} paid jobs`,
              icon: "money" as AdminIcon,
              color: "bg-[#dff3df]",
            },
            {
              label: "In pipeline",
              value: currency(pending),
              detail: `Across ${jobsList.filter((j) => j.status !== "Paid").length} quotes`,
              icon: "file" as AdminIcon,
              color: "bg-[#fff0c7]",
            },
            {
              label: "Active technicians",
              value: "3",
              detail: "All currently online",
              icon: "users" as AdminIcon,
              color: "bg-[#e5e8ff]",
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

        <section className="mt-6 overflow-hidden rounded-[26px] border border-[#17221d]/8 bg-white">
          <div className="flex flex-col gap-4 border-b border-[#17221d]/8 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-[-0.025em]">All jobs</h2>
              <p className="mt-1 text-xs text-[#818a85]">
                {filteredJobs.length} {filteredJobs.length === 1 ? "record" : "records"} shown
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative">
                <span className="sr-only">Search jobs</span>
                <Icon
                  name="search"
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f9793]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search jobs, customers…"
                  className="h-11 w-full rounded-xl border border-[#17221d]/10 bg-[#fafbf8] pl-10 pr-4 text-xs font-semibold outline-none focus:border-[#789524] sm:w-64"
                />
              </label>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "All" | JobStatus)
                }
                className="h-11 rounded-xl border border-[#17221d]/10 bg-[#fafbf8] px-4 text-xs font-bold outline-none focus:border-[#789524]"
                aria-label="Filter by status"
              >
                <option>All</option>
                <option>Paid</option>
                <option>Approved</option>
                <option>Awaiting approval</option>
                <option>Draft</option>
              </select>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#fafbf8] text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8a928e]">
                  <th className="px-5 py-3.5">Job</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Technician</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="w-12 px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className="cursor-pointer border-t border-[#17221d]/7 transition hover:bg-[#f8faF4]"
                  >
                    <td className="px-5 py-4">
                      <p className="text-xs font-extrabold">{job.id}</p>
                      <p className="mt-1 text-[10px] text-[#8a928e]">
                        {job.date} · {job.time}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold">{job.customer}</p>
                      <p className="mt-1 max-w-[220px] truncate text-[11px] text-[#7d8681]">
                        {job.service}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-[#59645f]">
                      {job.technician}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-extrabold">
                      {currency(job.amount)}
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
            {filteredJobs.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => handleSelectJob(job)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">{job.customer}</p>
                    <p className="mt-1 text-xs text-[#78817d]">{job.service}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#929995]">{job.id}</p>
                    <p className="mt-1 text-[10px] text-[#929995]">
                      {job.date} · {job.technician}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold">{currency(job.amount)}</p>
                </div>
              </button>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="px-5 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eef0ea]">
                <Icon name="search" className="h-5 w-5 text-[#828b86]" />
              </span>
              <p className="mt-4 text-sm font-extrabold">No jobs found</p>
              <p className="mt-1 text-xs text-[#8c9490]">Try another search or status.</p>
            </div>
          )}
        </section>
      </main>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#17221d]/35 backdrop-blur-[2px]">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedJob(null)}
            aria-label="Close job details"
          />
          <aside className="relative h-full w-full max-w-[540px] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#17221d]/8 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#87908b]">
                  Quote Details · LangGraph Thread
                </p>
                <p className="mt-1 text-lg font-extrabold">{selectedJob.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#17221d]/10"
                aria-label="Close details"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              {actionSuccess && (
                <div className="mb-5 rounded-2xl bg-[#e8f7d3] p-4 text-xs font-bold text-[#4d6817]">
                  ✓ {actionSuccess}
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-[-0.035em]">
                    {selectedJob.customer}
                  </h2>
                  <p className="mt-1 text-sm text-[#76807b]">{selectedJob.phone}</p>
                  {selectedJob.thread_id && (
                    <p className="mt-1 font-mono text-[10px] text-[#8fa099]">
                      Thread: {selectedJob.thread_id}
                    </p>
                  )}
                </div>
                <StatusBadge status={selectedJob.status} />
              </div>

              {/* AI Revenue Alert Banner */}
              {selectedJob.revenue_alert && (
                <div className="mt-5 rounded-2xl border border-[#f5c270] bg-[#fff9ed] p-4 text-xs text-[#825c0e]">
                  <p className="font-extrabold uppercase tracking-[0.08em] text-[#a46e00]">
                    ⚡ Gemma 4 Revenue Leakage Alert
                  </p>
                  <p className="mt-1 leading-5">
                    {typeof selectedJob.revenue_alert === "string"
                      ? selectedJob.revenue_alert
                      : (selectedJob.revenue_alert as any)?.reason || JSON.stringify(selectedJob.revenue_alert)}
                  </p>
                  {selectedJob.revenue_alert_obj?.suggested_addons && selectedJob.revenue_alert_obj.suggested_addons.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-[#f5c270]/40 pt-2">
                      <p className="font-bold text-[#a46e00]">Recoverable Ancillary Services:</p>
                      {selectedJob.revenue_alert_obj.suggested_addons.map((add: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white/70 px-2.5 py-1.5 rounded-lg border border-[#f5c270]/30 text-[11px]">
                          <span>💡 {add.suggested_item_name} (Qty: {add.suggested_qty})</span>
                          <span className="font-extrabold text-[#047857]">₹{add.line_total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f4f5f0] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b938f]">
                    Site visit
                  </p>
                  <p className="mt-2 text-xs font-extrabold">{selectedJob.date}</p>
                  <p className="mt-1 text-[11px] text-[#77817c]">{selectedJob.time}</p>
                </div>
                <div className="rounded-xl bg-[#f4f5f0] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b938f]">
                    Technician
                  </p>
                  <p className="mt-2 text-xs font-extrabold">{selectedJob.technician}</p>
                  <p className="mt-1 text-[11px] text-[#77817c]">Field team</p>
                </div>
              </div>

              {/* Line Items */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7b8580]">
                    Quotation Line Items
                  </p>
                  {loadingDetail && (
                    <span className="text-[10px] font-bold text-[#86928d]">
                      Loading real-time sync…
                    </span>
                  )}
                </div>

                <div className="mt-3 overflow-hidden rounded-2xl border border-[#17221d]/8">
                  {selectedJob.items.map((item, idx) => {
                    const isDeficit = item.stock_tier === "INSTANT_DEFICIT";
                    const isWarning = item.stock_tier === "THRESHOLD_WARNING";
                    return (
                      <div
                        key={item.name + idx}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[#17221d]/7 px-4 py-3.5 last:border-0"
                      >
                        <div>
                          <p className="text-xs font-bold">{item.name}</p>
                          {item.stock_tier && (
                            <span
                              className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                                isDeficit
                                  ? "bg-red-100 text-red-700"
                                  : isWarning
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {item.stock_tier}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-[#17221d]/10 bg-white px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleAdminUpdateItemQty(idx, -1)}
                            className="h-5 w-5 rounded bg-[#f4f5ef] text-[10px] font-bold hover:bg-[#e0e3dc]"
                            title="Decrease qty"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold px-1">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleAdminUpdateItemQty(idx, 1)}
                            className="h-5 w-5 rounded bg-[#f4f5ef] text-[10px] font-bold hover:bg-[#e0e3dc]"
                            title="Increase qty"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xs font-extrabold">{currency(item.price)}</p>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between bg-[#17221d] px-4 py-4 text-white">
                    <div>
                      <p className="text-xs font-bold text-white/60">Grand Total (incl. GST)</p>
                      {selectedJob.thread_id && (
                        <button
                          type="button"
                          onClick={handleAdminSaveQuoteEdits}
                          className="mt-1 text-[10px] font-extrabold text-[#caff52] underline hover:text-white"
                        >
                          💾 Save item edits to database
                        </button>
                      )}
                    </div>
                    <p className="text-lg font-extrabold">{currency(selectedJob.amount)}</p>
                  </div>
                </div>
              </div>

              {/* Drafted Supplier Purchase Orders */}
              {selectedJob.purchase_orders && selectedJob.purchase_orders.length > 0 && (
                <div className="mt-7">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7b8580]">
                    Warehouse Purchase Orders Triggered
                  </p>
                  <div className="mt-3 space-y-2">
                    {selectedJob.purchase_orders.map((po: any, poIdx: number) => (
                      <div
                        key={po.po_number || po.po_id || poIdx}
                        className="rounded-2xl border border-[#17221d]/8 bg-[#f9faf7] p-4 text-xs"
                      >
                        <div className="flex items-center justify-between font-extrabold">
                          <span>{po.supplier_name}</span>
                          <span className="rounded bg-[#d6ff78] px-2 py-0.5 text-[10px]">
                            {po.status || po.urgency}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-[#738079]">
                          PO: {po.po_number || po.po_id || `PO-${poIdx + 1}`}
                        </p>
                        <p className="mt-1 font-semibold text-[#505a54]">
                          Wholesale Cost: ₹{po.total_cost || po.total_wholesale_cost || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-7">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7b8580]">
                  Site Notes
                </p>
                <p className="mt-3 rounded-2xl bg-[#f4f5f0] p-4 text-sm leading-6 text-[#5f6a64]">
                  {typeof selectedJob.notes === "string"
                    ? selectedJob.notes
                    : (selectedJob.notes as any)?.reason || JSON.stringify(selectedJob.notes)}
                </p>
              </div>

              {/* Actions & Links */}
              <div className="mt-7 space-y-3">
                {selectedJob.status === "Awaiting approval" && selectedJob.thread_id && (
                  <button
                    type="button"
                    disabled={loadingDetail}
                    onClick={() => handleApproveQuote(selectedJob.thread_id!)}
                    className="w-full rounded-full bg-[#17221d] py-3.5 text-xs font-extrabold text-[#caff52] shadow-lg transition hover:bg-[#22332c] disabled:opacity-50"
                  >
                    ✓ Approve Quote & Release to Customer Portal
                  </button>
                )}

                <div className="flex gap-3">
                  {selectedJob.thread_id && (
                    <a
                      href={`#portal/${selectedJob.thread_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-full bg-[#caff52] py-3 text-center text-xs font-extrabold text-[#17221d] transition hover:bg-[#b5f03a]"
                    >
                      Open Customer Portal ↗
                    </a>
                  )}
                  {selectedJob.thread_id && (
                    <a
                      href={`http://localhost:5000/api/quotes/${selectedJob.thread_id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-full border border-[#17221d]/15 bg-white py-3 text-center text-xs font-extrabold text-[#17221d] transition hover:bg-[#f4f5f0]"
                    >
                      Print GST Invoice ↗
                    </a>
                  )}
                </div>

                {selectedJob.slip_image_url && (
                  <a
                    href={selectedJob.slip_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full rounded-full border border-[#17221d]/10 bg-white py-2.5 text-center text-[11px] font-bold text-[#62706a] hover:bg-[#f4f5f0]"
                  >
                    View Original Handwritten Parchi
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
