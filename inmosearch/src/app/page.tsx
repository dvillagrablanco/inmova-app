import Link from "next/link";
import { listOpportunities } from "@/lib/opportunity";
import { OpportunityCard } from "@/components/OpportunityCard";
import { ImportPanel } from "@/components/ImportPanel";
import { formatEur } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { key: "", label: "Todas" },
  { key: "NEW", label: "Nuevas" },
  { key: "SHORTLISTED", label: "Preseleccionadas" },
  { key: "PURSUING", label: "En curso" },
  { key: "DISCARDED", label: "Descartadas" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string; minScore?: string };
}) {
  const status = searchParams.status || undefined;
  const minScore = searchParams.minScore ? Number(searchParams.minScore) : undefined;
  const opportunities = await listOpportunities({ status, minScore });

  const all = await listOpportunities({});
  const stats = {
    total: all.length,
    topGrade: all.filter((o) => o.rating === "A" || o.rating === "B").length,
    bestScore: all.reduce((m, o) => Math.max(m, o.score ?? 0), 0),
    avgPrice: all.length ? Math.round(all.reduce((s, o) => s + o.askingPrice, 0) / all.length) : 0,
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Oportunidades</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ranking de oportunidades analizadas para flip y alquiler. Puntuación 0-100 según la mejor estrategia.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Oportunidades" value={String(stats.total)} />
        <Stat label="Grado A/B" value={String(stats.topGrade)} />
        <Stat label="Mejor score" value={String(stats.bestScore)} />
        <Stat label="Precio medio" value={formatEur(stats.avgPrice)} />
      </section>

      <ImportPanel />

      <section className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => {
          const active = (status ?? "") === t.key;
          const href = t.key ? `/?status=${t.key}` : "/";
          return (
            <Link
              key={t.key || "all"}
              href={href}
              className={
                "rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset " +
                (active
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-100")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </section>

      {opportunities.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} o={o} />
          ))}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-10 text-center">
      <h3 className="text-lg font-semibold text-slate-900">Aún no hay oportunidades</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Importa desde un conector (prueba la fuente de demostración arriba), da de alta una manualmente o carga los
        datos de ejemplo con <code className="rounded bg-slate-100 px-1">npm run db:seed</code>.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href="/opportunities/new" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + Nueva oportunidad
        </Link>
      </div>
    </div>
  );
}
