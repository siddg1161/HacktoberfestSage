import { ChangeEvent, useEffect, useRef, useState } from "react";
import { api, QuoteResult, CatalogItem, ExtractedItem, RestockPoDraft } from "./api";
import { useActiveBusiness, getActiveWorker, setActiveWorker } from "./businessContext";

type CaptureIcon =
  | "arrow"
  | "camera"
  | "check"
  | "file"
  | "store"
  | "headphones"
  | "mic"
  | "stop"
  | "upload"
  | "x"
  | "sparkle"
  | "alert"
  | "external"
  | "plus"
  | "minus"
  | "trash"
  | "edit";

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
    store: (
      <>
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
        <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 10V7" />
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
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    edit: <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
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
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0f1a13] text-[#caff52] shadow-md transition hover:scale-105">
        <CaptureIcon name="store" className="h-5 w-5" />
      </span>
      <span className="font-display text-[19px] font-black tracking-[-0.05em]">
        dukaan<span className="text-[#6a841d]">pay</span>
      </span>
    </div>
  );
}

export default function TechnicianPortal() {
  const [dukaanSlip, setDukaanSlip] = useState<File | null>(null);
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

  // Human Edit States
  const [catalogList, setCatalogList] = useState<CatalogItem[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCatalogSku, setSelectedCatalogSku] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState(100);
  const [customUnit, setCustomUnit] = useState("piece");

  // Purchase Order Review & Edit Modal States
  const [editingPoIndex, setEditingPoIndex] = useState<number | null>(null);
  const [poEditForm, setPoEditForm] = useState<RestockPoDraft | null>(null);
  const [newPoItemName, setNewPoItemName] = useState("");
  const [newPoItemQty, setNewPoItemQty] = useState(1);
  const [newPoItemPrice, setNewPoItemPrice] = useState(100);

  // Natural Language Refinement Loop States
  const [refinePrompt, setRefinePrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState<string | null>(null);

  const { business: activeBiz } = useActiveBusiness();
  const activeWorker = getActiveWorker();

  const [techName] = useState(() => {
    return activeWorker?.name || localStorage.getItem("dukaanpay_tech_name") || "Sameer Khan";
  });
  const workerRole = activeWorker?.role || "Field Specialist";
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const initials = techName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SK";

  useEffect(() => {
    if (!dukaanSlip) {
      setImageUrl("");
      return;
    }
    const url = URL.createObjectURL(dukaanSlip);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [dukaanSlip]);

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

  const chooseDukaanSlip = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDukaanSlip(file);
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
    setProcessingStep("Node 1: Extracting handwritten dukaan slip & Hinglish note (Gemma 4)...");

    // Sequential step tracker matching LangGraph execution order: Node 1 -> Node 2 -> Node 3
    const timers: any[] = [];
    timers.push(
      setTimeout(() => {
        setProcessingStep("Node 2: Matching catalog rates & computing GST...");
      }, 3500)
    );
    timers.push(
      setTimeout(() => {
        setProcessingStep("Node 3: Auditing companion services & preparing quote draft...");
      }, 7500)
    );

    try {
      let slipImageBase64: string | undefined = undefined;
      if (dukaanSlip) {
        slipImageBase64 = await fileToBase64(dukaanSlip);
      }

      const result = await api.startQuote({
        client_name: customer,
        client_phone: phone,
        voice_transcript: transcript,
        slip_image: slipImageBase64,
        business_name: activeBiz.business_name,
        business_category: activeBiz.industry,
        worker_name: techName,
        currency_symbol: activeBiz.currency_symbol || "₹",
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
      const acceptedAddonSkus = quoteResult.extractedItems
        .filter((it) => it.is_ai_suggested && it.sku_id)
        .map((it) => it.sku_id);

      const res = await api.approveQuote(quoteResult.threadId, {
        accept_quote: true,
        accept_addon: acceptedAddonSkus.length > 0,
        approve_po: true,
        edited_line_items: quoteResult.extractedItems,
        edited_po_drafts: quoteResult.restockPoDrafts,
        accepted_addon_skus: acceptedAddonSkus,
      });
      setDispatchedPortalUrl(res.clientPortalUrl);
      setApprovalStatus("approved");
    } catch (err: any) {
      alert("Approval error: " + err.message);
      setApprovalStatus("idle");
    }
  };

  // -----------------------------------------------------------------------
  // Natural Language Refinement Loop Handler
  // -----------------------------------------------------------------------
  const handleRefineQuote = async (customInstruction?: string) => {
    const text = (customInstruction || refinePrompt).trim();
    if (!text || !quoteResult) return;
    setIsRefining(true);
    setRefineFeedback(null);
    try {
      const updated = await api.refineQuote(quoteResult.threadId, text);
      setQuoteResult(updated);
      setRefinePrompt("");
      setRefineFeedback(
        updated.refinementExplanation ||
        "Quotation successfully re-drafted and inventory/GST recalculated!"
      );
    } catch (err: any) {
      alert("Refinement failed: " + (err.message || err));
    } finally {
      setIsRefining(false);
    }
  };

  useEffect(() => {
    api.getCatalog(activeBiz.industry)
      .then((cat) => {
        if (Array.isArray(cat)) setCatalogList(cat);
        else if ((cat as any)?.data) setCatalogList((cat as any).data);
      })
      .catch(console.error);
  }, [activeBiz.industry]);

  // Update item quantity directly from row and recalculate live
  const handleUpdateQty = (index: number, newQty: number) => {
    if (!quoteResult) return;
    const qty = Math.max(1, newQty);
    const updated = [...quoteResult.extractedItems];
    const target = { ...updated[index] };
    target.quantity = qty;

    const lineSub = Math.round(qty * Number(target.unit_price) * 100) / 100;
    const gstRate = Number(target.gst_rate) || 18.0;
    target.gst_amount = Math.round(lineSub * (gstRate / 100) * 100) / 100;
    target.line_total = Math.round((lineSub + target.gst_amount) * 100) / 100;

    // Real-time 3-tier stock badge recalculation
    const curStock = (target as any).current_stock ?? 10;
    const reorderThresh = (target as any).reorder_threshold ?? 5;
    if (qty > curStock) {
      target.stock_tier = "INSTANT_DEFICIT";
    } else if (curStock - qty < reorderThresh) {
      target.stock_tier = "THRESHOLD_WARNING";
    } else {
      target.stock_tier = "HEALTHY";
    }

    updated[index] = target;

    const subtotal = Math.round(updated.reduce((sum, it) => sum + it.quantity * it.unit_price, 0) * 100) / 100;
    const gstTotal = Math.round(updated.reduce((sum, it) => sum + Number(it.gst_amount), 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstTotal) * 100) / 100;

    setQuoteResult({
      ...quoteResult,
      extractedItems: updated,
      subtotal,
      gstTotal,
      grandTotal,
    });
  };

  // Update item rate directly from row and recalculate live
  const handleUpdatePrice = (index: number, newPrice: number) => {
    if (!quoteResult) return;
    const price = Math.max(0, newPrice);
    const updated = [...quoteResult.extractedItems];
    const target = { ...updated[index] };
    target.unit_price = price;

    const lineSub = Math.round(target.quantity * price * 100) / 100;
    const gstRate = Number(target.gst_rate) || 18.0;
    target.gst_amount = Math.round(lineSub * (gstRate / 100) * 100) / 100;
    target.line_total = Math.round((lineSub + target.gst_amount) * 100) / 100;

    updated[index] = target;

    const subtotal = Math.round(updated.reduce((sum, it) => sum + it.quantity * it.unit_price, 0) * 100) / 100;
    const gstTotal = Math.round(updated.reduce((sum, it) => sum + Number(it.gst_amount), 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstTotal) * 100) / 100;

    setQuoteResult({
      ...quoteResult,
      extractedItems: updated,
      subtotal,
      gstTotal,
      grandTotal,
    });
  };

  // Remove an item row
  const handleRemoveItem = (index: number) => {
    if (!quoteResult) return;
    const updated = quoteResult.extractedItems.filter((_, i) => i !== index);
    const subtotal = Math.round(updated.reduce((sum, it) => sum + it.quantity * it.unit_price, 0) * 100) / 100;
    const gstTotal = Math.round(updated.reduce((sum, it) => sum + Number(it.gst_amount), 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstTotal) * 100) / 100;

    setQuoteResult({
      ...quoteResult,
      extractedItems: updated,
      subtotal,
      gstTotal,
      grandTotal,
    });
  };

  // Add catalog item or custom item to quotation
  const handleAddCatalogItem = () => {
    if (!quoteResult) return;
    const catItem = catalogList.find((c) => c.sku_id === selectedCatalogSku);
    if (!catItem && !customItemName) return;

    const qty = Math.max(1, customQty);
    const price = catItem ? Number(catItem.unit_price) : customPrice;
    const gstRate = catItem ? Number(catItem.gst_rate) : 18.0;
    const lineSub = Math.round(qty * price * 100) / 100;
    const gstAmt = Math.round(lineSub * (gstRate / 100) * 100) / 100;
    const lineTot = Math.round((lineSub + gstAmt) * 100) / 100;

    const curStock = catItem ? Number(catItem.current_stock) : 10;
    const reorderThresh = catItem ? Number(catItem.reorder_threshold) : 5;
    let tier: "HEALTHY" | "THRESHOLD_WARNING" | "INSTANT_DEFICIT" = "HEALTHY";
    if (qty > curStock) tier = "INSTANT_DEFICIT";
    else if (curStock - qty < reorderThresh) tier = "THRESHOLD_WARNING";

    const newItem: ExtractedItem = {
      sku_id: catItem ? catItem.sku_id : `CUSTOM-${Date.now().toString().slice(-4)}`,
      item_name: catItem ? catItem.item_name : customItemName,
      quantity: qty,
      unit: catItem ? catItem.unit : customUnit,
      unit_price: price,
      gst_rate: gstRate,
      gst_amount: gstAmt,
      line_total: lineTot,
      stock_tier: tier,
      is_ai_suggested: false,
    };

    const updated = [...quoteResult.extractedItems, newItem];
    const subtotal = Math.round(updated.reduce((sum, it) => sum + it.quantity * it.unit_price, 0) * 100) / 100;
    const gstTotal = Math.round(updated.reduce((sum, it) => sum + Number(it.gst_amount), 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstTotal) * 100) / 100;

    setQuoteResult({
      ...quoteResult,
      extractedItems: updated,
      subtotal,
      gstTotal,
      grandTotal,
    });

    setShowAddItem(false);
    setSelectedCatalogSku("");
    setCustomItemName("");
    setCustomQty(1);
  };

  // Save edits to LangGraph state checkpoint & Neon DB without approving yet
  const handleSaveDraftEdits = async () => {
    if (!quoteResult) return;
    setIsSavingEdit(true);
    setEditSuccessMsg("");
    try {
      await api.editQuote(quoteResult.threadId, quoteResult.extractedItems);
      setEditSuccessMsg("Quotation edits saved to state & database!");
      setTimeout(() => setEditSuccessMsg(""), 3500);
    } catch (err: any) {
      alert("Save edit error: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // -----------------------------------------------------------------------
  // AI Revenue Guard Addon Handlers
  // -----------------------------------------------------------------------
  const isAddonInQuote = (addonSku: string, addonName: string) => {
    if (!quoteResult) return false;
    return quoteResult.extractedItems.some(
      (it) => it.sku_id === addonSku || (it.is_ai_suggested && it.item_name === addonName)
    );
  };

  const handleUpdateAddonQty = (addonIdx: number, newQty: number) => {
    if (!quoteResult?.aiRevenueAlert?.suggested_addons) return;
    const qty = Math.max(1, newQty);
    const updatedAlert = { ...quoteResult.aiRevenueAlert };
    const addons = [...updatedAlert.suggested_addons];
    const target = { ...addons[addonIdx] };
    target.suggested_qty = qty;
    target.line_total = Math.round(qty * Number(target.unit_price) * 1.18 * 100) / 100;
    addons[addonIdx] = target;
    updatedAlert.suggested_addons = addons;
    updatedAlert.total_estimated_added_revenue = Math.round(
      addons.reduce((sum, a) => sum + Number(a.line_total), 0) * 100
    ) / 100;

    let updatedExtracted = [...quoteResult.extractedItems];
    const existingIdx = updatedExtracted.findIndex(
      (it) => it.sku_id === target.suggested_sku_id || (it.is_ai_suggested && it.item_name === target.suggested_item_name)
    );
    if (existingIdx !== -1) {
      const it = { ...updatedExtracted[existingIdx] };
      it.quantity = qty;
      const lineSub = Math.round(qty * Number(it.unit_price) * 100) / 100;
      it.gst_amount = Math.round(lineSub * (Number(it.gst_rate) / 100) * 100) / 100;
      it.line_total = Math.round((lineSub + it.gst_amount) * 100) / 100;
      updatedExtracted[existingIdx] = it;
    }

    const subtotal = Math.round(updatedExtracted.reduce((sum, it) => sum + it.quantity * it.unit_price, 0) * 100) / 100;
    const gstTotal = Math.round(updatedExtracted.reduce((sum, it) => sum + Number(it.gst_amount), 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstTotal) * 100) / 100;

    setQuoteResult({
      ...quoteResult,
      aiRevenueAlert: updatedAlert,
      extractedItems: updatedExtracted,
      subtotal,
      gstTotal,
      grandTotal,
    });
  };

  const handleUpdateAddonPrice = (addonIdx: number, newPrice: number) => {
    if (!quoteResult?.aiRevenueAlert?.suggested_addons) return;
    const price = Math.max(0, newPrice);
    const updatedAlert = { ...quoteResult.aiRevenueAlert };
    const addons = [...updatedAlert.suggested_addons];
    const target = { ...addons[addonIdx] };
    target.unit_price = price;
    target.line_total = Math.round(target.suggested_qty * price * 1.18 * 100) / 100;
    addons[addonIdx] = target;
    updatedAlert.suggested_addons = addons;
    updatedAlert.total_estimated_added_revenue = Math.round(
      addons.reduce((sum, a) => sum + Number(a.line_total), 0) * 100
    ) / 100;

    let updatedExtracted = [...quoteResult.extractedItems];
    const existingIdx = updatedExtracted.findIndex(
      (it) => it.sku_id === target.suggested_sku_id || (it.is_ai_suggested && it.item_name === target.suggested_item_name)
    );
    if (existingIdx !== -1) {
      const it = { ...updatedExtracted[existingIdx] };
      it.unit_price = price;
      const lineSub = Math.round(it.quantity * price * 100) / 100;
      it.gst_amount = Math.round(lineSub * (Number(it.gst_rate) / 100) * 100) / 100;
      it.line_total = Math.round((lineSub + it.gst_amount) * 100) / 100;
      updatedExtracted[existingIdx] = it;
    }

    const subtotal = Math.round(updatedExtracted.reduce((sum, it) => sum + it.quantity * it.unit_price, 0) * 100) / 100;
    const gstTotal = Math.round(updatedExtracted.reduce((sum, it) => sum + Number(it.gst_amount), 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstTotal) * 100) / 100;

    setQuoteResult({
      ...quoteResult,
      aiRevenueAlert: updatedAlert,
      extractedItems: updatedExtracted,
      subtotal,
      gstTotal,
      grandTotal,
    });
  };

  const handleToggleAddonToQuote = (addonIdx: number) => {
    if (!quoteResult?.aiRevenueAlert?.suggested_addons) return;
    const addon = quoteResult.aiRevenueAlert.suggested_addons[addonIdx];
    const alreadyIn = isAddonInQuote(addon.suggested_sku_id, addon.suggested_item_name);

    let updatedExtracted: ExtractedItem[];
    if (alreadyIn) {
      updatedExtracted = quoteResult.extractedItems.filter(
        (it) => !(it.sku_id === addon.suggested_sku_id || (it.is_ai_suggested && it.item_name === addon.suggested_item_name))
      );
    } else {
      const qty = addon.suggested_qty || 1;
      const price = addon.unit_price || 150;
      const lineSub = Math.round(qty * price * 100) / 100;
      const gstAmt = Math.round(lineSub * 0.18 * 100) / 100;
      const lineTot = Math.round((lineSub + gstAmt) * 100) / 100;

      const newItem: ExtractedItem = {
        sku_id: addon.suggested_sku_id,
        item_name: addon.suggested_item_name,
        quantity: qty,
        unit: "service",
        unit_price: price,
        gst_rate: 18.0,
        gst_amount: gstAmt,
        line_total: lineTot,
        stock_tier: "HEALTHY",
        deficit_qty: 0,
        is_ai_suggested: true,
      };
      updatedExtracted = [...quoteResult.extractedItems, newItem];
    }

    const subtotal = Math.round(updatedExtracted.reduce((sum, it) => sum + it.quantity * it.unit_price, 0) * 100) / 100;
    const gstTotal = Math.round(updatedExtracted.reduce((sum, it) => sum + Number(it.gst_amount), 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstTotal) * 100) / 100;

    setQuoteResult({
      ...quoteResult,
      extractedItems: updatedExtracted,
      subtotal,
      gstTotal,
      grandTotal,
    });
  };

  const handleAddAllAddons = () => {
    if (!quoteResult?.aiRevenueAlert?.suggested_addons) return;
    let updatedExtracted = [...quoteResult.extractedItems];

    for (const addon of quoteResult.aiRevenueAlert.suggested_addons) {
      const alreadyIn = updatedExtracted.some(
        (it) => it.sku_id === addon.suggested_sku_id || (it.is_ai_suggested && it.item_name === addon.suggested_item_name)
      );
      if (!alreadyIn) {
        const qty = addon.suggested_qty || 1;
        const price = addon.unit_price || 150;
        const lineSub = Math.round(qty * price * 100) / 100;
        const gstAmt = Math.round(lineSub * 0.18 * 100) / 100;
        const lineTot = Math.round((lineSub + gstAmt) * 100) / 100;

        updatedExtracted.push({
          sku_id: addon.suggested_sku_id,
          item_name: addon.suggested_item_name,
          quantity: qty,
          unit: "service",
          unit_price: price,
          gst_rate: 18.0,
          gst_amount: gstAmt,
          line_total: lineTot,
          stock_tier: "HEALTHY",
          deficit_qty: 0,
          is_ai_suggested: true,
        });
      }
    }

    const subtotal = Math.round(updatedExtracted.reduce((sum, it) => sum + it.quantity * it.unit_price, 0) * 100) / 100;
    const gstTotal = Math.round(updatedExtracted.reduce((sum, it) => sum + Number(it.gst_amount), 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstTotal) * 100) / 100;

    setQuoteResult({
      ...quoteResult,
      extractedItems: updatedExtracted,
      subtotal,
      gstTotal,
      grandTotal,
    });
  };

  // -----------------------------------------------------------------------
  // Purchase Order Review & Edit Modal Handlers
  // -----------------------------------------------------------------------
  const handleOpenPoModal = (poIndex: number) => {
    if (!quoteResult?.restockPoDrafts) return;
    setEditingPoIndex(poIndex);
    setPoEditForm(JSON.parse(JSON.stringify(quoteResult.restockPoDrafts[poIndex])));
    setNewPoItemName("");
    setNewPoItemQty(1);
    setNewPoItemPrice(100);
  };

  const handleClosePoModal = () => {
    setEditingPoIndex(null);
    setPoEditForm(null);
  };

  const handleUpdatePoItemQty = (itemIndex: number, newQty: number) => {
    if (!poEditForm) return;
    const qty = Math.max(1, newQty);
    const updatedItems = [...poEditForm.po_items];
    const target = { ...updatedItems[itemIndex] };
    target.order_qty = qty;
    target.line_total = Math.round(qty * Number(target.unit_price) * 100) / 100;
    updatedItems[itemIndex] = target;
    setPoEditForm({ ...poEditForm, po_items: updatedItems });
  };

  const handleUpdatePoItemPrice = (itemIndex: number, newPrice: number) => {
    if (!poEditForm) return;
    const price = Math.max(0, newPrice);
    const updatedItems = [...poEditForm.po_items];
    const target = { ...updatedItems[itemIndex] };
    target.unit_price = price;
    target.line_total = Math.round(Number(target.order_qty) * price * 100) / 100;
    updatedItems[itemIndex] = target;
    setPoEditForm({ ...poEditForm, po_items: updatedItems });
  };

  const handleRemovePoItem = (itemIndex: number) => {
    if (!poEditForm) return;
    const updatedItems = poEditForm.po_items.filter((_, i) => i !== itemIndex);
    setPoEditForm({ ...poEditForm, po_items: updatedItems });
  };

  const handleAddPoItem = () => {
    if (!poEditForm || !newPoItemName.trim()) return;
    const qty = Math.max(1, newPoItemQty);
    const price = Math.max(0, newPoItemPrice);
    const newItem = {
      sku_id: `SKU-RESTOCK-${Date.now().toString().slice(-4)}`,
      item_name: newPoItemName.trim(),
      order_qty: qty,
      unit_price: price,
      line_total: Math.round(qty * price * 100) / 100,
    };
    setPoEditForm({
      ...poEditForm,
      po_items: [...poEditForm.po_items, newItem],
    });
    setNewPoItemName("");
    setNewPoItemQty(1);
    setNewPoItemPrice(100);
  };

  const handleSavePoChanges = () => {
    if (editingPoIndex === null || !poEditForm || !quoteResult) return;
    const updatedPOs = [...(quoteResult.restockPoDrafts || [])];
    updatedPOs[editingPoIndex] = poEditForm;
    setQuoteResult({
      ...quoteResult,
      restockPoDrafts: updatedPOs,
    });
    handleClosePoModal();
  };

  const handleDeletePo = (poIndex: number) => {
    if (!quoteResult) return;
    const updatedPOs = (quoteResult.restockPoDrafts || []).filter((_, i) => i !== poIndex);
    setQuoteResult({
      ...quoteResult,
      restockPoDrafts: updatedPOs,
    });
    handleClosePoModal();
  };

  const reset = () => {
    setDukaanSlip(null);
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
            <button
              type="button"
              onClick={() => {
                setActiveWorker(null);
                window.location.hash = "";
              }}
              className="mr-2 text-xs font-bold text-[#55615b] transition hover:text-rose-600"
              title="Sign out of technician workspace"
            >
              Sign out
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold">{techName}</p>
              <p className="text-[10px] font-semibold text-[#87908b]">{workerRole} • {activeBiz.business_name}</p>
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
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#6a841d]">
              <span className="live-dot relative flex h-2 w-2 rounded-full bg-[#85a62e]" />
              New site visit
            </div>
            <h1 className="font-display text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Send your dukaan slip & voice
            </h1>
            <p className="mt-2 text-sm text-[#69736e] sm:text-base">
              Snap a job slip or speak in Hinglish. DukaanPay automatically identifies items, quantities, and computes GST quotes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#77817c]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#17221d] text-[10px] text-white">
              1
            </span>
            Input slip
            <span className="mx-1 h-px w-6 bg-[#17221d]/15" />
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${status === "sent" ? "bg-[#17221d] text-white" : "bg-[#e0e3dc]"
                }`}
            >
              2
            </span>
            Review Quote
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

              {/* Natural Language Refinement Loop Card */}
              <div className="mt-5 rounded-2xl border border-[#0284c7]/20 bg-gradient-to-br from-[#f0f9ff]/70 via-[#f8fafc] to-[#ecfdf5]/60 p-4 shadow-sm transition">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0284c7] text-white text-xs shadow-sm">
                      ✨
                    </span>
                    <h3 className="font-extrabold text-xs text-[#0f172a] uppercase tracking-wider">
                      Natural Language Refinement Loop (AI Agent)
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-bold text-[#166534]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                      LangGraph Node 6 &rarr; Node 2
                    </span>
                  </div>
                  {isRefining && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0284c7] animate-pulse">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Re-evaluating quote & 3-tier inventory...
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[11px] text-[#475569]">
                  Type instructions in plain English or Hinglish (e.g. <em>&quot;Wire coil 3 kar do and switches hata do&quot;</em>). The AI Agent re-drafts line items and loops back to real-time 3-tier inventory shortages &amp; GST calculation.
                </p>

                {/* Quick Revision Suggestion Pills */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-[10px] font-bold uppercase text-[#94a3b8]">Quick Suggestions:</span>
                  {[
                    "Make wire coil qty 3 instead of 5",
                    "Remove modular switches from quote",
                    "Add 2 packets of PVC insulation tape",
                    "Give 5% discount on line item rates",
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefineQuote(chip)}
                      className="rounded-full border border-[#cbd5e1] bg-white px-2.5 py-1 text-[11px] font-medium text-[#334155] shadow-xs hover:border-[#0284c7] hover:bg-[#f0f9ff] hover:text-[#0284c7] transition disabled:opacity-50"
                    >
                      ⚡ {chip}
                    </button>
                  ))}
                </div>

                {/* Natural Language Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRefineQuote();
                  }}
                  className="mt-3 flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      disabled={isRefining}
                      value={refinePrompt}
                      onChange={(e) => setRefinePrompt(e.target.value)}
                      placeholder="e.g. Wire 3 coil kar do, modular switch hata do, aur 2 roll tape add karo..."
                      className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-xs text-[#0f172a] placeholder-[#94a3b8] shadow-inner outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20 transition disabled:bg-neutral-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isRefining || !refinePrompt.trim()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0284c7] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#0369a1] active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRefining ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Re-drafting...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ Refine Quote with AI</span>
                      </>
                    )}
                  </button>
                </form>

                {/* AI Refinement Feedback Notification */}
                {refineFeedback && (
                  <div className="mt-3 flex items-start justify-between gap-2 rounded-xl border border-[#86efac] bg-[#f0fdf4] p-2.5 text-xs text-[#166534]">
                    <div className="flex items-start gap-2">
                      <span className="text-sm">✨</span>
                      <div>
                        <strong className="font-extrabold">QuoteFlow Agent: </strong>
                        <span>{refineFeedback}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRefineFeedback(null)}
                      className="text-[#166534]/60 hover:text-[#166534] font-bold text-xs"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Human Edit Info Banner */}
              <div className="mt-5 flex items-center justify-between rounded-xl bg-[#f7f8f4] border border-[#17221d]/10 px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-[#55615b]">
                  <CaptureIcon name="edit" className="h-4 w-4 text-[#6a841d]" />
                  <span>
                    <strong>Human Edit Mode:</strong> Click or edit quantities and rates below. Stock badges, deficits, and GST calculate in real-time.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#17221d] px-3 py-1.5 text-xs font-bold text-[#caff52] hover:bg-[#25362e] transition"
                >
                  <CaptureIcon name="plus" className="h-3.5 w-3.5" />
                  {showAddItem ? "Cancel" : "Add Line Item"}
                </button>
              </div>

              {/* Add Custom / Catalog Item Form */}
              {showAddItem && (
                <div className="mt-4 rounded-2xl border border-[#caff52]/60 bg-[#f7fce9] p-4 text-xs">
                  <p className="font-extrabold text-[#3a4d0e]">Add New Line Item to Quotation</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#627725] uppercase">From Catalog</label>
                      <select
                        value={selectedCatalogSku}
                        onChange={(e) => {
                          const sku = e.target.value;
                          setSelectedCatalogSku(sku);
                          const it = catalogList.find((c) => c.sku_id === sku);
                          if (it) {
                            setCustomItemName(it.item_name);
                            setCustomPrice(Number(it.unit_price) || 0);
                            setCustomUnit(it.unit || "piece");
                          }
                        }}
                        className="mt-1 h-9 w-full rounded-lg border border-[#17221d]/15 bg-white px-2 font-medium"
                      >
                        <option value="">-- Choose or type custom below --</option>
                        {catalogList.map((c) => (
                          <option key={c.sku_id} value={c.sku_id}>
                            {c.item_name} (₹{c.unit_price} / {c.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#627725] uppercase">Item Name</label>
                      <input
                        type="text"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        placeholder="e.g. 10A Switch or Labor"
                        className="mt-1 h-9 w-full rounded-lg border border-[#17221d]/15 bg-white px-2 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#627725] uppercase">Quantity & Unit</label>
                      <div className="mt-1 flex gap-1">
                        <input
                          type="number"
                          min="1"
                          value={customQty}
                          onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                          className="h-9 w-16 rounded-lg border border-[#17221d]/15 bg-white px-2 font-bold text-center"
                        />
                        <input
                          type="text"
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          placeholder="unit"
                          className="h-9 w-20 rounded-lg border border-[#17221d]/15 bg-white px-2 text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#627725] uppercase">Rate (₹)</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                          className="h-9 w-full rounded-lg border border-[#17221d]/15 bg-white px-2 font-bold text-right"
                        />
                        <button
                          type="button"
                          onClick={handleAddCatalogItem}
                          className="h-9 rounded-lg bg-[#536d13] px-3 font-extrabold text-white hover:bg-[#3f540d]"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quoted Items Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#17221d]/10 text-[11px] font-extrabold uppercase text-[#737d78]">
                      <th className="pb-3">Item Name</th>
                      <th className="pb-3 text-center">Qty (Click to Edit)</th>
                      <th className="pb-3 text-right">Rate (₹)</th>
                      <th className="pb-3 text-right">GST</th>
                      <th className="pb-3 text-right">Total</th>
                      <th className="pb-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17221d]/6">
                    {quoteResult.extractedItems.map((item, idx) => {
                      return (
                        <tr key={idx} className="hover:bg-[#fbfcf8] transition-colors">
                          <td className="py-3 font-semibold text-[#17221d]">
                            {item.item_name}
                            <span className="block text-[11px] font-normal text-[#757f7a]">SKU: {item.sku_id}</span>
                          </td>
                          <td className="py-3 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#17221d]/10 bg-white p-1 shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, item.quantity - 1)}
                                className="grid h-6 w-6 place-items-center rounded bg-[#f4f5ef] text-xs font-bold text-[#17221d] hover:bg-[#e6e8e0]"
                                title="Decrease"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 1)}
                                className="w-12 text-center text-xs font-black text-[#17221d] outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, item.quantity + 1)}
                                className="grid h-6 w-6 place-items-center rounded bg-[#f4f5ef] text-xs font-bold text-[#17221d] hover:bg-[#e6e8e0]"
                                title="Increase"
                              >
                                +
                              </button>
                              <span className="pr-1 text-[10px] text-[#78827d]">{item.unit}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center gap-1 rounded-lg border border-[#17221d]/10 bg-white px-2 py-1 shadow-sm">
                              <span className="text-[10px] text-[#848d88]">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => handleUpdatePrice(idx, parseFloat(e.target.value) || 0)}
                                className="w-16 text-right text-xs font-bold text-[#17221d] outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-3 text-right text-xs text-[#737d78]">
                            ₹{Number(item.gst_amount).toFixed(2)} ({item.gst_rate}%)
                          </td>
                          <td className="py-3 text-right font-black text-[#17221d]">₹{Number(item.line_total).toFixed(2)}</td>
                          <td className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="grid h-7 w-7 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 transition"
                              title="Delete row"
                            >
                              <CaptureIcon name="trash" className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* AI Revenue Guard Callout */}
              {quoteResult.aiRevenueAlert && quoteResult.aiRevenueAlert.has_warning && (
                <div className="mt-6 rounded-2xl border border-[#fbbf24] bg-[#fffdf5] p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fef3c7] text-[#b45309] shadow-sm">
                      <CaptureIcon name="sparkle" className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-[#b45309]">
                            AI Revenue Guard Alert (Missed Ancillary & Companion Services)
                          </p>
                          <p className="mt-0.5 text-xs text-[#78350f]">{quoteResult.aiRevenueAlert.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#047857] bg-[#d1fae5] border border-[#a7f3d0] px-2.5 py-1 rounded-lg">
                            +₹{Number(quoteResult.aiRevenueAlert.total_estimated_added_revenue).toFixed(2)} Recoverable
                          </span>
                          <button
                            type="button"
                            onClick={handleAddAllAddons}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#b45309] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#92400e] transition shadow-xs"
                            title="Add all AI suggested companion charges to the quotation"
                          >
                            ⚡ Add All to Quote
                          </button>
                        </div>
                      </div>

                      {/* Interactive Addons Cards */}
                      <div className="mt-4 grid gap-2.5">
                        {quoteResult.aiRevenueAlert.suggested_addons.map((addon, aIdx) => {
                          const inQuote = isAddonInQuote(addon.suggested_sku_id, addon.suggested_item_name);
                          return (
                            <div
                              key={aIdx}
                              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition ${inQuote
                                  ? "bg-[#ecfdf5] border-[#86efac]"
                                  : "bg-white border-[#fef3c7] hover:border-[#fde68a]"
                                }`}
                            >
                              <div className="min-w-[180px] flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">💡</span>
                                  <span className="font-extrabold text-xs text-[#17221d]">
                                    {addon.suggested_item_name}
                                  </span>
                                  {inQuote && (
                                    <span className="rounded-full bg-[#10b981] px-2 py-0.5 text-[9px] font-black text-white uppercase">
                                      In Quote
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[11px] text-[#78350f]/80 pl-6">
                                  {addon.reason}
                                </p>
                              </div>

                              {/* Editable Controls */}
                              <div className="flex items-center gap-3">
                                {/* Quantity Stepper */}
                                <div className="flex items-center rounded-lg border border-[#17221d]/15 bg-[#fbfbfa] p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAddonQty(aIdx, addon.suggested_qty - 1)}
                                    className="grid h-6 w-6 place-items-center rounded bg-white text-xs font-bold text-[#17221d] hover:bg-neutral-100"
                                    title="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={addon.suggested_qty}
                                    onChange={(e) => handleUpdateAddonQty(aIdx, parseInt(e.target.value) || 1)}
                                    className="w-10 text-center text-xs font-bold text-[#17221d] outline-none bg-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAddonQty(aIdx, addon.suggested_qty + 1)}
                                    className="grid h-6 w-6 place-items-center rounded bg-white text-xs font-bold text-[#17221d] hover:bg-neutral-100"
                                    title="Increase quantity"
                                  >
                                    +
                                  </button>
                                  <span className="pr-1.5 text-[10px] text-[#78827d]">pts</span>
                                </div>

                                {/* Editable Unit Rate */}
                                <div className="flex items-center rounded-lg border border-[#17221d]/15 bg-white px-2 py-1">
                                  <span className="text-[10px] text-[#848d88] mr-1">₹</span>
                                  <input
                                    type="number"
                                    step="10"
                                    min="0"
                                    value={addon.unit_price}
                                    onChange={(e) => handleUpdateAddonPrice(aIdx, parseFloat(e.target.value) || 0)}
                                    className="w-14 text-right text-xs font-bold text-[#17221d] outline-none"
                                  />
                                </div>

                                {/* Total line */}
                                <div className="text-right w-16">
                                  <span className="block text-xs font-black text-[#047857]">
                                    ₹{Number(addon.line_total).toFixed(2)}
                                  </span>
                                  <span className="block text-[9px] text-[#78827d]">+18% GST</span>
                                </div>

                                {/* Add/Remove Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleAddonToQuote(aIdx)}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition shadow-xs ${inQuote
                                      ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                      : "bg-[#047857] text-white hover:bg-[#065f46]"
                                    }`}
                                >
                                  {inQuote ? "Remove" : "+ Add to Quote"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Autonomous Supplier Restock POs Drafts */}
              {quoteResult.restockPoDrafts && quoteResult.restockPoDrafts.length > 0 && (
                <div className="mt-6 rounded-2xl border border-[#93c5fd] bg-[#f0f9ff] p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#dbeafe] text-[#1d4ed8] shadow-sm">
                      <CaptureIcon name="file" className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-[#1e40af]">
                            Autonomous Warehouse Restock POs ({quoteResult.restockPoDrafts.length} PO Drafts)
                          </p>
                          <p className="mt-0.5 text-xs text-[#3b82f6]">
                            Stock shortages detected. Click "Review & Edit PO" to customize suppliers, restock quantities, or urgency before warehouse dispatch.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {quoteResult.restockPoDrafts.map((po, pIdx) => {
                          const poTotal = Math.round(
                            po.po_items.reduce((sum, it) => sum + (Number(it.line_total) || Number(it.order_qty) * Number(it.unit_price)), 0) * 100
                          ) / 100;
                          return (
                            <div
                              key={pIdx}
                              className="rounded-xl bg-white p-4 border border-[#bfdbfe] shadow-xs flex flex-col justify-between hover:border-[#60a5fa] transition"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-extrabold text-[#17221d] flex items-center gap-1">
                                      🏢 {po.supplier_name}
                                    </span>
                                  </div>
                                  <span
                                    className={`rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${po.urgency === "INSTANT_ORDER"
                                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                                        : "bg-blue-100 text-blue-700 border border-blue-200"
                                      }`}
                                  >
                                    {po.urgency.replace("_", " ")}
                                  </span>
                                </div>

                                <ul className="mt-3 space-y-1.5 text-xs text-[#4b5563]">
                                  {po.po_items.map((it, itIdx) => (
                                    <li key={itIdx} className="flex items-center justify-between bg-neutral-50 px-2 py-1 rounded border border-neutral-100">
                                      <span className="font-medium text-[#1f2937]">
                                        • {it.item_name}
                                      </span>
                                      <span className="font-bold text-[#111827]">
                                        Qty: {it.order_qty} (₹{it.line_total})
                                      </span>
                                    </li>
                                  ))}
                                </ul>

                                {po.order_note && (
                                  <p className="mt-2 text-[10px] text-[#6b7280] italic">
                                    Note: {po.order_note}
                                  </p>
                                )}
                              </div>

                              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block font-bold">Total PO Value</span>
                                  <span className="text-xs font-black text-[#1e40af]">₹{poTotal.toFixed(2)}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPoModal(pIdx)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#dbeafe] px-3 py-1.5 text-xs font-bold text-[#1e40af] hover:bg-[#bfdbfe] transition shadow-xs"
                                >
                                  <CaptureIcon name="edit" className="h-3.5 w-3.5" />
                                  Review & Edit PO
                                </button>
                              </div>
                            </div>
                          );
                        })}
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
                        href={api.getInvoiceUrl(quoteResult.threadId)}
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
                      {editSuccessMsg && (
                        <p className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 inline-block">
                          ✓ {editSuccessMsg}
                        </p>
                      )}
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
                        onClick={handleSaveDraftEdits}
                        disabled={isSavingEdit}
                        className="rounded-full border border-[#17221d]/20 bg-white px-5 py-3 text-xs font-extrabold text-[#17221d] hover:bg-[#f0f2eb] transition disabled:opacity-50"
                      >
                        {isSavingEdit ? "Saving..." : "💾 Save Draft Edits"}
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
          /* CAPTURE FORM VIEW: Dukaan Slip Upload + Live Hinglish Voice Transcription */
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

              {/* 1. Dukaan Slip Photo */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-[-0.02em]">
                      1. Upload or Snap Handwritten Dukaan Slip
                    </h2>
                    <p className="mt-1 text-xs text-[#79827d]">
                      Gemma 4 Multimodal vision will read items, quantities, and smudged writing
                    </p>
                  </div>
                  {dukaanSlip && (
                    <span className="flex items-center gap-1 rounded-full bg-[#eafaaf] px-2.5 py-1 text-[10px] font-extrabold text-[#536716]">
                      <CaptureIcon name="check" className="h-3 w-3" /> Photo Attached
                    </span>
                  )}
                </div>
                <input
                  id="dukaan-file"
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={chooseDukaanSlip}
                />
                {dukaanSlip ? (
                  <div className="relative overflow-hidden rounded-2xl bg-[#e8e5dc]">
                    <img
                      src={imageUrl}
                      alt="Dukaan slip preview"
                      className="h-64 w-full object-contain sm:h-72"
                    />
                    <button
                      type="button"
                      onClick={() => setDukaanSlip(null)}
                      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[#17221d]/80 text-white backdrop-blur"
                      aria-label="Remove dukaan slip"
                    >
                      <CaptureIcon name="x" className="h-4 w-4" />
                    </button>
                    <label
                      htmlFor="dukaan-file"
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 cursor-pointer whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-extrabold shadow-lg hover:bg-[#f4f5ef]"
                    >
                      Retake / Replace Photo
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="dukaan-file"
                    className="group grid min-h-52 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-[#17221d]/15 bg-[#fafbf8] p-6 text-center transition hover:border-[#86a82c] hover:bg-[#f7fce9]"
                  >
                    <span>
                      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#d6ff78] transition group-hover:scale-105">
                        <CaptureIcon name="camera" className="h-5 w-5" />
                      </span>
                      <strong className="mt-3 block text-sm">Take photo or select dukaan slip image</strong>
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
                    className={`flex items-center justify-center gap-3 rounded-2xl border p-4 transition ${isListening
                        ? "border-[#f43f5e] bg-[#fff1f2] animate-pulse"
                        : "border-[#17221d]/10 bg-[#fafbf8] hover:border-[#86a82c]"
                      }`}
                  >
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-full ${isListening ? "bg-[#f43f5e] text-white" : "bg-[#d6ff78] text-[#17221d]"
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
                      className={`flex flex-1 items-center justify-center gap-3 rounded-2xl border p-4 transition ${recording ? "border-[#ff8c80] bg-[#fff0ed]" : "border-[#17221d]/10 bg-[#fafbf8]"
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
                      Dukaan slip photo
                    </span>
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full ${dukaanSlip ? "bg-[#caff52] text-[#17221d]" : "border border-white/20"
                        }`}
                    >
                      {dukaanSlip && <CaptureIcon name="check" className="h-3 w-3" />}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/7 p-3">
                    <span className="flex items-center gap-3 text-xs font-bold text-white/70">
                      <CaptureIcon name="mic" className="h-4 w-4" />
                      Hinglish Voice Note
                    </span>
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full ${transcript || audio ? "bg-[#caff52] text-[#17221d]" : "border border-white/20"
                        }`}
                    >
                      {(transcript || audio) && <CaptureIcon name="check" className="h-3 w-3" />}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={(!dukaanSlip && !transcript) || status === "sending"}
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

      {/* ------------------------------------------------------------------- */}
      {/* 1-Click Purchase Order Review & Edit Modal */}
      {/* ------------------------------------------------------------------- */}
      {editingPoIndex !== null && poEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
                    <CaptureIcon name="file" className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-[#17221d]">
                      Review & Edit Purchase Order #{editingPoIndex + 1}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Configure supplier details, order quantities, and dispatch urgency.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePoModal}
                className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
              >
                <CaptureIcon name="x" className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Supplier & Urgency Controls */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Preferred Supplier / Distributor
                  </label>
                  <input
                    type="text"
                    value={poEditForm.supplier_name}
                    onChange={(e) => setPoEditForm({ ...poEditForm, supplier_name: e.target.value })}
                    placeholder="e.g. Havells Regional Hub, Anchor Distributors..."
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-bold text-[#17221d] outline-none focus:border-[#1d4ed8] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Procurement Urgency
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPoEditForm({ ...poEditForm, urgency: "STANDARD_RESTOCK" })}
                      className={`flex-1 rounded-xl py-2 px-3 text-xs font-extrabold border transition ${poEditForm.urgency === "STANDARD_RESTOCK"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                    >
                      📦 Standard Buffer
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoEditForm({ ...poEditForm, urgency: "INSTANT_ORDER" })}
                      className={`flex-1 rounded-xl py-2 px-3 text-xs font-extrabold border transition ${poEditForm.urgency === "INSTANT_ORDER"
                          ? "bg-rose-50 border-rose-500 text-rose-700"
                          : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                    >
                      🚨 Instant Deficit
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  PO Restock Line Items
                </label>
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                      <tr>
                        <th className="px-3 py-2">Item Name</th>
                        <th className="px-3 py-2 text-center">Order Qty</th>
                        <th className="px-3 py-2 text-right">Unit Price</th>
                        <th className="px-3 py-2 text-right">Line Total</th>
                        <th className="px-2 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {poEditForm.po_items.map((it, itIdx) => (
                        <tr key={itIdx} className="hover:bg-neutral-50/60">
                          <td className="px-3 py-2.5">
                            <span className="font-extrabold text-[#17221d] block">{it.item_name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">{it.sku_id}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleUpdatePoItemQty(itIdx, it.order_qty - 1)}
                                className="grid h-5 w-5 place-items-center rounded bg-neutral-100 text-xs font-bold text-neutral-700 hover:bg-neutral-200"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={it.order_qty}
                                onChange={(e) => handleUpdatePoItemQty(itIdx, parseInt(e.target.value) || 1)}
                                className="w-10 text-center text-xs font-bold text-[#17221d] outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdatePoItemQty(itIdx, it.order_qty + 1)}
                                className="grid h-5 w-5 place-items-center rounded bg-neutral-100 text-xs font-bold text-neutral-700 hover:bg-neutral-200"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-2 py-0.5">
                              <span className="text-[10px] text-neutral-400 mr-0.5">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={it.unit_price}
                                onChange={(e) => handleUpdatePoItemPrice(itIdx, parseFloat(e.target.value) || 0)}
                                className="w-14 text-right text-xs font-bold text-[#17221d] outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-black text-[#17221d]">
                            ₹{Number(it.line_total).toFixed(2)}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePoItem(itIdx)}
                              className="grid h-6 w-6 place-items-center rounded text-rose-500 hover:bg-rose-50 transition mx-auto"
                              title="Remove item from PO"
                            >
                              <CaptureIcon name="trash" className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {poEditForm.po_items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-xs text-neutral-400">
                            No items in this PO. Add items below or delete this PO.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add New Item to PO */}
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/60 p-3">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-600 mb-2">
                  + Add Additional Item to this PO
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newPoItemName}
                    onChange={(e) => setNewPoItemName(e.target.value)}
                    placeholder="Item name (e.g. 2.5 mm Wire Coil)"
                    className="flex-1 min-w-[150px] rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-neutral-500">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={newPoItemQty}
                      onChange={(e) => setNewPoItemQty(parseInt(e.target.value) || 1)}
                      className="w-12 rounded-lg border border-neutral-300 bg-white px-1.5 py-1.5 text-center text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-neutral-500">Rate (₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={newPoItemPrice}
                      onChange={(e) => setNewPoItemPrice(parseFloat(e.target.value) || 0)}
                      className="w-16 rounded-lg border border-neutral-300 bg-white px-1.5 py-1.5 text-right text-xs font-bold outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    disabled={!newPoItemName.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    Add Row
                  </button>
                </div>
              </div>

              {/* Order Note */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Supplier Delivery Note
                </label>
                <textarea
                  rows={2}
                  value={poEditForm.order_note || ""}
                  onChange={(e) => setPoEditForm({ ...poEditForm, order_note: e.target.value })}
                  placeholder="Special instructions for the supplier, e.g., 'Dispatch priority batch before 11 AM'..."
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-medium text-[#17221d] outline-none focus:border-[#1d4ed8] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="block text-[10px] uppercase font-bold text-neutral-400">Total Purchase Order Amount</span>
                <span className="text-base font-black text-[#1e40af]">
                  ₹
                  {poEditForm.po_items
                    .reduce((sum, it) => sum + (Number(it.line_total) || Number(it.order_qty) * Number(it.unit_price)), 0)
                    .toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeletePo(editingPoIndex)}
                  className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                >
                  Delete PO
                </button>
                <button
                  type="button"
                  onClick={handleClosePoModal}
                  className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePoChanges}
                  className="rounded-xl bg-[#1e40af] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a] transition shadow-xs"
                >
                  Save PO Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
