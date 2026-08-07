import Link from "next/link";
import { MapPin, Ruler, TrendingUp, KeyRound, ChevronRight } from "lucide-react";
import type { OpportunityDTO } from "@/lib/opportunity";
import { formatEur, formatPct, label } from "@/lib/format";
import { ScoreBadge } from "./ScoreBadge";
import { DealFlags, VerdictBadge } from "./Signals";
import type { Rating, Verdict } from "@/lib/types";

export function OpportunityCard({ o }: { o: OpportunityDTO }) {
  const a = o.analysis;
  const flipMargin = a?.flip?.marginOnCost ?? null;
  const netYield = a?.rental?.netYield ?? null;
  const discount = a?.discountToMarket ?? null;

  return (
    <Link
      href={`/opportunities/${o.id}`}
      className="card group flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        <ScoreBadge score={o.score ?? 0} rating={(o.rating as Rating) ?? "D"} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {o.verdict && <VerdictBadge verdict={o.verdict as Verdict} size="sm" />}
            {discount != null && discount > 0 && (
              <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-600/15">−{discount.toFixed(0)}% vs mercado</span>
            )}
          </div>
          <h3 className="truncate font-semibold text-ink-900">{o.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-400">
            <MapPin size={12} />
            {[o.city, o.province].filter(Boolean).join(", ") || "Ubicación no indicada"}
            <span className="text-ink-300">·</span>
            {label(o.propertyType)}
            {o.builtArea ? (
              <>
                <span className="text-ink-300">·</span>
                <Ruler size={12} />
                {o.builtArea} m²
              </>
            ) : null}
          </p>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-500" />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-lg font-bold text-ink-900">{formatEur(o.askingPrice)}</div>
          {a?.pricePerSqm && <div className="text-[11px] text-ink-400">{formatEur(a.pricePerSqm)}/m²</div>}
        </div>
        <div className="flex gap-1.5">
          <Metric icon={TrendingUp} label="Flip" value={formatPct(flipMargin)} good={flipMargin != null && flipMargin >= 15} />
          <Metric icon={KeyRound} label="Alq." value={formatPct(netYield)} good={netYield != null && netYield >= 6} />
        </div>
      </div>

      {a?.signals && a.signals.length > 0 && <DealFlags signals={a.signals} max={3} />}
    </Link>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  good,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className={"rounded-lg px-2.5 py-1 text-center " + (good ? "bg-emerald-50" : "bg-ink-50")}>
      <div className="flex items-center gap-1 text-[10px] font-medium text-ink-400">
        <Icon size={11} />
        {label}
      </div>
      <div className={"text-sm font-bold " + (good ? "text-emerald-700" : "text-ink-700")}>{value}</div>
    </div>
  );
}
