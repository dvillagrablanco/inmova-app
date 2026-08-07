import Link from "next/link";
import { listProfiles } from "@/lib/profiles";
import { connectorStatuses } from "@/lib/connectors";
import { recentSweepRuns } from "@/lib/sweep";
import { ProfileForm } from "@/components/ProfileForm";
import { ProfileActions } from "@/components/ProfileActions";
import { formatEur, label } from "@/lib/format";

export const dynamic = "force-dynamic";

const SCHEDULE_LABELS: Record<string, string> = {
  weekly: "semanal",
  daily: "diario",
  "6h": "cada 6 h",
  manual: "manual",
};

export default async function ProfilesPage() {
  const [profiles, connectors, runs] = await Promise.all([
    listProfiles(),
    Promise.resolve(connectorStatuses()),
    recentSweepRuns(6),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-brand-700 hover:underline">
            ← Radar
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Perfiles de búsqueda</h1>
          <p className="mt-1 text-sm text-slate-500">
            Define tu perfil de activos (buy-box) y las zonas. Los barridos buscan en las fuentes, deduplican, valoran y
            te marcan las que <span className="font-semibold text-emerald-700">encajan</span>.
          </p>
        </div>
      </div>

      <ProfileForm />

      {/* Fuentes */}
      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Fuentes disponibles</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {connectors.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <span className={"mt-1 inline-block h-2 w-2 shrink-0 rounded-full " + (c.configured ? "bg-emerald-500" : "bg-slate-300")} />
              <span>
                <span className="font-medium text-slate-800">{c.name}</span>
                <span className="block text-xs text-slate-400">{c.status}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Perfiles */}
      {profiles.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          Aún no tienes perfiles. Crea uno arriba para empezar a barrer oportunidades.
        </div>
      ) : (
        <section className="space-y-3">
          {profiles.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                      {p.active ? "activo" : "pausado"}
                    </span>
                    <span className="text-xs text-slate-400">· {SCHEDULE_LABELS[p.schedule] ?? p.schedule}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {p.zones.length ? p.zones.join(", ") : "todas las zonas"} · fuentes:{" "}
                    {p.sources.map((s) => s).join(", ") || "—"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    {p.propertyTypes.length > 0 && <span>Tipo: {p.propertyTypes.map(label).join("/")}</span>}
                    {p.maxPrice != null && <span>Hasta {formatEur(p.maxPrice)}</span>}
                    {p.maxPricePerSqm != null && <span>≤ {formatEur(p.maxPricePerSqm)}/m²</span>}
                    {p.minNetYield != null && <span>Rent. ≥ {p.minNetYield}%</span>}
                    {p.minFlipMargin != null && <span>Flip ≥ {p.minFlipMargin}%</span>}
                    {p.minDiscountToMarket != null && <span>Dto. ≥ {p.minDiscountToMarket}%</span>}
                    {p.lastRunAt && <span>Último barrido: {new Date(p.lastRunAt).toLocaleDateString("es-ES")}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <ProfileActions id={p.id} />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Últimos barridos */}
      {runs.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Últimos barridos</h2>
          <div className="space-y-1 text-xs text-slate-600">
            {runs.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-x-3">
                <span className="text-slate-400">{new Date(r.createdAt).toLocaleString("es-ES")}</span>
                <span className={statusColor(r.status)}>{r.status}</span>
                <span>
                  <b className="text-slate-800">{r.imported}</b> nuevas · <b className="text-emerald-700">{r.matched}</b> encajan ·{" "}
                  {r.duplicates} dup · {r.found} vistas
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Barrido automático semanal vía cron externo → <code className="rounded bg-slate-100 px-1">/api/sweep/run</code>{" "}
            (protegido con <code className="rounded bg-slate-100 px-1">SWEEP_SECRET</code>). Ver README.
          </p>
        </section>
      )}
    </div>
  );
}

function statusColor(s: string): string {
  if (s === "OK") return "font-semibold text-emerald-700";
  if (s === "PARTIAL") return "font-semibold text-amber-600";
  return "font-semibold text-rose-600";
}
