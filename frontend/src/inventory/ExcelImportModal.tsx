import { useState } from "react";
import * as XLSX from "xlsx";
import { api } from "../api";
import { Icon } from "./InventoryIcons";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  defaultIndustry?: string;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultIndustry = "Electrical",
}: ExcelImportModalProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreviewItems, setExcelPreviewItems] = useState<any[]>([]);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const headers = [
      "sku_id",
      "item_name",
      "category",
      "industry",
      "unit",
      "unit_price",
      "gst_rate",
      "current_stock",
      "reorder_threshold",
      "preferred_supplier",
      "supplier_lead_time_days",
    ];

    const sampleRows = [
      [
        "ELE-SW-01",
        "10A Modular Switch White",
        "Electrical",
        defaultIndustry || "Electrical",
        "piece",
        120,
        18,
        45,
        10,
        "Havells Regional Hub",
        2,
      ],
      [
        "ELE-MCB-16",
        "16A Single Pole MCB C-Curve",
        "Electrical",
        defaultIndustry || "Electrical",
        "piece",
        280,
        18,
        30,
        8,
        "Schneider Electric Depot",
        3,
      ],
      [
        "PLM-VLV-02",
        "Brass Ball Valve 1/2 Inch",
        "Plumbing",
        "Plumbing",
        "piece",
        350,
        18,
        25,
        5,
        "Supreme Pipes & Fittings",
        3,
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws["!cols"] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 25 },
      { wch: 22 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory_Catalog");
    XLSX.writeFile(wb, "DukaanPay_Inventory_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setExcelError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("Excel file has no visible sheets.");
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rows.length === 0) {
          throw new Error("The uploaded sheet has no data rows.");
        }

        const parsedItems = rows.map((row, idx) => {
          const findVal = (aliases: string[]) => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
              for (const alias of aliases) {
                if (cleanKey === alias.toLowerCase().replace(/[^a-z0-9]/g, "")) {
                  return row[key];
                }
              }
            }
            return undefined;
          };

          const sku =
            String(findVal(["sku", "skuid", "itemcode", "id", "partnumber"]) || "").trim() ||
            `SKU-${Date.now()}-${idx + 1}`;
          const name = String(
            findVal(["itemname", "name", "description", "title", "product"]) || ""
          ).trim();
          const category = String(
            findVal(["category", "dept", "department", "type"]) || "General"
          ).trim();
          const industry = String(
            findVal(["industry", "trade", "domain"]) || defaultIndustry || "General"
          ).trim();
          const unit = String(findVal(["unit", "uom", "measuringunit"]) || "piece").trim();
          const unit_price = Number(findVal(["unitprice", "price", "rate", "cost", "mrp"])) || 0;
          const gst_rate = Number(findVal(["gstrate", "gst", "tax", "taxrate"])) || 18;
          const current_stock =
            Number(findVal(["currentstock", "stock", "quantity", "qty", "inventory"])) || 0;
          const reorder_threshold =
            Number(findVal(["reorderthreshold", "reorder", "minstock", "threshold"])) || 5;
          const preferred_supplier = String(
            findVal(["preferredsupplier", "supplier", "vendor", "distributor"]) ||
              "Standard Supplier"
          ).trim();
          const supplier_lead_time_days =
            Number(
              findVal(["supplierleadtimedays", "leadtime", "leadtimedays", "deliverydays"])
            ) || 2;

          return {
            sku_id: sku,
            item_name: name || `Imported Item ${idx + 1}`,
            category,
            industry,
            unit,
            unit_price,
            gst_rate,
            current_stock,
            reorder_threshold,
            preferred_supplier,
            supplier_lead_time_days,
          };
        });

        setExcelPreviewItems(parsedItems);
      } catch (err: any) {
        setExcelError(err.message || "Failed to process Excel file.");
        setExcelPreviewItems([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (excelPreviewItems.length === 0) return;
    setIsImporting(true);
    try {
      const res = await api.bulkImportCatalogItems(excelPreviewItems);
      onSuccess(`Successfully imported ${res.count || excelPreviewItems.length} items from Excel!`);
      setExcelFile(null);
      setExcelPreviewItems([]);
      onClose();
    } catch (err: any) {
      alert("Excel import failed: " + (err.message || err));
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setExcelFile(null);
    setExcelPreviewItems([]);
    setExcelError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17221d]/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#17221d]/10 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#17221d]/8 bg-[#fafbf8] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f3d6] text-xl">
              📊
            </span>
            <div>
              <h3 className="text-base font-extrabold text-[#17221d]">
                Populate Inventory from Excel
              </h3>
              <p className="text-xs text-[#6f7974]">
                Upload a .xlsx, .xls, or .csv file to bulk populate your stock catalog
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-[#17221d]/10 text-[#6f7974] hover:bg-[#eef0ea]"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6 overflow-y-auto p-6">
          {/* Step 1: Download Template */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#789524]/20 bg-[#f7faef] p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black text-[#576b1b]">Need a formatted template?</p>
              <p className="mt-0.5 text-[11px] text-[#6f7974]">
                Download our ready-made blank Excel spreadsheet with sample columns and formatting.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#789524] bg-white px-3.5 py-2 text-xs font-extrabold text-[#576b1b] shadow-sm transition hover:bg-[#eef5e0]"
            >
              <Icon name="file" className="h-3.5 w-3.5" />
              📥 Download Template (.xlsx)
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#69736e]">
              Select or Drop Spreadsheet File
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#17221d]/20 bg-[#fafbf8] p-8 text-center transition hover:border-[#789524]">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <span className="text-3xl">📁</span>
              <p className="mt-2 text-xs font-extrabold text-[#17221d]">
                {excelFile ? excelFile.name : "Click to browse or drop your spreadsheet here"}
              </p>
              <p className="mt-1 text-[11px] text-[#8a928e]">
                Supports Microsoft Excel (.xlsx, .xls) and standard CSV
              </p>
            </div>
          </div>

          {excelError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              ⚠️ {excelError}
            </div>
          )}

          {/* Step 3: Preview */}
          {excelPreviewItems.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-extrabold text-[#17221d]">
                  Preview ({excelPreviewItems.length} items parsed)
                </p>
                <span className="text-[11px] font-bold text-emerald-700">
                  ✓ Ready to import
                </span>
              </div>
              <div className="max-h-56 overflow-auto rounded-xl border border-[#17221d]/10">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-[#fafbf8] text-[10px] font-extrabold uppercase text-[#8a928e]">
                    <tr>
                      <th className="border-b p-2.5">SKU</th>
                      <th className="border-b p-2.5">Name</th>
                      <th className="border-b p-2.5">Category</th>
                      <th className="border-b p-2.5">Price (₹)</th>
                      <th className="border-b p-2.5">Stock</th>
                      <th className="border-b p-2.5">Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17221d]/5">
                    {excelPreviewItems.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-[11px] font-bold text-[#17221d]">
                          {row.sku_id}
                        </td>
                        <td className="p-2 font-medium">{row.item_name}</td>
                        <td className="p-2 text-[#6f7974]">{row.category}</td>
                        <td className="p-2 font-extrabold">₹{row.unit_price}</td>
                        <td className="p-2 font-bold">
                          {row.current_stock} {row.unit}
                        </td>
                        <td className="p-2 text-[#6f7974]">{row.preferred_supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {excelPreviewItems.length > 50 && (
                <p className="mt-1 text-right text-[10px] text-[#8a928e]">
                  Showing first 50 of {excelPreviewItems.length} items
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#17221d]/8 bg-[#fafbf8] px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-[#17221d]/15 px-5 py-2.5 text-xs font-bold text-[#17221d] hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={excelPreviewItems.length === 0 || isImporting}
            onClick={handleConfirmImport}
            className="flex items-center gap-2 rounded-full bg-[#17221d] px-6 py-2.5 text-xs font-black text-[#caff52] shadow transition hover:bg-[#25362e] disabled:opacity-50"
          >
            {isImporting ? (
              "Importing..."
            ) : (
              <>
                <Icon name="check" className="h-3.5 w-3.5" />
                Confirm &amp; Populate {excelPreviewItems.length > 0 ? `(${excelPreviewItems.length} Items)` : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
