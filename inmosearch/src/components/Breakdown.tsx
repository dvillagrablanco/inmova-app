import { formatEur } from "@/lib/format";
import type { CostLine } from "@/lib/types";

export function Breakdown({ lines, total, totalLabel }: { lines: CostLine[]; total?: number; totalLabel?: string }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {lines.map((l, i) => (
          <tr key={i} className="border-b border-slate-100 last:border-0">
            <td className="py-1.5 text-slate-600">{l.label}</td>
            <td className={"py-1.5 text-right font-medium " + (l.amount < 0 ? "text-rose-600" : "text-slate-800")}>
              {formatEur(l.amount)}
            </td>
          </tr>
        ))}
        {total !== undefined && (
          <tr className="border-t-2 border-slate-200">
            <td className="py-2 font-semibold text-slate-800">{totalLabel ?? "Total"}</td>
            <td className="py-2 text-right font-bold text-slate-900">{formatEur(total)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export function KeyValue({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "neutral" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-700" : "text-slate-900";
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={"mt-0.5 text-lg font-bold " + color}>{value}</div>
    </div>
  );
}
