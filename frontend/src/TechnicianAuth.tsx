import { FormEvent, useState } from "react";
import { api } from "./api";
import { authClient } from "./auth-client";
import { setActiveWorker, setActiveBusiness, useActiveWorker } from "./businessContext";

type AuthIcon = "arrow" | "check" | "eye" | "eyeOff" | "file" | "store" | "lock" | "sparkle";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: AuthIcon;
  className?: string;
}) {
  const paths: Record<AuthIcon, React.ReactNode> = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.3A9.8 9.8 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.1 3.2M6.6 6.6C3.7 8.5 2 12 2 12s3.5 8 10 8a9.7 9.7 0 0 0 4.2-.9" />
      </>
    ),
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
    sparkle: (
      <>
        <path d="m12 3-1.2 3.1a7.5 7.5 0 0 1-4.3 4.3L3 12l3.5 1.6a7.5 7.5 0 0 1 4.3 4.3L12 21l1.2-3.1a7.5 7.5 0 0 1 4.3-4.3L21 12l-3.5-1.6a7.5 7.5 0 0 1-4.3-4.3Z" />
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

export default function TechnicianAuth({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { worker: activeWorker, logoutWorker } = useActiveWorker();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const switchMode = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Please enter your technician email address.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!password || password.trim().length < 4) {
      setError("Please enter your 4-digit PIN or password (at least 4 characters).");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await api.technicianSignup({
          name: name.trim(),
          email: email.trim(),
          pin_code: password.trim(),
        });
        if (password.length >= 8) {
          try {
            await authClient.signUp.email({
              name: name.trim(),
              email: email.trim(),
              password: password.trim(),
            });
          } catch {
            // Non-blocking background registration
          }
        }
        setActiveWorker(result.worker);
        setActiveBusiness(result.business);
        onSuccess();
      } else {
        try {
          const result = await api.workerLogin(email.trim(), password.trim());
          setActiveWorker(result.worker);
          setActiveBusiness(result.business);
          onSuccess();
          return;
        } catch (workerErr: any) {
          // If technician PIN check fails and length >= 8, try Better Auth account
          if (password.length >= 8) {
            const { error: authError } = await authClient.signIn.email({
              email: email.trim(),
              password: password.trim(),
            });
            if (!authError) {
              const workspace = await api.getMyWorkspace();
              setActiveWorker(workspace.worker);
              setActiveBusiness(workspace.business);
              onSuccess();
              return;
            }
          }
          throw new Error(workerErr.message || "Incorrect technician email address or PIN.");
        }
      }
    } catch (err: any) {
      setError(err.message || "We could not sign you in. Check your email and PIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5ef] text-[#17221d]">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => {
              window.location.hash = "";
            }}
            className="flex items-center gap-2.5"
            aria-label="Back to home"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0f1a13] text-[#caff52] shadow-md transition hover:scale-105">
              <Icon name="store" className="h-5 w-5" />
            </span>
            <span className="font-display text-[19px] font-black tracking-[-0.05em]">
              dukaan<span className="text-[#6a841d]">pay</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.hash = "";
            }}
            className="text-xs font-extrabold text-[#64706a] hover:text-[#17221d]"
          >
            Back to website
          </button>
        </div>
      </header>

      <main className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-[#17221d] px-12 pb-14 pt-32 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="auth-grid absolute inset-0 opacity-30" />
          <div className="absolute -left-28 top-1/3 h-80 w-80 rounded-full bg-[#caff52]/15 blur-3xl" />
          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70">
              <Icon name="sparkle" className="h-3.5 w-3.5 text-[#caff52]" />
              Technician workspace
            </span>
            <h1 className="font-display mt-7 text-5xl font-black leading-[1.02] tracking-[-0.05em] xl:text-6xl">
              Finish the visit.
              <br />
              Send the dukaan slip.
              <br />
              <span className="text-[#caff52]">We&apos;ll do the rest.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/55">
              Capture job details while they&apos;re fresh. Your office gets
              everything needed to prepare an accurate quote.
            </p>
          </div>

          <div className="relative max-w-lg rounded-[26px] border border-white/10 bg-white/7 p-5 backdrop-blur">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#caff52] text-[#17221d]">
                <Icon name="check" className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-extrabold">Today&apos;s work, neatly captured</p>
                <p className="mt-1 text-xs text-white/45">
                  12 field jobs submitted by the team
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 pb-12 pt-28 sm:px-8 lg:pt-24">
          <div className="w-full max-w-[440px]">
            <div className="lg:hidden">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e8eddf] px-3 py-2 text-xs font-extrabold text-[#5f741e]">
                <Icon name="lock" className="h-3.5 w-3.5" />
                Technician access
              </span>
            </div>
            <p className="font-mono hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[#6a841d] lg:block">
              Technician access
            </p>
            <h2 className="font-display mt-4 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              {mode === "login" ? "Welcome back" : "Join your field team"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#707a75]">
              {mode === "login"
                ? "Sign in to send a new dukaan slip and voice note."
                : "Create your technician account to start submitting jobs."}
            </p>

            {activeWorker && (
              <div className="mt-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/80 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white font-black text-base shadow-sm">
                      {activeWorker.name?.charAt(0) || "T"}
                    </span>
                    <div>
                      <span className="inline-block rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">
                        Active Technician Session
                      </span>
                      <p className="font-extrabold text-[#17221d] text-base">{activeWorker.name}</p>
                      <p className="text-xs text-[#55615b] font-mono">{activeWorker.email}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => onSuccess()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#17221d] px-4 py-2.5 text-xs font-black text-[#caff52] hover:bg-neutral-800 transition shadow-sm"
                  >
                    <span>Resume Technician Portal</span>
                    <Icon name="arrow" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => logoutWorker()}
                    className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                  >
                    Switch Account
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-2 rounded-xl bg-[#e9ebe5] p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-lg py-3 text-xs font-extrabold transition ${
                  mode === "login" ? "bg-white shadow-sm" : "text-[#75807a]"
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-lg py-3 text-xs font-extrabold transition ${
                  mode === "signup" ? "bg-white shadow-sm" : "text-[#75807a]"
                }`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-5">
              {mode === "signup" && (
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold">Full name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Vikram Patel"
                    autoComplete="name"
                    className="h-12 w-full rounded-xl border border-[#17221d]/12 bg-white px-4 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#a3aaa6] focus:border-[#789524] focus:ring-4 focus:ring-[#caff52]/25"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold">
                  Technician Email Address *
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="e.g. sameer@sharmaelectricals.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-[#17221d]/12 bg-white px-4 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#a3aaa6] focus:border-[#789524] focus:ring-4 focus:ring-[#caff52]/25"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between text-xs font-extrabold">
                  {mode === "login" ? "4-Digit PIN or Password *" : "Create 4-Digit PIN or Password *"}
                </span>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={4}
                    placeholder="e.g. 1234"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="h-12 w-full rounded-xl border border-[#17221d]/12 bg-white px-4 pr-12 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#a3aaa6] focus:border-[#789524] focus:ring-4 focus:ring-[#caff52]/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-0 top-0 grid h-12 w-12 place-items-center text-[#7a847f]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon
                      name={showPassword ? "eyeOff" : "eye"}
                      className="h-4 w-4"
                    />
                  </button>
                </div>
              </label>

              {/* Quick Fill Demo / Instructions */}
              <div className="rounded-xl border border-[#17221d]/8 bg-[#f8f9f5] p-3 text-xs text-[#525f58]">
                <p className="font-bold text-[#17221d]">💡 Technician Access:</p>
                <p className="mt-0.5 text-[11px] text-[#6d7973]">
                  Use the email and 4-digit PIN given to you by your shopkeeper.
                </p>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("sameer@sharmaelectricals.com");
                      setPassword("1234");
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#35520e] border border-[#17221d]/10 hover:bg-[#eaf5cc] transition"
                  >
                    ⚡ Auto-fill Demo Tech (Sameer Khan / 1234)
                  </button>
                )}
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-[#ffe7e3] px-4 py-3 text-xs font-bold text-[#9c3d34]"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#17221d] px-5 py-4 text-sm font-extrabold text-white shadow-lg transition enabled:hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="loader h-4 w-4 rounded-full border-2 border-white/20 border-t-white" />
                    {mode === "login" ? "Signing in…" : "Creating account…"}
                  </>
                ) : (
                  <>
                    {mode === "login" ? "Log in to workspace" : "Create technician account"}
                    <Icon
                      name="arrow"
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

            </form>

            <div className="mt-7 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#8a928e]">
              <Icon name="lock" className="h-3.5 w-3.5" />
              Secure technician-only workspace
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
