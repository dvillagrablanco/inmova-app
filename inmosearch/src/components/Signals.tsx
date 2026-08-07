import { cn } from "@/lib/cn";
import type { DealSignal, Verdict } from "@/lib/types";
import { label } from "@/lib/format";

const VERDICT_STYLES: Record<Verdict, string> = {
  INVERTIR: "bg-emerald-600 text-white",
  VIGILAR: "bg-amber-500 text-white",
  DESCARTAR: "bg-slate-400 text-white",
};

export function VerdictBadge({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold uppercase tracking-wide",
        VERDICT_STYLES[verdict],
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {label(verdict)}
    </span>
  );
}

const TONE_STYLES = {
  positive: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
  negative: "bg-rose-50 text-rose-700 ring-rose-600/20",
} as const;

export function DealFlags({ signals, max }: { signals: DealSignal[]; max?: number }) {
  const list = max ? signals.slice(0, max) : signals;
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((s) => (
        <span
          key={s.key}
          className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", TONE_STYLES[s.tone])}
        >
          {s.tone === "positive" ? "✓ " : s.tone === "negative" ? "! " : ""}
          {s.label}
        </span>
      ))}
    </div>
  );
}
