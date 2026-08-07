import { CheckCircle2, Eye, XCircle, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DealSignal, Verdict } from "@/lib/types";
import { label } from "@/lib/format";

const VERDICT = {
  INVERTIR: { cls: "bg-emerald-600 text-white", icon: CheckCircle2 },
  VIGILAR: { cls: "bg-amber-500 text-white", icon: Eye },
  DESCARTAR: { cls: "bg-ink-300 text-white", icon: XCircle },
} as const;

export function VerdictBadge({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" }) {
  const conf = VERDICT[verdict] ?? VERDICT.DESCARTAR;
  const Icon = conf.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide",
        conf.cls,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <Icon size={size === "sm" ? 11 : 13} strokeWidth={2.6} />
      {label(verdict)}
    </span>
  );
}

const TONE = {
  positive: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  neutral: "bg-ink-100 text-ink-600 ring-ink-500/15",
  negative: "bg-rose-50 text-rose-700 ring-rose-600/15",
} as const;

const TONE_ICON = { positive: TrendingUp, neutral: Info, negative: AlertTriangle } as const;

export function DealFlags({ signals, max }: { signals: DealSignal[]; max?: number }) {
  const list = max ? signals.slice(0, max) : signals;
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((s) => {
        const Icon = TONE_ICON[s.tone];
        return (
          <span key={s.key} className={cn("chip", TONE[s.tone])}>
            <Icon size={11} strokeWidth={2.4} />
            {s.label}
          </span>
        );
      })}
    </div>
  );
}
