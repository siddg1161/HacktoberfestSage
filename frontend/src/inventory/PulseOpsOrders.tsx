import { PurchaseOrder } from "../api";
import { Icon } from "./InventoryIcons";
import { currency } from "./types";

interface PulseOpsOrdersProps {
  orders: PurchaseOrder[];
  onReceivePo: (poNumber: string) => Promise<void>;
  receivingPo: string | null;
}

export function PulseOpsOrders({
  orders,
  onReceivePo,
  receivingPo,
}: PulseOpsOrdersProps) {
  return (
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
          {orders.length} {orders.length === 1 ? "PO Active" : "POs Active"}
        </span>
      </div>

      {orders.length === 0 ? (
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
          {orders.map((po) => {
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
                      onClick={() => onReceivePo(po.po_number)}
                      className="flex items-center gap-1.5 rounded-full bg-[#17221d] px-4 py-2.5 text-xs font-extrabold text-[#caff52] shadow transition hover:bg-[#25362e] disabled:opacity-50"
                    >
                      <Icon name="check" className="h-3.5 w-3.5" />
                      {receivingPo === po.po_number
                        ? "Updating Stock…"
                        : "Mark Stock Received"}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <Icon name="check" className="h-4 w-4" /> Received &amp; Stocked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
