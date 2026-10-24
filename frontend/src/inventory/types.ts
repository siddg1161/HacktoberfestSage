export type StockStatus = "In stock" | "Low stock" | "Out of stock";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  industry?: string;
  unit: string;
  quantity: number;
  reorderAt: number;
  unitCost: number;
  gstRate?: number;
  supplier: string;
  leadTimeDays?: number;
  location: string;
  lastUpdated: string;
};

export type InventoryIcon =
  | "arrow"
  | "box"
  | "check"
  | "chevron"
  | "file"
  | "minus"
  | "plus"
  | "search"
  | "warning"
  | "x";

export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const getStatus = (item: InventoryItem): StockStatus => {
  if (item.quantity === 0) return "Out of stock";
  if (item.quantity <= item.reorderAt) return "Low stock";
  return "In stock";
};

export const statusStyle: Record<StockStatus, string> = {
  "In stock": "bg-[#e8f7d3] text-[#4d6817]",
  "Low stock": "bg-[#fff2cf] text-[#84600b]",
  "Out of stock": "bg-[#ffe2de] text-[#9b3d34]",
};

export const TRADES = ["All Trades", "Electrical", "Plumbing", "HVAC", "Automotive", "General"];
