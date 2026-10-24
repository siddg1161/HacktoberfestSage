import { getStatus, InventoryItem, statusStyle } from "./types";

export function StockBadge({ item }: { item: InventoryItem }) {
  const status = getStatus(item);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
