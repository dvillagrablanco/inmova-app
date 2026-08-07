import Link from "next/link";
import type { OpportunityDTO } from "@/lib/opportunity";
import { formatEur, formatPct, label } from "@/lib/format";
import { ScoreBadge } from "./ScoreBadge";
import type { Rating } from "@/lib/types";

export function OpportunityCard({ o }: { o: OpportunityDTO }) {
  const a = o.analysis;
  const flipMargin = a?.flip?.marginOnCost ?? null;
  const netYield = a?.rental?.netYield ?? null;

  return (
    <Link href={`/opportunities/${o.id}`} className="card block p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <ScoreBadge score={o.score ?? 0} rating={(o.rating as Rating) ?? "D"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">{o.title}</h3>
          </div>
          <p className="truncate text-sm text-slate-500">
            {[o.city, o.province].filter(Boolean).join(", ") || "Ubicación no indicada"} · {label(o.propertyType)}
            {o.builtArea ? ` · ${o.builtArea} m²` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold text-slate-900">{formatEur(o.askingPrice)}</span>
            {a?.pricePerSqm && <span className="text-slate-500">{formatEur(a.pricePerSqm)}/m²</span>}
            <Badge tone="brand">{label(o.bestStrategy)}</Badge>
            <Badge>{label(o.status)}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <Metric label="Flip margen" value={formatPct(flipMargin)} good={flipMargin != null && flipMargin >= 15} />
            <Metric label="Rent. neta" value={formatPct(netYield)} good={netYield != null && netYield >= 6} />
            <Metric label="CapEx" value={formatEur(o.capexEstimate)} />
            {a?.discountToArv != null && <Metric label="Dto. vs ARV" value={formatPct(a.discountToArv)} good={a.discountToArv > 0} />}
          </div>
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

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "brand" }) {
  const cls = tone === "brand" ? "bg-brand-50 text-brand-700 ring-brand-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>{children}</span>;
}
