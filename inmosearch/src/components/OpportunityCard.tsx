import Link from "next/link";
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
    <Link href={`/opportunities/${o.id}`} className="card block p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <ScoreBadge score={o.score ?? 0} rating={(o.rating as Rating) ?? "D"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {o.verdict && <VerdictBadge verdict={o.verdict as Verdict} size="sm" />}
            <h3 className="truncate font-semibold text-slate-900">{o.title}</h3>
          </div>
          <p className="truncate text-sm text-slate-500">
            {[o.city, o.province].filter(Boolean).join(", ") || "Ubicación no indicada"} · {label(o.propertyType)}
            {o.builtArea ? ` · ${o.builtArea} m²` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold text-slate-900">{formatEur(o.askingPrice)}</span>
            {a?.pricePerSqm && <span className="text-slate-500">{formatEur(a.pricePerSqm)}/m²</span>}
            {discount != null && (
              <span className={discount > 0 ? "font-semibold text-emerald-700" : "text-slate-500"}>
                {discount > 0 ? "−" : "+"}
                {Math.abs(discount).toFixed(0)}% vs mercado
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{label(o.bestStrategy)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <Metric label="Flip" value={formatPct(flipMargin)} good={flipMargin != null && flipMargin >= 15} />
            <Metric label="Rent. neta" value={formatPct(netYield)} good={netYield != null && netYield >= 6} />
            <Metric label="CapEx" value={formatEur(o.capexEstimate)} />
          </div>
          {a?.signals && a.signals.length > 0 && (
            <div className="mt-2">
              <DealFlags signals={a.signals} max={4} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <span>
      <span className="text-slate-400">{label}: </span>
      <span className={good ? "font-semibold text-emerald-700" : "font-medium text-slate-700"}>{value}</span>
    </span>
  );
}
