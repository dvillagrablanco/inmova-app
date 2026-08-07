import Link from "next/link";
import { listOpportunities } from "@/lib/opportunity";
import { OpportunityCard } from "@/components/OpportunityCard";
import { ImportPanel } from "@/components/ImportPanel";
import { EmailImport } from "@/components/EmailImport";
import { QuickAdd } from "@/components/QuickAdd";
import { formatEur } from "@/lib/format";

export const dynamic = "force-dynamic";

const VERDICT_TABS = [
  { key: "", label: "Todas" },
  { key: "INVERTIR", label: "Invertir" },
  { key: "VIGILAR", label: "Vigilar" },
  { key: "DESCARTAR", label: "Descartar" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { verdict?: string; status?: string; profileId?: string; matched?: string };
}) {
  const verdict = searchParams.verdict || undefined;
  const status = searchParams.status || undefined;
  const profileId = searchParams.profileId || undefined;
  const matchedOnly = searchParams.matched === "1";

  const all = await listOpportunities({});
  const opportunities = await listOpportunities({ verdict, status, profileId, matchedOnly });

  const radar = all.filter((o) => o.verdict === "INVERTIR").slice(0, 3);
  const stats = {
    total: all.length,
    invertir: all.filter((o) => o.verdict === "INVERTIR").length,
    vigilar: all.filter((o) => o.verdict === "VIGILAR").length,
    bestScore: all.reduce((m, o) => Math.max(m, o.score ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Radar de oportunidades</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cada oportunidad se valora con datos de mercado y se puntúa para flip y alquiler. Fíjate en las marcadas{" "}
          <span className="font-semibold text-emerald-700">Invertir</span>.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Oportunidades" value={String(stats.total)} />
        <Stat label="Para invertir" value={String(stats.invertir)} tone="good" />
        <Stat label="En vigilancia" value={String(stats.vigilar)} />
        <Stat label="Mejor score" value={String(stats.bestScore)} />
      </section>

      <QuickAdd />

      {profileId && (
        <div className="flex items-center justify-between rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800 ring-1 ring-inset ring-brand-600/20">
          <span>Mostrando oportunidades {matchedOnly ? "que encajan con" : "de"} un perfil de búsqueda.</span>
          <Link href="/" className="font-medium hover:underline">
            Quitar filtro
          </Link>
        </div>
      )}

      {/* Radar: mejores oportunidades */}
      {radar.length > 0 && !verdict && !status && !profileId && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Mejores oportunidades ahora
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {radar.map((o) => (
              <div key={o.id} className="rounded-xl ring-2 ring-emerald-400/60">
                <OpportunityCard o={o} />
              </div>
            ))}
          </div>
        </section>
      )}

      <ImportPanel />
      <EmailImport />

      <section className="flex flex-wrap items-center gap-2">
        {VERDICT_TABS.map((t) => {
          const active = (verdict ?? "") === t.key && !status;
          const href = t.key ? `/?verdict=${t.key}` : "/";
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
        <span className="mx-1 text-slate-300">|</span>
        <Link
          href="/?status=SHORTLISTED"
          className={
            "rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset " +
            (status === "SHORTLISTED"
              ? "bg-brand-600 text-white ring-brand-600"
              : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-100")
          }
        >
          Preseleccionadas
        </Link>
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

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={"mt-1 text-xl font-bold " + (tone === "good" ? "text-emerald-700" : "text-slate-900")}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-10 text-center">
      <h3 className="text-lg font-semibold text-slate-900">Aún no hay oportunidades aquí</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Pega un anuncio en «Alta rápida» arriba, importa desde un conector, o carga datos de ejemplo con{" "}
        <code className="rounded bg-slate-100 px-1">npm run db:seed</code>.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href="/opportunities/new" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + Alta manual
        </Link>
      </div>
    </div>
  );
}
