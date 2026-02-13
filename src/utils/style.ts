import type { Case, SortField, SortDir } from "../types/case";

export function statusColor(code: number): { bg: string; text: string; dot: string } {
  switch (code) {
    case 0: return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
    case 1: return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
    case 2: return { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" };
    default: return { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" };
  }
}

export function priorityBadge(code: number): { label: string; color: string } {
  switch (code) {
    case 1: return { label: "High", color: "text-red-600 bg-red-50 border-red-200" };
    case 2: return { label: "Normal", color: "text-amber-600 bg-amber-50 border-amber-200" };
    case 3: return { label: "Low", color: "text-green-600 bg-green-50 border-green-200" };
    default: return { label: "—", color: "text-gray-500 bg-gray-50 border-gray-200" };
  }
}

export function compareCases(a: Case, b: Case, field: SortField, dir: SortDir): number {
  let av: string | number = "";
  let bv: string | number = "";

  switch (field) {
    case "ticketnumber":
    case "title":
      av = (a[field] ?? "").toString().toLowerCase();
      bv = (b[field] ?? "").toString().toLowerCase();
      break;
    case "statuscode":
    case "prioritycode":
      av = a[field] ?? 0;
      bv = b[field] ?? 0;
      break;
    case "createdon":
    case "modifiedon":
      av = a[field] ?? "";
      bv = b[field] ?? "";
      break;
  }

  const cmp = av < bv ? -1 : av > bv ? 1 : 0;
  return dir === "asc" ? cmp : -cmp;
}
