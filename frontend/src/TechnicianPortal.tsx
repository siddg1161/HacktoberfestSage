import { ChangeEvent, useEffect, useRef, useState } from "react";
import { api, QuoteResult } from "./api";

type CaptureIcon =
  | "arrow"
  | "camera"
  | "check"
  | "file"
  | "headphones"
  | "mic"
  | "stop"
  | "upload"
  | "x"
  | "sparkle"
  | "alert"
  | "external";

function CaptureIcon({
  name,
  className = "h-5 w-5",
}: {
  name: CaptureIcon;
  className?: string;
}) {
  const paths: Record<CaptureIcon, React.ReactNode> = {
    arrow: <path d="M19 12H5m6 6-6-6 6-6" />,
    camera: (
      <>
        <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    headphones: (
      <>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <path d="M18 19c0 1.1-.9 2-2 2h-1v-7h3a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2ZM6 19a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h3v7H8a2 2 0 0 1-2-2Z" />
      </>
    ),
    mic: (
      <>
        <rect width="8" height="13" x="8" y="2" rx="4" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
      </>
    ),
    stop: <rect width="10" height="10" x="7" y="7" rx="1" />,
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
      </>
    ),
    sparkle: (
      <path d="m12 3-1.2 3.1a7.5 7.5 0 0 1-4.3 4.3L3 12l3.5 1.6a7.5 7.5 0 0 1 4.3 4.3L12 21l1.2-3.1a7.5 7.5 0 0 1 4.3-4.3L21 12l-3.5-1.6a7.5 7.5 0 0 1-4.3-4.3Z" />
    ),
    alert: (
      <>
        <path d="M10.3 3.7 2.4 17.3A1.8 1.8 0 0 0 4 20h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.7a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    external: (
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <path d="M15 3h6v6" />
        <path d="m10 14 11-11" />
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

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#17221d] text-[#caff52]">
        <CaptureIcon name="file" className="h-5 w-5" />
      </span>
      <span className="text-[20px] font-extrabold tracking-[-0.04em]">
        parchi<span className="text-[#5f7a13]">pay</span>
      </span>
    </div>
  );
}

export default function TechnicianPortal() {
  const [parchi, setParchi] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | Blob | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [customer, setCustomer] = useState("Sharma Electricals");
  const [phone, setPhone] = useState("+91 98260 12345");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Live Browser Web Speech API state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(
    "Sharma ji ke flat ke liye 5 coil Finolex 2.5 sq mm red wire, 10 switch Anchor Roma ke, aur 5 conduit pipe PVC wale note kar lo."
  );
  const recognitionRef = useRef<any>(null);

  // Agent Pipeline Processing & Results
  const [status, setStatus] = useState<"ready" | "sending" | "sent">("ready");
  const [processingStep, setProcessingStep] = useState("");
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<"idle" | "approving" | "approved">("idle");
  const [dispatchedPortalUrl, setDispatchedPortalUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [techName] = useState(() => {
    return localStorage.getItem("parchipay_tech_name") || "Vikram Patel";
  });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const initials = techName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "VP";

  useEffect(() => {
    if (!parchi) {
      setImageUrl("");
      return;
    }
    const url = URL.createObjectURL(parchi);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [parchi]);

  useEffect(() => {
    if (!audio) {
      setAudioUrl("");
      return;
    }
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(
      () => setRecordingSeconds((seconds) => seconds + 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [recording]);

  // -----------------------------------------------------------------------
  // Browser Web Speech API for Live Hinglish Speech-to-Text
  // -----------------------------------------------------------------------
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN"; // Natively transcribes Hindi & Hinglish
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + " ";
        }
        setTranscript(fullTranscript.trim());
      };

      recognition.onerror = (e: any) => {
        console.warn("[SpeechRecognition Error]:", e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Speech Recognition start failed:", err);
      setIsListening(false);
    }
  };

  const chooseParchi = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setParchi(file);
      setStatus("ready");
    }
  };

  const chooseAudio = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudio(file);
      setStatus("ready");
    }
  };

  const toggleRecording = async () => {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudio(blob);
        setStatus("ready");
      };
      recorderRef.current = recorder;
      setRecordingSeconds(0);
      setRecording(true);
      recorder.start();
    } catch {
      document.getElementById("audio-file")?.click();
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // -----------------------------------------------------------------------
  // Send to QuoteFlow AI Backend Pipeline
  // -----------------------------------------------------------------------
  const sendForProcessing = async () => {
    if (status === "sending") return;

    setStatus("sending");
    setErrorMessage("");
    setProcessingStep("Node 1: Extracting handwritten parchi & Hinglish note (Gemma 4)...");

    // Sequential step tracker matching LangGraph execution order: Node 1 -> Node 2 -> Node 3
    const timers: any[] = [];
    timers.push(
      setTimeout(() => {
        setProcessingStep("Node 2: Checking 3-Tier warehouse stock & computing GST...");
      }, 3500)
    );
    timers.push(
      setTimeout(() => {
        setProcessingStep("Node 3: Auditing companion services & drafting restock POs...");
      }, 7500)
    );

    try {
      let slipImageBase64: string | undefined = undefined;
      if (parchi) {
        slipImageBase64 = await fileToBase64(parchi);
      }

      const result = await api.startQuote({
        client_name: customer,
        client_phone: phone,
        voice_transcript: transcript,
        slip_image: slipImageBase64,
      });

      timers.forEach((t) => clearTimeout(t));
      setProcessingStep("HITL Gate: Quoted items & restock POs ready for approval!");
      setQuoteResult(result);
      setStatus("sent");
    } catch (err: any) {
      timers.forEach((t) => clearTimeout(t));
      console.error("[Quote Generation Error]:", err);
      setErrorMessage(err.message || "Failed to process quote with AI Agent.");
      setStatus("ready");
    }
  };

  // -----------------------------------------------------------------------
  // Approve Quote & Dispatch to Customer
  // -----------------------------------------------------------------------
  const handleApproveAndDispatch = async () => {
    if (!quoteResult) return;
    setApprovalStatus("approving");
    try {
      const res = await api.approveQuote(quoteResult.threadId, {
        accept_quote: true,
        accept_addon: true,
        approve_po: true,
      });
      setDispatchedPortalUrl(res.clientPortalUrl);
      setApprovalStatus("approved");
    } catch (err: any) {
      alert("Approval error: " + err.message);
      setApprovalStatus("idle");
    }
  };

  const reset = () => {
    setParchi(null);
    setAudio(null);
    setCustomer("Sharma Electricals");
    setPhone("+91 98260 12345");
    setTranscript("");
    setQuoteResult(null);
    setApprovalStatus("idle");
    setDispatchedPortalUrl("");
    setErrorMessage("");
    setStatus("ready");
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#f4f5ef] text-[#17221d]">
      {/* Header */}
      <header className="border-b border-[#17221d]/8 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => {
              window.location.hash = "";
            }}
            className="flex items-center gap-4"
            aria-label="Back to home"
          >
            <span className="hidden h-9 w-9 place-items-center rounded-full border border-[#17221d]/10 text-[#66716b] sm:grid">
              <CaptureIcon name="arrow" className="h-4 w-4" />
            </span>
            <Brand />
          </button>
          <div className="flex items-center gap-3">
            <a
              href="#inventory"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#17221d]/15 bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#17221d] transition hover:bg-[#f4f5ef]"
            >
              📦 Warehouse & Stock
            </a>
            <button
              type="button"
              onClick={() => {
                window.location.hash = "#admin";
              }}
              className="mr-2 text-xs font-bold text-[#55615b] transition hover:text-[#17221d]"
            >
              Admin Dashboard →
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold">{techName}</p>
              <p className="text-[10px] font-semibold text-[#87908b]">Field technician</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d6ff78] text-sm font-extrabold">
              {initials}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#6a841d]">
              <span className="h-2 w-2 rounded-full bg-[#85a62e]" />
              New site visit
            </div>
            <h1 className="text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">
              Send your parchi & voice
            </h1>
            <p className="mt-2 text-sm text-[#69736e] sm:text-base">
              Snap a job slip or speak in Hinglish. QuoteFlow AI cross-references warehouse stock and generates the quote.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#77817c]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#17221d] text-[10px] text-white">
              1
            </span>
            Input slip
            <span className="mx-1 h-px w-6 bg-[#17221d]/15" />
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${
                status === "sent" ? "bg-[#17221d] text-white" : "bg-[#e0e3dc]"
              }`}
            >
              2
            </span>
            AI Quote & POs
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-[#ffebee] p-4 text-xs font-bold text-[#c62828] border border-[#ffcdd2]">
            <CaptureIcon name="alert" className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ======================================================================= */}
        {/* POST-PROCESSING VIEW: AI Quote Generated (Paused at HITL Gate)          */}
        {/* ======================================================================= */}
        {status === "sent" && quoteResult ? (
          <div className="space-y-6">
            <section className="rounded-[30px] border border-[#17221d]/8 bg-white p-6 shadow-[0_20px_60px_rgba(23,34,29,0.08)] sm:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#17221d]/8 pb-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d6ff78] px-3 py-1 text-xs font-extrabold text-[#3b4e0d]">
                    <CaptureIcon name="check" className="h-3.5 w-3.5" />
                    AI Extraction & 3-Tier Analysis Complete
                  </span>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">
                    Quotation Preview for {quoteResult.clientName}
                  </h2>
                  <p className="text-xs text-[#69736e]">
                    Thread: <span className="font-mono">{quoteResult.threadId}</span> · Phone: {quoteResult.clientPhone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-[#7a837e]">Grand Total (incl. GST)</p>
                  <p className="text-3xl font-black text-[#0284c7]">₹{Number(quoteResult.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* 3-Tier Inventory Quoted Items Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#17221d]/10 text-[11px] font-extrabold uppercase text-[#737d78]">
                      <th className="pb-3">Item Name</th>
                      <th className="pb-3 text-center">Qty</th>
                      <th className="pb-3 text-right">Rate</th>
                      <th className="pb-3 text-right">GST</th>
                      <th className="pb-3 text-right">Total</th>
                      <th className="pb-3 text-center">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17221d]/6">
                    {quoteResult.extractedItems.map((item, idx) => {
                      const tierBadge =
                        item.stock_tier === "HEALTHY"
                          ? "bg-[#ecfdf5] text-[#047857]"
                          : item.stock_tier === "THRESHOLD_WARNING"
                          ? "bg-[#fffbeb] text-[#b45309]"
                          : "bg-[#fef2f2] text-[#b91c1c]";

                      return (
                        <tr key={idx} className="hover:bg-[#fbfcf8]">
                          <td className="py-3.5 font-semibold text-[#17221d]">
                            {item.item_name}
                            <span className="block text-[11px] font-normal text-[#757f7a]">SKU: {item.sku_id}</span>
                          </td>
                          <td className="py-3.5 text-center font-bold">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-3.5 text-right font-medium">₹{Number(item.unit_price).toFixed(2)}</td>
                          <td className="py-3.5 text-right text-xs text-[#737d78]">
                            ₹{Number(item.gst_amount).toFixed(2)} ({item.gst_rate}%)
                          </td>
                          <td className="py-3.5 text-right font-bold text-[#17221d]">₹{Number(item.line_total).toFixed(2)}</td>
                          <td className="py-3.5 text-center">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${tierBadge}`}>
                              {item.stock_tier.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* AI Revenue Guard Callout */}
              {quoteResult.aiRevenueAlert && quoteResult.aiRevenueAlert.has_warning && (
                <div className="mt-6 rounded-2xl border border-[#fbbf24] bg-[#fffdf5] p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fef3c7] text-[#b45309]">
                      <CaptureIcon name="sparkle" className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-wider text-[#b45309]">
                          AI Revenue Guard Alert (Missed Ancillary Charges)
                        </p>
                        <span className="text-xs font-bold text-[#047857] bg-[#d1fae5] px-2 py-0.5 rounded">
                          +₹{Number(quoteResult.aiRevenueAlert.total_estimated_added_revenue).toFixed(2)} Recoverable
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#78350f]">{quoteResult.aiRevenueAlert.reason}</p>
                      <div className="mt-3 space-y-1.5">
                        {quoteResult.aiRevenueAlert.suggested_addons.map((addon, aIdx) => (
                          <div key={aIdx} className="flex items-center justify-between text-xs bg-white/70 p-2 rounded-lg border border-[#fef3c7]">
                            <span className="font-bold text-[#17221d]">
                              💡 {addon.suggested_item_name} (Qty: {addon.suggested_qty})
                            </span>
                            <span className="font-bold text-[#047857]">₹{Number(addon.line_total).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Autonomous Supplier Restock POs Drafts */}
              {quoteResult.restockPoDrafts && quoteResult.restockPoDrafts.length > 0 && (
                <div className="mt-6 rounded-2xl border border-[#93c5fd] bg-[#f0f9ff] p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
                      <CaptureIcon name="file" className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-wider text-[#1e40af]">
                        Autonomous Warehouse Restock POs ({quoteResult.restockPoDrafts.length} PO Drafts)
                      </p>
                      <p className="mt-0.5 text-xs text-[#3b82f6]">
                        Stock shortages detected. Purchase orders ready for 1-click warehouse restock dispatch.
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {quoteResult.restockPoDrafts.map((po, pIdx) => (
                          <div key={pIdx} className="rounded-xl bg-white p-3 border border-[#bfdbfe]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#17221d]">{po.supplier_name}</span>
                              <span className="rounded bg-[#fee2e2] px-1.5 py-0.5 text-[9px] font-extrabold text-[#991b1b]">
                                {po.urgency}
                              </span>
                            </div>
                            <ul className="mt-2 space-y-1 text-xs text-[#4b5563]">
                              {po.po_items.map((it, itIdx) => (
                                <li key={itIdx}>
                                  • {it.item_name} → Order Qty: <strong className="text-[#17221d]">{it.order_qty}</strong> (₹{it.line_total})
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval & Dispatch Action Card */}
              <div className="mt-8 border-t border-[#17221d]/8 pt-6">
                {approvalStatus === "approved" ? (
                  <div className="rounded-2xl bg-[#f0fdf4] border border-[#86efac] p-6 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#22c55e] text-white">
                      <CaptureIcon name="check" className="h-6 w-6" />
                    </span>
                    <h3 className="mt-3 text-lg font-extrabold text-[#15803d]">Quote Finalized & Dispatched!</h3>
                    <p className="mt-1 text-xs text-[#166534]">
                      Quote and supplier POs committed atomically to Neon PostgreSQL.
                    </p>
                    <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <a
                        href={`#portal/${quoteResult.threadId}`}
                        className="inline-flex items-center gap-2 rounded-full bg-[#15803d] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#166534]"
                      >
                        Open Customer Approval Portal <CaptureIcon name="external" className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={`http://localhost:5000/api/quotes/${quoteResult.threadId}/invoice`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[#15803d]/30 bg-white px-5 py-2.5 text-xs font-extrabold text-[#15803d] hover:bg-[#f0fdf4]"
                      >
                        🖨️ View GST Tax Invoice
                      </a>
                      <button
                        type="button"
                        onClick={reset}
                        className="rounded-full border border-[#17221d]/15 px-5 py-2.5 text-xs font-extrabold text-[#17221d] hover:bg-white"
                      >
                        + Create New Quote
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold">Ready to confirm and send quote?</p>
                      <p className="text-xs text-[#69736e]">
                        Approves quote, AI companion labor charges, and drafts warehouse POs.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={reset}
                        className="rounded-full border border-[#17221d]/15 px-5 py-3 text-xs font-extrabold text-[#17221d] hover:bg-[#f4f5ef]"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveAndDispatch}
                        disabled={approvalStatus === "approving"}
                        className="flex items-center gap-2 rounded-full bg-[#17221d] px-6 py-3 text-xs font-extrabold text-white transition hover:bg-[#25362e] disabled:opacity-50"
                      >
                        {approvalStatus === "approving" ? "Dispatching..." : "Approve & Dispatch Quote"}
                        <CaptureIcon name="arrow" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          /* ======================================================================= */
          /* CAPTURE FORM VIEW: Parchi Upload + Live Hinglish Voice Transcription    */
          /* ======================================================================= */
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="rounded-[28px] border border-[#17221d]/8 bg-white p-5 shadow-[0_12px_40px_rgba(23,34,29,0.05)] sm:p-8">
              {/* Customer Inputs */}
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold">Customer / Contractor Name</span>
                  <input
                    value={customer}
                    onChange={(event) => setCustomer(event.target.value)}
                    placeholder="e.g. Sharma Electricals"
                    className="h-12 w-full rounded-xl border border-[#17221d]/12 bg-[#fafbf8] px-4 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#a3aaa6] focus:border-[#789524] focus:ring-4 focus:ring-[#caff52]/25"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold">Customer Phone</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+91 98260 12345"
                    inputMode="tel"
                    className="h-12 w-full rounded-xl border border-[#17221d]/12 bg-[#fafbf8] px-4 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#a3aaa6] focus:border-[#789524] focus:ring-4 focus:ring-[#caff52]/25"
                  />
                </label>
              </div>

              <div className="my-8 h-px bg-[#17221d]/8" />

              {/* 1. Parchi Photo */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-[-0.02em]">
                      1. Upload or Snap Handwritten Parchi
                    </h2>
                    <p className="mt-1 text-xs text-[#79827d]">
                      Gemma 4 Multimodal vision will read items, quantities, and smudged writing
                    </p>
                  </div>
                  {parchi && (
                    <span className="flex items-center gap-1 rounded-full bg-[#eafaaf] px-2.5 py-1 text-[10px] font-extrabold text-[#536716]">
                      <CaptureIcon name="check" className="h-3 w-3" /> Photo Attached
                    </span>
                  )}
                </div>
                <input
                  id="parchi-file"
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={chooseParchi}
                />
                {parchi ? (
                  <div className="relative overflow-hidden rounded-2xl bg-[#e8e5dc]">
                    <img
                      src={imageUrl}
                      alt="Parchi preview"
                      className="h-64 w-full object-contain sm:h-72"
                    />
                    <button
                      type="button"
                      onClick={() => setParchi(null)}
                      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[#17221d]/80 text-white backdrop-blur"
                      aria-label="Remove parchi"
                    >
                      <CaptureIcon name="x" className="h-4 w-4" />
                    </button>
                    <label
                      htmlFor="parchi-file"
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 cursor-pointer whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-extrabold shadow-lg hover:bg-[#f4f5ef]"
                    >
                      Retake / Replace Photo
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="parchi-file"
                    className="group grid min-h-52 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-[#17221d]/15 bg-[#fafbf8] p-6 text-center transition hover:border-[#86a82c] hover:bg-[#f7fce9]"
                  >
                    <span>
                      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#d6ff78] transition group-hover:scale-105">
                        <CaptureIcon name="camera" className="h-5 w-5" />
                      </span>
                      <strong className="mt-3 block text-sm">Take photo or select parchi image</strong>
                      <span className="mt-1 block text-xs text-[#87908b]">
                        JPG, PNG, WebP · High-resolution OCR
                      </span>
                    </span>
                  </label>
                )}
              </div>

              <div className="my-8 h-px bg-[#17221d]/8" />

              {/* 2. Live Hinglish Voice Note & Speech-to-Text */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-[-0.02em]">
                      2. Hinglish Voice Note & Transcription
                    </h2>
                    <p className="mt-1 text-xs text-[#79827d]">
                      Tap the mic to speak in Hinglish or type directly. You can edit the text before sending!
                    </p>
                  </div>
                  {transcript && (
                    <span className="flex items-center gap-1 rounded-full bg-[#eafaaf] px-2.5 py-1 text-[10px] font-extrabold text-[#536716]">
                      <CaptureIcon name="check" className="h-3 w-3" /> Voice Note Ready
                    </span>
                  )}
                </div>

                {/* Voice Controls: Web Speech Mic + Audio Recorder */}
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  {/* Browser Web Speech Live Dictation */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`flex items-center justify-center gap-3 rounded-2xl border p-4 transition ${
                      isListening
                        ? "border-[#f43f5e] bg-[#fff1f2] animate-pulse"
                        : "border-[#17221d]/10 bg-[#fafbf8] hover:border-[#86a82c]"
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-full ${
                        isListening ? "bg-[#f43f5e] text-white" : "bg-[#d6ff78] text-[#17221d]"
                      }`}
                    >
                      <CaptureIcon name={isListening ? "stop" : "mic"} />
                    </span>
                    <span className="text-left">
                      <strong className="block text-sm">
                        {isListening ? "Listening... (Tap to stop)" : "Live Hinglish Mic"}
                      </strong>
                      <span className="block text-xs text-[#7c8580]">
                        {isListening ? "Speak naturally in Hindi/English" : "Browser Web Speech API"}
                      </span>
                    </span>
                  </button>

                  {/* Audio File / MediaRecorder Upload */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`flex flex-1 items-center justify-center gap-3 rounded-2xl border p-4 transition ${
                        recording ? "border-[#ff8c80] bg-[#fff0ed]" : "border-[#17221d]/10 bg-[#fafbf8]"
                      }`}
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e9ece4]">
                        <CaptureIcon name={recording ? "stop" : "headphones"} />
                      </span>
                      <span className="text-left">
                        <strong className="block text-sm">
                          {recording ? formatTime(recordingSeconds) : "Record Audio File"}
                        </strong>
                        <span className="block text-xs text-[#7c8580]">
                          {recording ? "Recording..." : "MediaRecorder"}
                        </span>
                      </span>
                    </button>
                    <input
                      id="audio-file"
                      className="sr-only"
                      type="file"
                      accept="audio/*"
                      onChange={chooseAudio}
                    />
                    <label
                      htmlFor="audio-file"
                      className="grid h-16 w-14 cursor-pointer place-items-center rounded-2xl border border-[#17221d]/10 bg-[#fafbf8] hover:bg-[#f2f4ed]"
                      title="Upload audio file"
                    >
                      <CaptureIcon name="upload" className="h-5 w-5 text-[#55615b]" />
                    </label>
                  </div>
                </div>

                {/* Editable Transcript Text Area (Technician can review & correct!) */}
                <div className="rounded-2xl border border-[#17221d]/12 bg-[#fafbf8] p-4 focus-within:border-[#789524] focus-within:ring-4 focus-within:ring-[#caff52]/25">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#68736d]">
                    <span>✏️ Editable Transcription / Note:</span>
                    {transcript && (
                      <button
                        type="button"
                        onClick={() => setTranscript("")}
                        className="text-[#991b1b] hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Transcription appears here in real time. You can also type corrections or extra instructions directly..."
                    className="w-full bg-transparent text-sm font-medium text-[#17221d] outline-none placeholder:font-normal placeholder:text-[#a0a8a3] resize-none"
                  />
                  {isListening && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-[#e11d48]">
                      <span className="h-2 w-2 rounded-full bg-[#e11d48] animate-ping" />
                      Listening in Hinglish... speak item names and quantities
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Sidebar / Ready to send */}
            <aside className="self-start lg:sticky lg:top-6">
              <div className="rounded-[26px] bg-[#17221d] p-6 text-white">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#caff52]">
                  Ready to send?
                </p>
                <h2 className="mt-3 text-xl font-extrabold tracking-[-0.03em]">
                  Job package
                </h2>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-white/7 p-3">
                    <span className="flex items-center gap-3 text-xs font-bold text-white/70">
                      <CaptureIcon name="camera" className="h-4 w-4" />
                      Parchi photo
                    </span>
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full ${
                        parchi ? "bg-[#caff52] text-[#17221d]" : "border border-white/20"
                      }`}
                    >
                      {parchi && <CaptureIcon name="check" className="h-3 w-3" />}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/7 p-3">
                    <span className="flex items-center gap-3 text-xs font-bold text-white/70">
                      <CaptureIcon name="mic" className="h-4 w-4" />
                      Hinglish Voice Note
                    </span>
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full ${
                        transcript || audio ? "bg-[#caff52] text-[#17221d]" : "border border-white/20"
                      }`}
                    >
                      {(transcript || audio) && <CaptureIcon name="check" className="h-3 w-3" />}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={(!parchi && !transcript) || status === "sending"}
                  onClick={sendForProcessing}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#caff52] px-5 py-4 text-sm font-extrabold text-[#17221d] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {status === "sending" ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-[#17221d] border-t-transparent animate-spin" />
                      Processing with Gemma 4...
                    </span>
                  ) : (
                    <>
                      Generate AI Quote
                      <CaptureIcon name="upload" className="h-4 w-4" />
                    </>
                  )}
                </button>

                {status === "sending" && (
                  <p className="mt-3 text-center text-[11px] font-bold text-[#caff52] animate-pulse">
                    {processingStep}
                  </p>
                )}

                <p className="mt-4 text-center text-[10px] leading-4 text-white/40">
                  Multimodal extraction runs on Google Gemma 4. Stock checked against Neon DB.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-[#17221d]/8 bg-white p-5">
                <p className="text-xs font-extrabold">💡 Voice Note Tip</p>
                <p className="mt-2 text-xs leading-5 text-[#75807a]">
                  Say: <em>&ldquo;5 coil Finolex wire, 10 Anchor Roma switch aur 5 conduit pipe note kar lo&rdquo;</em>.
                  QuoteFlow AI automatically converts it to GST catalog items.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
