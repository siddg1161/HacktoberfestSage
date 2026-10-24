import { useEffect, useState } from "react";
import { api } from "../api";
import { Icon } from "./InventoryIcons";
import { StockBadge } from "./StockBadge";
import { InventoryItem } from "./types";

interface EditItemDrawerProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: (updatedItem: InventoryItem) => void;
  onDeleted: (skuId: string) => void;
}

export function EditItemDrawer({
  item,
  onClose,
  onSaved,
  onDeleted,
}: EditItemDrawerProps) {
  const [editForm, setEditForm] = useState<InventoryItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (item) {
      setEditForm({ ...item, gstRate: item.gstRate ?? 18, leadTimeDays: item.leadTimeDays ?? 2 });
      setSaved(false);
    } else {
      setEditForm(null);
    }
  }, [item]);

  if (!item || !editForm) return null;

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await api.updateCatalogItem(editForm.id, {
        item_name: editForm.name,
        category: editForm.category,
        unit: editForm.unit,
        unit_price: Number(editForm.unitCost),
        gst_rate: Number(editForm.gstRate ?? 18),
        current_stock: Number(editForm.quantity),
        reorder_threshold: Number(editForm.reorderAt),
        preferred_supplier: editForm.supplier,
        supplier_lead_time_days: Number(editForm.leadTimeDays ?? 2),
      });

      const updated = { ...editForm, lastUpdated: "Just updated" };
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert("Failed to update item: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete catalog item "${editForm.id}"?`)) return;
    try {
      await api.deleteCatalogItem(editForm.id);
      onDeleted(editForm.id);
      onClose();
    } catch (err: any) {
      alert("Failed to delete item: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#17221d]/35 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close inventory details"
      />
      <aside className="relative h-full w-full max-w-[500px] overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#17221d]/8 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#87908b]">
              Edit Catalog Item
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-base font-black text-[#17221d]">{editForm.id}</span>
              <StockBadge item={editForm} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#17221d]/10 hover:bg-[#f4f5ef]"
            aria-label="Close details"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
              Item Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm font-bold text-[#17221d] outline-none focus:border-[#789524] focus:ring-2 focus:ring-[#caff52]/30"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                Category
              </label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
              >
                <option value="Electrical">Electrical</option>
                <option value="AC service">AC service</option>
                <option value="Lighting">Lighting</option>
                <option value="Security">Security</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Hardware">Hardware</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                Unit
              </label>
              <input
                type="text"
                value={editForm.unit}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                placeholder="e.g. piece, coil"
                className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
              />
            </div>
          </div>

          {/* Unit Price & GST Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                Selling Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.unitCost}
                onChange={(e) => setEditForm({ ...editForm, unitCost: parseFloat(e.target.value) || 0 })}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-sm font-black text-[#17221d] outline-none focus:border-[#789524]"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                GST Rate (%)
              </label>
              <select
                value={editForm.gstRate ?? 18}
                onChange={(e) => setEditForm({ ...editForm, gstRate: parseFloat(e.target.value) || 0 })}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
              >
                <option value="0">0% (Nil)</option>
                <option value="5">5% (Essential)</option>
                <option value="12">12% (Standard)</option>
                <option value="18">18% (Standard Services)</option>
                <option value="28">28% (Luxury / Heavy)</option>
              </select>
            </div>
          </div>

          {/* Stock Levels & Reorder Threshold */}
          <div className="rounded-2xl border border-[#17221d]/10 bg-[#f7f8f4] p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#49544f]">
              Warehouse Stock &amp; Safety Threshold
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#727c77]">Current Stock</label>
                <div className="mt-1 flex items-center gap-1 rounded-xl border border-[#17221d]/12 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, quantity: Math.max(0, editForm.quantity - 1) })}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f2eb] text-sm font-bold hover:bg-[#e4e7de]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full text-center text-sm font-black text-[#17221d] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, quantity: editForm.quantity + 1 })}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f2eb] text-sm font-bold hover:bg-[#e4e7de]"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#727c77]">Reorder Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.reorderAt}
                  onChange={(e) => setEditForm({ ...editForm, reorderAt: parseInt(e.target.value) || 0 })}
                  className="mt-1 h-10 w-full rounded-xl border border-[#17221d]/12 bg-white px-3 text-center text-sm font-bold text-[#17221d] outline-none"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[#78827d]">
              When stock falls below {editForm.reorderAt} {editForm.unit}s, QuoteFlow triggers autonomous restock POs.
            </p>
          </div>

          {/* Supplier & Lead Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                Preferred Supplier
              </label>
              <input
                type="text"
                value={editForm.supplier}
                onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
                Lead Time (Days)
              </label>
              <input
                type="number"
                min="1"
                value={editForm.leadTimeDays ?? 2}
                onChange={(e) => setEditForm({ ...editForm, leadTimeDays: parseInt(e.target.value) || 1 })}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#17221d]/15 bg-[#fafbf8] px-3.5 text-xs font-bold text-[#17221d] outline-none focus:border-[#789524]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#17221d]/8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full border border-red-200 px-4 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50 transition"
            >
              Delete Item
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#17221d]/15 px-4 py-2.5 text-xs font-bold text-[#17221d] hover:bg-[#f4f5ef]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isUpdating}
                className="rounded-full bg-[#17221d] px-6 py-2.5 text-xs font-black text-[#caff52] shadow hover:bg-[#25362e] disabled:opacity-50"
              >
                {isUpdating ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
