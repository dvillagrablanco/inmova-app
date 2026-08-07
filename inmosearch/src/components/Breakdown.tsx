import { formatEur } from "@/lib/format";
import type { CostLine } from "@/lib/types";

export function Breakdown({ lines, total, totalLabel }: { lines: CostLine[]; total?: number; totalLabel?: string }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {lines.map((l, i) => (
          <tr key={i} className="border-b border-ink-100 last:border-0">
            <td className="py-1.5 pr-2 text-ink-500">{l.label}</td>
            <td className={"whitespace-nowrap py-1.5 text-right font-semibold tabular-nums " + (l.amount < 0 ? "text-rose-600" : "text-ink-800")}>
              {formatEur(l.amount)}
            </td>
          </tr>
        ))}
        {total !== undefined && (
          <tr className="border-t-2 border-ink-200">
            <td className="py-2 font-semibold text-ink-800">{totalLabel ?? "Total"}</td>
            <td className="whitespace-nowrap py-2 text-right font-extrabold tabular-nums text-ink-900">{formatEur(total)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export function KeyValue({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "neutral" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-600" : "text-ink-900";
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3 shadow-soft">
      <div className="text-[11px] font-medium text-ink-400">{label}</div>
      <div className={"mt-0.5 text-base font-bold tabular-nums sm:text-lg " + color}>{value}</div>
    </div>
  );
}
