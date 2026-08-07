import Link from "next/link";
import { zoneHeatmap, type ZoneStat } from "@/lib/analytics";
import { formatPct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const zones = await zoneHeatmap();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-brand-700 hover:underline">
          ← Radar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Mapa de calor por zona</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dónde están las oportunidades. Color según el <b>descuento medio frente a mercado</b>. Ordenado de mayor a
          menor descuento.
        </p>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Menor descuento</span>
        <div className="h-3 w-40 rounded" style={{ background: "linear-gradient(90deg, #fecaca, #fde68a, #bbf7d0, #22c55e)" }} />
        <span>Mayor descuento</span>
      </div>

      {zones.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          Aún no hay datos. Añade o importa oportunidades para ver el mapa.
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {zones.map((z) => (
            <ZoneTile key={z.zone} z={z} />
          ))}
        </section>
      )}
    </div>
  );
}

function ZoneTile({ z }: { z: ZoneStat }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 shadow-sm" style={{ background: discountColor(z.avgDiscount) }}>
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-900">{z.zone.replace(/_/g, " ")}</h3>
        <span className="text-xs text-slate-600">{z.count}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{z.avgDiscount != null ? formatPct(z.avgDiscount, 0) : "—"}</div>
      <div className="text-[11px] text-slate-600">descuento medio</div>
      <div className="mt-2 space-y-0.5 text-xs text-slate-700">
        <div>Rent. neta media: {formatPct(z.avgNetYield)}</div>
        <div>Margen flip medio: {formatPct(z.avgFlipMargin)}</div>
        <div>
          Score medio: {z.avgScore} · mejor {z.bestScore}
        </div>
        {z.invertir > 0 && <div className="font-semibold text-emerald-800">{z.invertir} para invertir</div>}
      </div>
    </div>
  );
}

/** Escala de color (rojo→ámbar→verde) según el descuento medio (%). */
function discountColor(discount: number | null): string {
  if (discount == null) return "#f8fafc";
  const d = Math.max(-10, Math.min(30, discount));
  // -10 → rojo (0deg), 30 → verde (140deg)
  const hue = ((d + 10) / 40) * 140;
  return `hsl(${hue.toFixed(0)}, 70%, 92%)`;
}
