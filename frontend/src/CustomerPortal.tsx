import { useEffect, useState } from "react";
import { api } from "./api";

export default function CustomerPortal({ threadId }: { threadId: string }) {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [approvedSuccess, setApprovedSuccess] = useState(false);

  useEffect(() => {
    async function loadQuote() {
      try {
        setLoading(true);
        const data = await api.getPortalQuote(threadId);
        setQuote(data);
        if (data.status === "WON" || data.status === "INVOICED") {
          setApprovedSuccess(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load quotation.");
      } finally {
        setLoading(false);
      }
    }
    loadQuote();
  }, [threadId]);

  const handleApprove = async () => {
    try {
      setApproving(true);
      await api.approvePortalQuote(threadId);
      setApprovedSuccess(true);
      setQuote((prev: any) => ({ ...prev, status: "WON" }));
    } catch (err: any) {
      alert("Error approving quotation: " + err.message);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] grid place-items-center p-6 text-center">
        <div>
          <div className="h-10 w-10 border-4 border-[#0284c7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-[#64748b]">Loading your quotation...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-[#f8fafc] grid place-items-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-[#e2e8f0] shadow-sm">
          <p className="text-3xl mb-2">⚠️</p>
          <h2 className="text-lg font-extrabold text-[#0f172a]">Quotation Not Found</h2>
          <p className="text-xs text-[#64748b] mt-2 leading-relaxed">
            {error || "This quotation link may have expired or is invalid."}
          </p>
          <button
            onClick={() => {
              window.location.hash = "";
            }}
            className="mt-6 rounded-full bg-[#0f172a] px-6 py-2.5 text-xs font-bold text-white"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const subtotal = Number(quote.subtotal || 0);
  const gstTotal = Number(quote.gst_total || 0);
  const grandTotal = Number(quote.grand_total || 0);
  const cgst = (gstTotal / 2).toFixed(2);
  const sgst = (gstTotal / 2).toFixed(2);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#e2e8f0] shadow-[0_10px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Top Banner */}
        <div className="bg-[#0284c7] p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
                GST Quotation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                {quote.seller?.businessName || "QuoteFlow AI"}
              </h1>
              <p className="text-xs text-white/80 mt-1">
                {quote.seller?.address} · GSTIN: {quote.seller?.gstin}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold text-white/80 uppercase">Total Amount</p>
              <p className="text-3xl font-black">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] text-white/70 mt-1">Ref: {threadId.slice(0, 16)}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="p-6 sm:p-8 border-b border-[#e2e8f0] bg-[#fafafa]">
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#64748b] font-bold uppercase tracking-wider block text-[10px]">Quotation Prepared For:</span>
              <p className="text-base font-extrabold text-[#0f172a] mt-0.5">{quote.client_name}</p>
              {quote.client_phone && <p className="text-[#475569]">{quote.client_phone}</p>}
            </div>
            <div className="sm:text-right">
              <span className="text-[#64748b] font-bold uppercase tracking-wider block text-[10px]">Order Status:</span>
              <span
                className={`inline-block mt-1 font-extrabold px-3 py-1 rounded-full text-xs ${
                  approvedSuccess ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fef3c7] text-[#b45309]"
                }`}
              >
                {approvedSuccess ? "✓ Approved & Confirmed" : "⏳ Awaiting Your Approval"}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="p-6 sm:p-8">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#64748b] mb-4">
            Quoted Materials & Services
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[10px] font-black uppercase text-[#94a3b8]">
                  <th className="pb-3 w-10">#</th>
                  <th className="pb-3">Item Description</th>
                  <th className="pb-3 text-center w-16">Qty</th>
                  <th className="pb-3 text-right w-24">Rate</th>
                  <th className="pb-3 text-center w-16">GST</th>
                  <th className="pb-3 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {quote.items?.map((it: any, i: number) => (
                  <tr key={i}>
                    <td className="py-3 text-[#94a3b8] font-mono">{i + 1}</td>
                    <td className="py-3 font-semibold text-[#0f172a]">
                      {it.item_name}
                      {it.is_ai_suggested && (
                        <span className="ml-2 inline-block text-[9px] font-bold text-[#0284c7] bg-[#e0f2fe] px-1.5 py-0.5 rounded">
                          Installation / Service
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center font-bold">{it.quantity}</td>
                    <td className="py-3 text-right">₹{Number(it.unit_price).toFixed(2)}</td>
                    <td className="py-3 text-center text-[#64748b]">{it.gst_rate}%</td>
                    <td className="py-3 text-right font-bold text-[#0f172a]">₹{Number(it.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Breakdown */}
          <div className="mt-8 border-t border-[#e2e8f0] pt-6 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-[#64748b]">
                <span>Taxable Amount:</span>
                <span className="font-semibold text-[#0f172a]">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#64748b]">
                <span>CGST (9%):</span>
                <span>₹{cgst}</span>
              </div>
              <div className="flex justify-between text-[#64748b]">
                <span>SGST (9%):</span>
                <span>₹{sgst}</span>
              </div>
              <div className="flex justify-between border-t border-[#0f172a] pt-3 text-base font-black text-[#0284c7]">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-10 border-t border-[#e2e8f0] pt-6">
            {approvedSuccess ? (
              <div className="bg-[#f0fdf4] border border-[#86efac] p-6 rounded-2xl text-center">
                <span className="text-2xl block mb-1">🎉</span>
                <h3 className="text-base font-extrabold text-[#15803d]">Order Confirmed!</h3>
                <p className="text-xs text-[#166534] mt-1">
                  Thank you! Your quotation is approved and our team is preparing your order.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={api.getInvoiceUrl(threadId)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#15803d] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#166534]"
                  >
                    🖨️ View & Print Tax Invoice
                  </a>
                  <button
                    onClick={() => {
                      window.location.hash = "";
                    }}
                    className="text-xs font-bold text-[#64748b] hover:underline"
                  >
                    Return to home
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#64748b]">
                    By approving, you confirm acceptance of the quoted items and rates.
                  </p>
                </div>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="w-full sm:w-auto rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white px-8 py-3.5 text-sm font-extrabold transition shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {approving ? "Confirming..." : "✓ Approve Quotation & Place Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
