import { useState } from "react";
import { api } from "../api";
import { Icon } from "./InventoryIcons";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  defaultIndustry?: string;
}

export function AddItemModal({
  isOpen,
  onClose,
  onSuccess,
  defaultIndustry = "Electrical",
}: AddItemModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    sku_id: "",
    item_name: "",
    category: "Electrical",
    industry: defaultIndustry || "Electrical",
    unit: "piece",
    unit_price: 150,
    gst_rate: 18,
    current_stock: 20,
    reorder_threshold: 5,
    preferred_supplier: "Local Distributor",
    supplier_lead_time_days: 2,
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.sku_id.trim() || !form.item_name.trim()) {
      alert("Please provide both SKU ID and Item Name.");
      return;
    }
    setIsCreating(true);
    try {
      await api.createCatalogItem({
        sku_id: form.sku_id.trim(),
        item_name: form.item_name.trim(),
        category: form.category,
        industry: form.industry,
        unit: form.unit,
        unit_price: Number(form.unit_price) || 0,
        gst_rate: Number(form.gst_rate) || 18,
        current_stock: Number(form.current_stock) || 0,
        reorder_threshold: Number(form.reorder_threshold) || 5,
        preferred_supplier: form.preferred_supplier,
        supplier_lead_time_days: Number(form.supplier_lead_time_days) || 2,
      });

      onSuccess(`New item "${form.item_name}" created successfully!`);
      onClose();
      setForm({
        sku_id: "",
        item_name: "",
        category: "Electrical",
        industry: defaultIndustry || "Electrical",
        unit: "piece",
        unit_price: 150,
        gst_rate: 18,
        current_stock: 20,
        reorder_threshold: 5,
        preferred_supplier: "Local Distributor",
        supplier_lead_time_days: 2,
      });
    } catch (err: any) {
      alert("Failed to create item: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17221d]/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#17221d]/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#17221d]/8 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#17221d] text-[#caff52]">
              <Icon name="plus" className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-[#17221d]">Add Catalog Item</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-[#17221d]/10 text-[#6f7974] hover:bg-[#eef0ea]"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs font-bold">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">SKU ID *</label>
              <input
                type="text"
                value={form.sku_id}
                onChange={(e) => setForm({ ...form, sku_id: e.target.value })}
                placeholder="e.g. ELEC-SW-01"
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-mono text-xs uppercase outline-none focus:border-[#789524]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">Industry / Trade</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
              >
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Automotive">Automotive</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">Item Name *</label>
              <input
                type="text"
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                placeholder="e.g. 10A Modular Switch White"
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 text-sm outline-none focus:border-[#789524]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
              >
                <option value="Electrical">Electrical</option>
                <option value="AC service">AC service</option>
                <option value="Lighting">Lighting</option>
                <option value="Security">Security</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Hardware">Hardware</option>
                <option value="Mechanical">Mechanical</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="piece"
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">Selling Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-bold outline-none focus:border-[#789524]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">GST %</label>
              <input
                type="number"
                value={form.gst_rate}
                onChange={(e) => setForm({ ...form, gst_rate: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-bold outline-none focus:border-[#789524]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={form.current_stock}
                onChange={(e) => setForm({ ...form, current_stock: parseInt(e.target.value) || 0 })}
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-bold outline-none focus:border-[#789524]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">Reorder Threshold</label>
              <input
                type="number"
                min="1"
                value={form.reorder_threshold}
                onChange={(e) => setForm({ ...form, reorder_threshold: parseInt(e.target.value) || 5 })}
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 font-bold outline-none focus:border-[#789524]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">Preferred Supplier</label>
              <input
                type="text"
                value={form.preferred_supplier}
                onChange={(e) => setForm({ ...form, preferred_supplier: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#69736e] uppercase">Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                value={form.supplier_lead_time_days}
                onChange={(e) => setForm({ ...form, supplier_lead_time_days: parseInt(e.target.value) || 2 })}
                className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 outline-none focus:border-[#789524]"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#17221d]/8">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#17221d]/15 px-5 py-2.5 text-xs font-bold text-[#17221d] hover:bg-[#f4f5ef]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCreating}
              className="rounded-full bg-[#17221d] px-6 py-2.5 text-xs font-black text-[#caff52] shadow hover:bg-[#25362e] disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
