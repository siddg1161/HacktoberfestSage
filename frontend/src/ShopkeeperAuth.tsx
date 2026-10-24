import { FormEvent, useState } from "react";
import { api } from "./api";
import { authClient } from "./auth-client";
import { setActiveBusiness, setActiveWorker, useActiveBusiness, clearAllSessions } from "./businessContext";

type IconName = "arrow" | "check" | "store" | "sparkle" | "building" | "users" | "phone";

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    store: (
      <>
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
      </>
    ),
    sparkle: (
      <path d="m12 3-1.2 3.1a7.5 7.5 0 0 1-4.3 4.3L3 12l3.5 1.6a7.5 7.5 0 0 1 4.3 4.3L12 21l1.2-3.1a7.5 7.5 0 0 1 4.3-4.3L21 12l-3.5-1.6a7.5 7.5 0 0 1-4.3-4.3Z" />
    ),
    building: (
      <>
        <rect width="16" height="20" x="4" y="2" rx="2" />
        <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
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

const TRADES = [
  "Electrical",
  "Plumbing",
  "HVAC & Cooling",
  "Automotive / Garage",
  "General Contracting",
  "Hardware & Sanitary",
  "Medical / Clinic",
  "Freelancer / Service Provider",
];

export default function ShopkeeperAuth({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { business: activeBiz } = useActiveBusiness();
  const hasActiveShop = Boolean(activeBiz?.business_id && activeBiz.business_id.trim().length > 0);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Register Form State
  const [bizName, setBizName] = useState("");
  const [industry, setIndustry] = useState("Electrical");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [tagline, setTagline] = useState("");

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await authClient.signIn.email({ email: email.trim(), password });
      if (authError) throw new Error(authError.message || "Incorrect email or password.");
      const workspace = await api.getMyWorkspace();
      setActiveBusiness(workspace.business);
      setActiveWorker(workspace.worker);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Unable to sign in to this workspace.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!bizName.trim() || !ownerName.trim() || !email.trim() || password.length < 8) {
      setError("Enter your business details and a password of at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await authClient.signUp.email({
        name: ownerName.trim(),
        email: email.trim(),
        password,
      });
      if (authError) throw new Error(authError.message || "Unable to create your account.");
      const newBiz = await api.createAuthenticatedBusiness({
        business_name: bizName.trim(),
        industry,
        address: address.trim() || undefined,
        tagline: tagline.trim() || `Professional ${industry} services & customer quotation system`,
        currency_symbol: "₹",
      });

      setActiveBusiness(newBiz);
      setActiveWorker({
        id: 0,
        business_id: newBiz.business_id,
        name: ownerName.trim(),
        email: email.trim(),
        role: "Owner / Manager",
        status: "ACTIVE",
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to register business. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5ef] px-4 py-12 text-[#17221d] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[720px]">
        {/* Top Branding Header */}
        <div className="flex items-center justify-between border-b border-[#17221d]/10 pb-6">
          <a href="#" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#17221d] text-[#caff52] shadow-md">
              <Icon name="store" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-black tracking-[-0.04em] text-[#17221d]">
                dukaan<span className="text-[#6a841d]">pay</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a8580]">
                Shopkeeper Portal
              </p>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-1.5 rounded-full border border-[#17221d]/15 bg-white px-4 py-2 text-xs font-bold text-[#55615b] hover:bg-[#eaece5] transition"
          >
            ← Back to Home
          </a>
        </div>

        {/* Auth Card */}
        <div className="mt-8 overflow-hidden rounded-[32px] border border-[#17221d]/10 bg-white p-6 shadow-xl sm:p-10">
          <div className="flex flex-col items-start gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
              <Icon name="building" className="h-3.5 w-3.5" />
              Shopkeeper &amp; Business Owner Sign In
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">
              Welcome to your shop dashboard
            </h1>
            <p className="text-sm text-[#66726d]">
              Review estimates sent by technicians, approve customer quotes, and manage your team.
            </p>
          </div>

          {hasActiveShop && (
            <div className="mt-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/80 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17221d] text-[#caff52] font-black text-base shadow-sm">
                    <Icon name="store" className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="inline-block rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
                      Active Business Workspace
                    </span>
                    <p className="font-extrabold text-[#17221d] text-base">{activeBiz.business_name}</p>
                    <p className="text-xs text-[#55615b]">
                      {activeBiz.industry} • Owner: {activeBiz.owner_name || "Admin"} • {activeBiz.currency_symbol || "₹"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => onSuccess()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#17221d] px-4 py-2.5 text-xs font-black text-[#caff52] hover:bg-neutral-800 transition shadow-sm"
                >
                  <span>Continue to Shop Dashboard</span>
                  <Icon name="arrow" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAllSessions();
                    window.location.reload();
                  }}
                  className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                >
                  Switch / Sign out
                </button>
              </div>
            </div>
          )}

          {/* Tab Selector */}
          <div className="mt-6 flex rounded-2xl bg-[#f4f5ef] p-1.5 border border-[#17221d]/8">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError("");
              }}
              className={`flex-1 rounded-xl py-3 text-xs font-extrabold transition ${
                tab === "login"
                  ? "bg-[#17221d] text-white shadow-md"
                  : "text-[#58645f] hover:text-[#17221d]"
              }`}
            >
              Select Existing Business Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setError("");
              }}
              className={`flex-1 rounded-xl py-3 text-xs font-extrabold transition ${
                tab === "register"
                  ? "bg-[#17221d] text-white shadow-md"
                  : "text-[#58645f] hover:text-[#17221d]"
              }`}
            >
              + Register New Business
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-800">
              {error}
            </div>
          )}

          {/* TAB 1: AUTHENTICATED SHOPKEEPER LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="mt-6 space-y-4 text-xs font-bold">
              <p className="rounded-xl bg-[#eef3e4] p-3 text-[#526127]">
                Sign in with the email and password linked to your business. Your workspace is selected from your secure session.
              </p>
              <label className="block text-[11px] uppercase tracking-wider text-[#69746f]">
                Shopkeeper email address
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm outline-none focus:border-[#789524]"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-wider text-[#69746f]">
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm outline-none focus:border-[#789524]"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#17221d] py-4 text-sm font-extrabold text-[#caff52] shadow-xl hover:bg-[#25362e] transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Open secure dashboard"}
                <Icon name="arrow" className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER NEW BUSINESS */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="mt-6 space-y-4 text-xs font-bold">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#69746f]">
                    Shop / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Gupta Electricals & Hardware"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#69746f]">
                    Industry / Trade *
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-xs font-bold outline-none focus:border-[#789524]"
                  >
                    {TRADES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#69746f]">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Ramesh Gupta"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#69746f]">
                    Shopkeeper Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramesh@guptaelectricals.com"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm outline-none focus:border-[#789524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#69746f]">
                    Create password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm outline-none focus:border-[#789524]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#69746f]">
                  City / Shop Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 Jawahar Marg, Indore, Madhya Pradesh"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm outline-none focus:border-[#789524]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#69746f]">
                  Tagline / Specialization (Optional)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Complete home wiring, lighting fixtures & solar setups"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm outline-none focus:border-[#789524]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#17221d] py-4 text-sm font-extrabold text-[#caff52] shadow-xl hover:bg-[#25362e] transition disabled:opacity-50"
                >
                  <Icon name="check" className="h-4 w-4" />
                  {loading ? "Registering Shop Profile..." : "Register Shop & Open Dashboard"}
                </button>
              </div>
            </form>
          )}

          {/* Alternate Role Switcher */}
          <div className="mt-8 border-t border-[#17221d]/10 pt-5 text-center">
            <p className="text-xs text-[#707c77]">
              Are you a field technician or on-site worker?{" "}
              <a
                href="#technician-auth"
                className="font-extrabold text-[#17221d] underline hover:text-[#5f7a13]"
              >
                Log in as Technician with Email &amp; Password →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
