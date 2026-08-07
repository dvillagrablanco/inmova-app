import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/opportunity";
import { ScoreBadge } from "@/components/ScoreBadge";
import { OpportunityActions } from "@/components/OpportunityActions";
import { Breakdown, KeyValue } from "@/components/Breakdown";
import { formatEur, formatPct, label } from "@/lib/format";
import type { Rating } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const o = await getOpportunity(params.id);
  if (!o) notFound();

  const a = o.analysis;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-brand-700 hover:underline">
        ← Volver al ranking
      </Link>

      {/* Cabecera */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <ScoreBadge score={o.score ?? 0} rating={(o.rating as Rating) ?? "D"} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900">{o.title}</h1>
            <p className="text-sm text-slate-500">
              {[o.address, o.city, o.province].filter(Boolean).join(", ") || "Ubicación no indicada"} · {label(o.propertyType)}
              {o.builtArea ? ` · ${o.builtArea} m²` : ""}
              {o.rooms ? ` · ${o.rooms} hab.` : ""}
              {o.baths ? ` · ${o.baths} baños` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-lg font-bold text-slate-900">{formatEur(o.askingPrice)}</span>
              {a?.pricePerSqm && <span className="text-slate-500">{formatEur(a.pricePerSqm)}/m²</span>}
              <Pill>{label(o.bestStrategy)}</Pill>
              <Pill>{label(o.status)}</Pill>
              <Pill>Origen: {label(o.source)}</Pill>
              {o.sourceUrl && (
                <a href={o.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                  Ver anuncio ↗
                </a>
              )}
            </div>
          </div>
        </div>
        {a?.reasons && a.reasons.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
            {a.reasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        )}
      </div>

      <OpportunityActions id={o.id} status={o.status} />

      {a?.warnings && a.warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          <div className="mb-1 font-semibold">Avisos del análisis</div>
          <ul className="space-y-0.5">
            {a.warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Métricas clave */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KeyValue label="ARV (venta objetivo)" value={formatEur(a?.arv)} />
        <KeyValue
          label="Dto. all-in vs ARV"
          value={formatPct(a?.discountToArv)}
          tone={a?.discountToArv != null ? (a.discountToArv > 0 ? "good" : "bad") : "neutral"}
        />
        <KeyValue label="CapEx estimado" value={formatEur(o.capexEstimate)} />
        <KeyValue label="CapEx €/m²" value={o.capexPerSqm ? formatEur(o.capexPerSqm) : "—"} />
      </section>

      {/* Escenarios */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* FLIP */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Escenario Flip</h2>
            {a?.flip && (
              <span className={a.flip.meetsThreshold ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-rose-600"}>
                {a.flip.meetsThreshold ? "Cumple umbral" : "No cumple"}
              </span>
            )}
          </div>
          {a?.flip ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <KeyValue label="Beneficio bruto" value={formatEur(a.flip.grossProfit)} tone={a.flip.grossProfit > 0 ? "good" : "bad"} />
                <KeyValue label="Margen s/ coste" value={formatPct(a.flip.marginOnCost)} tone={a.flip.marginOnCost >= 15 ? "good" : "neutral"} />
                <KeyValue label="ROI s/ capital" value={formatPct(a.flip.roiOnEquity)} />
                <KeyValue label="ROI anualizado" value={formatPct(a.flip.annualizedRoi)} />
              </div>
              <Breakdown lines={a.flip.breakdown} total={a.flip.totalInvestment} totalLabel="Inversión total" />
              <p className="mt-2 text-xs text-slate-400">
                Capital propio estimado: {formatEur(a.flip.equity)} (LTV {(a.assumptions.ltv * 100).toFixed(0)}%).
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No calculable: falta ARV (€/m² objetivo y superficie).</p>
          )}
        </div>

        {/* ALQUILER */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Escenario Alquiler</h2>
            {a?.rental && (
              <span className={a.rental.meetsThreshold ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-rose-600"}>
                {a.rental.meetsThreshold ? "Cumple umbral" : "No cumple"}
              </span>
            )}
          </div>
          {a?.rental ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <KeyValue label="Rent. bruta" value={formatPct(a.rental.grossYield)} />
                <KeyValue label="Rent. neta" value={formatPct(a.rental.netYield)} tone={a.rental.netYield >= 6 ? "good" : "neutral"} />
                <KeyValue
                  label="Cashflow mensual"
                  value={formatEur(a.rental.monthlyCashflow)}
                  tone={a.rental.monthlyCashflow >= 0 ? "good" : "bad"}
                />
                <KeyValue label="Cash-on-cash" value={formatPct(a.rental.cashOnCash)} />
              </div>
              <Breakdown lines={a.rental.breakdown} total={a.rental.annualCashflow} totalLabel="Cashflow anual" />
              <p className="mt-2 text-xs text-slate-400">
                NOI anual: {formatEur(a.rental.noi)} · Capital propio: {formatEur(a.rental.equity)}.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No calculable: falta la renta de mercado (€/mes).</p>
          )}
        </div>
      </section>

      {/* CapEx */}
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">CapEx — Reforma</h2>
          <span className="text-xs text-slate-500">
            {label(o.capexLevel)} · fuente: {label(o.capexSource)}
          </span>
        </div>
        {o.capexBreakdown.length > 0 ? (
          <Breakdown lines={o.capexBreakdown} total={o.capexEstimate ?? undefined} totalLabel="Total reforma" />
        ) : (
          <p className="text-sm text-slate-400">Sin desglose.</p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Para estimar el CapEx a partir de las fotos, usa el botón «CapEx con IA» (requiere imágenes y ANTHROPIC_API_KEY).
        </p>
      </section>

      {o.description && (
        <section className="card p-5">
          <h2 className="mb-2 font-semibold text-slate-900">Descripción</h2>
          <p className="whitespace-pre-line text-sm text-slate-600">{o.description}</p>
        </section>
      )}

      {a && (
        <section className="card p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Supuestos del análisis</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-3">
            <Assumption label="LTV financiación" value={formatPct(a.assumptions.ltv * 100, 0)} />
            <Assumption label="Tipo hipoteca (TIN)" value={formatPct(a.assumptions.mortgageRate * 100)} />
            <Assumption label="Plazo hipoteca" value={`${a.assumptions.mortgageTermYears} años`} />
            <Assumption label="Duración proyecto (flip)" value={`${a.assumptions.projectMonths} meses`} />
            <Assumption label="Comisión venta" value={formatPct(a.assumptions.sellAgencyPct * 100)} />
            <Assumption label="Vacancia" value={formatPct(a.assumptions.vacancyPct * 100, 0)} />
            <Assumption label="Umbral margen flip" value={formatPct(a.assumptions.minFlipMargin, 0)} />
            <Assumption label="Umbral rent. neta" value={formatPct(a.assumptions.minNetYield, 0)} />
          </div>
        </section>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
      {children}
    </span>
  );
}

function Assumption({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-slate-100 py-1">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
