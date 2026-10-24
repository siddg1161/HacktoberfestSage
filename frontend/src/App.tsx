import { useEffect, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import TechnicianAuth from "./TechnicianAuth";
import ShopkeeperAuth from "./ShopkeeperAuth";
import TechnicianPortal from "./TechnicianPortal";
import CustomerPortal from "./CustomerPortal";
import { useActiveBusiness } from "./businessContext";

type IconName =
  | "arrow"
  | "check"
  | "chevron"
  | "file"
  | "store"
  | "lock"
  | "menu"
  | "mic"
  | "play"
  | "scan"
  | "sparkle"
  | "upload"
  | "wallet"
  | "x";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
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
    lock: (
      <>
        <rect width="16" height="11" x="4" y="11" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    mic: (
      <>
        <rect width="8" height="13" x="8" y="2" rx="4" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5Z" />,
    scan: (
      <>
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
        <path d="M7 12h10M12 7v10" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3-1.2 3.1a7.5 7.5 0 0 1-4.3 4.3L3 12l3.5 1.6a7.5 7.5 0 0 1 4.3 4.3L12 21l1.2-3.1a7.5 7.5 0 0 1 4.3-4.3L21 12l-3.5-1.6a7.5 7.5 0 0 1-4.3-4.3Z" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
      </>
    ),
    wallet: (
      <>
        <path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6" />
        <path d="M16 15h.01" />
      </>
    ),
    x: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
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

const steps = [
  {
    number: "01",
    icon: "mic" as IconName,
    title: "Capture the messy bits",
    body: "Snap a handwritten dukaan slip, add a site photo, or record a quick Hinglish voice note.",
  },
  {
    number: "02",
    icon: "sparkle" as IconName,
    title: "Gemma makes it precise",
    body: "Items, quantities, taxes and margins are matched to your private rate card in seconds.",
  },
  {
    number: "03",
    icon: "wallet" as IconName,
    title: "Approve. Invoice. Paid.",
    body: "Share a clean quote, collect one-tap approval and automatically follow up on payment.",
  },
];

function Logo() {
  return (
    <a href="#" className="flex items-center gap-2.5" aria-label="DukaanPay home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0f1a13] text-[#caff52] shadow-md transition hover:scale-105">
        <Icon name="store" className="h-5 w-5" />
      </span>
      <span className="font-display text-[19px] font-black tracking-[-0.05em] text-[#0f1a13]">
        dukaan<span className="text-[#6a841d]">pay</span>
      </span>
    </a>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { business: activeBiz } = useActiveBusiness();
  const [showTechnicianPortal, setShowTechnicianPortal] = useState(
    () => window.location.hash === "#technician",
  );
  const [showTechnicianAuth, setShowTechnicianAuth] = useState(
    () =>
      window.location.hash === "#technician-auth" ||
      window.location.hash === "#tech-auth" ||
      window.location.hash === "#tech-login",
  );
  const [showShopkeeperAuth, setShowShopkeeperAuth] = useState(
    () =>
      window.location.hash === "#shopkeeper-auth" ||
      window.location.hash === "#shopkeeper-login" ||
      window.location.hash === "#shopkeeper" ||
      window.location.hash === "#login",
  );
  const [showAdminDashboard, setShowAdminDashboard] = useState(
    () => window.location.hash === "#admin" || window.location.hash === "#dashboard",
  );
  const getPortalId = () => {
    if (window.location.hash.startsWith("#portal/")) {
      return window.location.hash.replace("#portal/", "");
    }
    if (window.location.pathname.startsWith("/portal/")) {
      return window.location.pathname.replace("/portal/", "");
    }
    return null;
  };

  const [portalThreadId, setPortalThreadId] = useState<string | null>(() => getPortalId());

  useEffect(() => {
    const syncRoute = () => {
      setShowTechnicianPortal(window.location.hash === "#technician");
      setShowTechnicianAuth(
        window.location.hash === "#technician-auth" ||
        window.location.hash === "#tech-auth" ||
        window.location.hash === "#tech-login",
      );
      setShowShopkeeperAuth(
        window.location.hash === "#shopkeeper-auth" ||
        window.location.hash === "#shopkeeper-login" ||
        window.location.hash === "#shopkeeper" ||
        window.location.hash === "#login",
      );
      setShowAdminDashboard(
        window.location.hash === "#admin" || window.location.hash === "#dashboard",
      );
      setPortalThreadId(getPortalId());
    };
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  if (portalThreadId) {
    return <CustomerPortal threadId={portalThreadId} />;
  }

  if (showTechnicianAuth) {
    return (
      <TechnicianAuth
        onSuccess={() => {
          window.location.hash = "#technician";
        }}
      />
    );
  }

  if (showShopkeeperAuth) {
    return (
      <ShopkeeperAuth
        onSuccess={() => {
          window.location.hash = "#admin";
        }}
      />
    );
  }

  if (showTechnicianPortal) {
    return <TechnicianPortal />;
  }

  if (showAdminDashboard) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7f2] text-[#17221d]">
      <header className="sticky top-0 z-50 border-b border-[#17221d]/8 bg-[#f7f7f2]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            
          </div>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#4d5953] md:flex">
            <a className="transition-colors hover:text-[#17221d]" href="#how">
              How it works
            </a>
            <a className="transition-colors hover:text-[#17221d]" href="#features">
              Features
            </a>
            <a className="transition-colors hover:text-[#17221d]" href="#privacy">
              Privacy
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <a
              className="inline-flex items-center gap-2 rounded-full border border-[#17221d]/15 bg-white px-5 py-2.5 text-xs font-extrabold text-[#17221d] transition hover:-translate-y-0.5 hover:bg-[#f2f4ed]"
              href="#technician-auth"
            >
              <span>🛠️ Login as Technician</span>
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-full bg-[#17221d] px-5 py-2.5 text-xs font-extrabold text-[#caff52] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#27362f]"
              href="#shopkeeper-auth"
            >
              <span>🏪 Login as Shopkeeper</span>
            </a>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#17221d]/15 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <Icon name={menuOpen ? "x" : "menu"} />
          </button>
        </div>
        {menuOpen && (
          <nav className="absolute inset-x-4 top-[68px] flex flex-col gap-1 rounded-2xl border border-[#17221d]/10 bg-white p-3 text-sm font-bold shadow-xl md:hidden">
            {[
              ["How it works", "#how"],
              ["Features", "#features"],
              ["Privacy", "#privacy"],
              ["🏪 Login as Shopkeeper", "#shopkeeper-auth"],
              ["🛠️ Login as Technician", "#technician-auth"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-xl px-4 py-3 hover:bg-[#f2f4ed]"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main>
        <section className="relative">
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:pb-28 lg:pt-28">
            <div className="relative z-10 max-w-[640px]">
              <div className="animate-slide-up mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#0f1a13]/10 bg-white/90 px-3.5 py-2 text-xs font-bold shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-[#5f7a13] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5f7a13]" />
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d6ff78]">
                  <Icon name="sparkle" className="h-3 w-3" />
                </span>
                Built for India&apos;s field teams &amp; dukaans
              </div>
              <h1 className="animate-slide-up delay-100 font-display max-w-[620px] text-[44px] font-black leading-[0.95] tracking-[-0.055em] sm:text-[60px] lg:text-[70px]">
                From dukaan{" "}
                <span className="text-[#6a841d]">to payment.</span>{" "}
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10">In minutes.</span>
                  <span className="absolute bottom-1 left-0 h-3 w-full -rotate-1 rounded-full bg-[#caff52] sm:h-4" />
                </span>
              </h1>
              <p className="animate-slide-up delay-200 mt-7 max-w-[540px] text-lg leading-8 text-[#59645e]">
                Turn handwritten slips, site photos and Hinglish voice notes
                into polished GST quotations—then get them approved and paid.
              </p>
              <div className="animate-slide-up delay-300 mt-9 flex flex-col gap-3.5 sm:flex-row">
                <a
                  href="#shopkeeper-auth"
                  className="shimmer-button group flex-1 inline-flex items-center justify-center gap-3.5 rounded-2xl bg-[#0f1a13] px-6 py-4 text-white shadow-[0_14px_36px_rgba(15,26,19,0.25)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,26,19,0.35)]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#caff52] text-[#0f1a13]">
                    <Icon name="store" className="h-5 w-5" />
                  </span>
                  <div className="text-left">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#caff52]">
                      Shopkeeper / Owner
                    </span>
                    <span className="block text-[15px] font-black text-white">
                      Sign in as Shopkeeper →
                    </span>
                  </div>
                </a>

                <a
                  href="#technician-auth"
                  className="group flex-1 inline-flex items-center justify-center gap-3.5 rounded-2xl border border-[#0f1a13]/15 bg-white/95 px-6 py-4 text-[#0f1a13] shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f2f5ed] text-[#485b1c]">
                    <Icon name="mic" className="h-5 w-5" />
                  </span>
                  <div className="text-left">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#727d78]">
                      On-site Team
                    </span>
                    <span className="block text-[15px] font-black text-[#0f1a13]">
                      Sign in as Technician →
                    </span>
                  </div>
                </a>
              </div>
              <div className="animate-fade-in delay-500 mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#6e7873]">
                {["No card needed", "Works offline", "Your data stays yours"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <Icon name="check" className="h-3.5 w-3.5 text-[#5f7a13]" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[660px] lg:ml-auto">
              <div className="animate-aurora absolute -right-16 -top-14 h-64 w-64 rounded-full bg-[#caff52]/60 blur-3xl pointer-events-none" />
              <div className="animate-aurora [animation-delay:4s] absolute -bottom-16 left-5 h-56 w-56 rounded-full bg-[#ffdca8]/80 blur-3xl pointer-events-none" />
              <div className="relative rounded-[30px] border border-[#17221d]/10 bg-[#e9eee5]/90 p-2.5 shadow-[0_34px_80px_rgba(35,48,41,0.18)] backdrop-blur-sm sm:p-4 transition duration-500 hover:shadow-[0_40px_90px_rgba(35,48,41,0.24)]">
                <div className="overflow-hidden rounded-[22px] bg-white">
                  <div className="flex items-center justify-between border-b border-[#17221d]/8 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff897d]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ffd36a]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#8fdf86]" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-[#f2f4ef] px-4 py-1.5 text-[10px] font-bold text-[#77807b]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      app.dukaanpay.in
                    </div>
                    <div className="h-6 w-6 rounded-full bg-[#d6ff78] flex items-center justify-center text-[10px] font-black">
                      ✓
                    </div>
                  </div>
                  <div className="grid min-h-[420px] grid-cols-[54px_1fr] sm:grid-cols-[74px_1fr]">
                    <aside className="flex flex-col items-center gap-5 bg-[#17221d] py-5 text-white/45">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#caff52] text-[#17221d] shadow-sm">
                        <Icon name="store" className="h-4 w-4" />
                      </div>
                      <Icon name="scan" className="h-5 w-5 hover:text-white transition cursor-pointer" />
                      <Icon name="file" className="h-5 w-5 text-white" />
                      <Icon name="wallet" className="h-5 w-5 hover:text-white transition cursor-pointer" />
                    </aside>
                    <div className="bg-[#f8f9f6] p-4 sm:p-6">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#89918d]">
                            New quotation
                          </p>
                          <p className="mt-1 font-display text-sm font-extrabold sm:text-lg">
                            Sharma Electricals
                          </p>
                        </div>
                        <span className="rounded-full bg-[#fff0cc] px-3 py-1.5 font-mono text-[9px] font-extrabold text-[#8b6510] sm:text-[10px]">
                          DRAFT
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                        <div className="scan-laser relative min-h-[150px] overflow-hidden rounded-2xl bg-[#e9dfc8] p-3 shadow-inner">
                          <div className="absolute inset-0 paper-lines opacity-50" />
                          <div className="relative rotate-[-2deg] font-hand text-[12px] leading-6 text-[#555044] sm:text-[13px]">
                            <p className="mb-1 border-b border-[#555044]/30 pb-1 font-bold">
                              Sharma ji - Vijay Nagar
                            </p>
                            <p>3 room rewiring</p>
                            <p>2 × MCB box</p>
                            <p>switches — 18 pcs</p>
                            <p className="mt-1">+ fitting &amp; labour</p>
                          </div>
                          <span className="absolute bottom-2 right-2 rounded-lg bg-white/85 px-2 py-1 font-mono text-[8px] font-bold backdrop-blur">
                            IMG_2048.jpg
                          </span>
                        </div>
                        <div className="rounded-2xl border border-[#17221d]/8 bg-white p-3 sm:p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#d6ff78]">
                              <Icon name="sparkle" className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <p className="font-mono text-[10px] font-extrabold">AI EXTRACTED</p>
                              <p className="text-[8px] text-[#7d8681]">4 items · 98% confidence</p>
                            </div>
                          </div>
                          {[
                            ["Room rewiring", "3", "₹24,000"],
                            ["MCB distribution box", "2", "₹7,600"],
                            ["Modular switches", "18", "₹3,240"],
                          ].map(([item, qty, price]) => (
                            <div
                              key={item}
                              className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-[#17221d]/7 py-2 text-[8px] sm:text-[9px]"
                            >
                              <span className="font-bold">{item}</span>
                              <span className="font-mono text-[#8a928e]">×{qty}</span>
                              <span className="font-mono font-extrabold">{price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#17221d] px-4 py-3 text-white sm:px-5 sm:py-4 shadow-md">
                        <div>
                          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/50">
                            Quote total · incl. GST
                          </p>
                          <p className="mt-0.5 font-mono text-lg font-extrabold sm:text-2xl text-[#caff52]">₹41,347</p>
                        </div>
                        <button className="shimmer-button rounded-full bg-[#caff52] px-3.5 py-2 text-[9px] font-extrabold text-[#17221d] shadow transition hover:scale-105 sm:px-4 sm:text-[10px]">
                          Send for approval
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="float-card absolute -bottom-8 -left-3 flex items-center gap-3 rounded-2xl border border-[#17221d]/10 bg-white/95 p-3 pr-5 shadow-2xl backdrop-blur-md sm:-left-10">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6ff78] shadow-sm">
                  <Icon name="check" className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold text-[#7d8681]">CLIENT UPDATE</p>
                  <p className="font-display text-xs font-extrabold sm:text-sm">Quote approved · ₹41,347</p>
                </div>
              </div>
              <div className="float-delayed absolute -top-5 -right-3 sm:-right-8 flex items-center gap-2.5 rounded-2xl border border-[#17221d]/10 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div>
                  <p className="font-mono text-[9px] font-bold tracking-wider text-emerald-800 uppercase">Warehouse Check</p>
                  <p className="text-[11px] font-extrabold text-[#17221d]">Stock verified &amp; ready</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#0f1a13]/8 bg-white py-6 overflow-hidden">
          <div className="flex items-center gap-4 px-4">
            <span className="shrink-0 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#9ba49f] pr-4 border-r border-[#0f1a13]/10">
              Trusted by
            </span>
            <div className="overflow-hidden flex-1">
              <div className="marquee-track">
                {[
                  "Interior Studios", "Electricians", "AC Services", "Contractors",
                  "Plumbers", "Painters", "Hardware Shops", "Clinics",
                  "Interior Studios", "Electricians", "AC Services", "Contractors",
                  "Plumbers", "Painters", "Hardware Shops", "Clinics",
                ].map((label, i) => (
                  <span key={i} className="inline-flex items-center gap-2 text-[14px] font-extrabold text-[#53605a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#caff52]" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-label">How it works</p>
            <h2 className="section-title mt-4">
              Less paperwork. More{" "}
              <span className="text-[#6a841d]">paid work.</span>
            </h2>
            <p className="section-copy mx-auto mt-5 max-w-xl">
              DukaanPay handles the admin between finishing a site visit and
              getting money in the bank.
            </p>
          </div>
          <div className="relative mt-16 grid gap-5 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-12 hidden border-t border-dashed border-[#0f1a13]/20 md:block" />
            {steps.map((step, idx) => (
              <article
                key={step.number}
                className={`group relative rounded-[26px] border border-[#0f1a13]/9 bg-white p-7 hover-lift animate-slide-up delay-${(idx + 1) * 100}`}
              >
                <div className="relative z-10 mb-8 flex items-center justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eff2e9] transition group-hover:bg-[#d6ff78]">
                    <Icon name={step.icon} className="h-6 w-6" />
                  </span>
                  <span className="text-xs font-extrabold text-[#a4aaa7]">{step.number}</span>
                </div>
                <h3 className="font-display text-xl font-black tracking-[-0.04em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#69736e]">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="bg-[#ebece4] py-24 sm:py-32">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="section-label">Built for the real world</p>
                <h2 className="section-title font-display mt-4">A back office in your pocket.</h2>
              </div>
              <p className="section-copy max-w-md">
                Capture work your way. DukaanPay turns it into a professional
                workflow your customers can trust.
              </p>
            </div>
            {/* Animated stat row */}
            <div className="mt-8 flex flex-wrap gap-4">
              {[
                { value: "₹2.4Cr+", label: "Quotes generated" },
                { value: "98%", label: "Extraction accuracy" },
                { value: "<60s", label: "Quote turnaround" },
              ].map((stat) => (
                <div key={stat.value} className="animate-slide-up rounded-2xl border border-[#0f1a13]/10 bg-white/60 px-5 py-3 backdrop-blur">
                  <p className="font-display text-2xl font-black text-[#0f1a13]">{stat.value}</p>
                  <p className="font-mono mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#89918d]">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-2">
              <article className="overflow-hidden rounded-[30px] bg-[#17221d] p-7 text-white sm:p-10">
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#caff52]">
                        Speak naturally
                      </p>
                      <h3 className="mt-3 max-w-sm text-3xl font-extrabold tracking-[-0.04em]">
                        Hindi, English, Hinglish. Sab chalega.
                      </h3>
                    </div>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10">
                      <Icon name="mic" />
                    </span>
                  </div>
                  <div className="mt-14 rounded-[22px] bg-white/8 p-4">
                    <div className="flex items-center gap-4">
                      <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#caff52] text-[#17221d] shadow-md transition hover:scale-105">
                        <Icon name="play" className="ml-0.5 h-4 w-4" />
                      </button>
                      <div className="flex h-8 flex-1 items-end gap-1">
                        {[10, 17, 25, 13, 30, 22, 14, 27, 18, 10, 22, 31, 19, 12, 24, 15, 8].map(
                          (height, index) => (
                            <span
                              key={index}
                              className="animate-wave w-1 flex-1 rounded-full bg-[#caff52]"
                              style={{ height, animationDelay: `${(index * 0.07).toFixed(2)}s` }}
                            />
                          ),
                        )}
                      </div>
                      <span className="text-xs font-bold text-white/50">0:12</span>
                    </div>
                    <p className="mt-4 rounded-xl bg-black/15 p-3 text-sm leading-6 text-white/75">
                      “Teen room ki rewiring, do MCB box aur fitting labour add karna…”
                    </p>
                  </div>
                </div>
              </article>

              <div className="grid gap-5 sm:grid-cols-2">
                <article className="rounded-[30px] bg-[#caff52] p-7 sm:p-8">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#17221d] text-[#caff52]">
                    <Icon name="scan" />
                  </span>
                  <h3 className="mt-12 text-2xl font-extrabold tracking-[-0.04em]">
                    Any input.
                    <br />
                    Clean output.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#455027]">
                    Photos, slips and voice become structured line items.
                  </p>
                </article>
                <article className="rounded-[30px] bg-white p-7 sm:p-8">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eff2e9]">
                    <Icon name="file" />
                  </span>
                  <h3 className="mt-12 text-2xl font-extrabold tracking-[-0.04em]">
                    GST-ready
                    <br />
                    by default.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#69736e]">
                    Taxes, margins and rate cards handled automatically.
                  </p>
                </article>
                <article className="rounded-[30px] bg-[#d9ddd3] p-7 sm:col-span-2 sm:p-8">
                  <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6d7772]">
                        Smart follow-ups
                      </p>
                      <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">
                        Stop chasing. Start collecting.
                      </h3>
                    </div>
                    <div className="min-w-[205px] rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d6ff78]">
                          <Icon name="check" className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[10px] font-bold text-[#818985]">PAYMENT RECEIVED</p>
                          <p className="text-sm font-extrabold">₹41,347</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section id="privacy" className="bg-[#17221d] py-24 text-white sm:py-32">
          <div className="mx-auto grid max-w-[1120px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
            <div className="relative mx-auto aspect-square w-full max-w-[460px]">
              <div className="absolute inset-[8%] rounded-full border border-[#caff52]/15" />
              <div className="absolute inset-[20%] rounded-full border border-[#caff52]/25" />
              <div className="absolute inset-[32%] grid place-items-center rounded-full bg-[#caff52] text-[#17221d] shadow-[0_0_80px_rgba(202,255,82,0.2)]">
                <Icon name="lock" className="h-14 w-14" />
              </div>
              {[
                ["Rate cards", "left-[2%] top-[24%]"],
                ["Customer data", "right-0 top-[18%]"],
                ["Site photos", "bottom-[14%] left-[8%]"],
                ["Voice notes", "bottom-[9%] right-[3%]"],
              ].map(([label, position]) => (
                <span
                  key={label}
                  className={`absolute ${position} rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-bold text-white/65 backdrop-blur`}
                >
                  {label}
                </span>
              ))}
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#caff52]">
                Private by architecture
              </p>
              <h2 className="font-display mt-5 text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-6xl">
                Your business stays your business.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/55">
                DukaanPay runs on open-weight Gemma models and can process on
                your own machine. Sensitive rates, customer lists and photos
                never need to leave your control.
              </p>
              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {[
                  "Offline-capable AI",
                  "Open-source models",
                  "No data training",
                  "Local rate-card matching",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-bold">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#caff52]/12 text-[#caff52]">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="relative mx-auto max-w-[1160px] overflow-hidden rounded-[34px] bg-[#caff52] px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="cta-dots absolute inset-0 opacity-30" />
            {/* Morphing blobs inside CTA */}
            <div className="morph-bg pointer-events-none absolute -left-16 -top-16 h-48 w-48 bg-[#a8d93c]/40 blur-3xl" />
            <div className="morph-bg pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 bg-[#fff0aa]/60 blur-3xl [animation-delay:4s]" />
            <div className="relative mx-auto max-w-3xl">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#455027]">
                Your next quote is 60 seconds away
              </p>
              <h2 className="font-display mt-5 text-4xl font-black leading-[1] tracking-[-0.05em] sm:text-5xl">
                Ready to turn kaam into cash?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#455027] sm:text-lg">
                Upload a dukaan slip. Record a note. Send a professional quote before
                you&apos;ve even left the site.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#shopkeeper-auth"
                  className="shimmer-button group inline-flex items-center gap-2.5 rounded-full bg-[#0f1a13] px-7 py-3.5 text-sm font-bold text-white shadow-[0_14px_36px_rgba(15,26,19,0.25)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,26,19,0.35)]"
                >
                  <Icon name="store" className="h-4 w-4 text-[#caff52]" />
                  Sign in as Shopkeeper
                </a>
                <a
                  href="#technician-auth"
                  className="inline-flex items-center gap-2 rounded-full border border-[#0f1a13]/25 bg-white/90 px-7 py-3.5 text-sm font-extrabold text-[#0f1a13] hover:bg-white transition hover:-translate-y-1"
                >
                  <Icon name="mic" className="h-4 w-4 text-[#5f7a13]" />
                  Sign in as Technician
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#17221d]/10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-[#7b8580]">
              Built in India, for businesses that keep India moving.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-bold text-[#68726d]">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#privacy">Privacy</a>
            <a href="#shopkeeper-auth">Shopkeeper portal</a>
            <a href="#technician-auth">Technician portal</a>
          </div>
          <p className="text-xs text-[#8c9490]">© 2026 DukaanPay</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
