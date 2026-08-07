import Link from "next/link";
import { Building2, CheckCircle2, Eye, Gauge, Sparkles, Plus } from "lucide-react";
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
    <div className="animate-fade-up space-y-6">
      <section>
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">Radar de oportunidades</h1>
        <p className="mt-1 text-sm text-ink-500">
          Cada oportunidad se valora con datos de mercado y se puntúa para flip y alquiler. Fíjate en las{" "}
          <span className="font-semibold text-emerald-700">Invertir</span>.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Building2} label="Oportunidades" value={String(stats.total)} />
        <Stat icon={CheckCircle2} label="Para invertir" value={String(stats.invertir)} tone="good" />
        <Stat icon={Eye} label="En vigilancia" value={String(stats.vigilar)} tone="warn" />
        <Stat icon={Gauge} label="Mejor score" value={String(stats.bestScore)} />
      </section>

      <QuickAdd />

      {radar.length > 0 && !verdict && !status && !profileId && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-emerald-700">
              <Sparkles size={15} /> Mejores oportunidades ahora
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {radar.map((o) => (
              <div key={o.id} className="rounded-xl2 bg-gradient-to-br from-emerald-400/70 to-emerald-500/40 p-[1.5px] shadow-soft">
                <div className="rounded-[calc(1rem-1.5px)]">
                  <OpportunityCard o={o} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <details className="card group overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink-700">
          Importar (conectores y alertas por email)
          <span className="text-ink-400 transition group-open:rotate-45">＋</span>
        </summary>
        <div className="space-y-3 border-t border-ink-100 p-4">
          <ImportPanel />
          <EmailImport />
        </div>
      </details>

      {profileId && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-800 ring-1 ring-inset ring-brand-600/15">
          <span>Mostrando oportunidades {matchedOnly ? "que encajan con" : "de"} un perfil.</span>
          <Link href="/" className="font-semibold hover:underline">
            Quitar filtro
          </Link>
        </div>
      )}

      <section className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {VERDICT_TABS.map((t) => {
          const active = (verdict ?? "") === t.key && !status && !profileId;
          const href = t.key ? `/?verdict=${t.key}` : "/";
          return (
            <Link
              key={t.key || "all"}
              href={href}
              className={
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset transition " +
                (active ? "bg-brand-600 text-white ring-brand-600 shadow-soft" : "bg-white text-ink-500 ring-ink-200 hover:bg-ink-50")
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

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  const color = tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-brand-600";
  return (
    <div className="card p-3.5 sm:p-4">
      <div className={"mb-1.5 inline-flex rounded-lg bg-ink-50 p-1.5 " + color}>
        <Icon size={16} strokeWidth={2.4} />
      </div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-0.5 text-xl font-extrabold text-ink-900 sm:text-2xl">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-8 text-center sm:p-12">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Building2 size={22} />
      </div>
      <h3 className="text-lg font-bold text-ink-900">Aún no hay oportunidades aquí</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-500">
        Pega un anuncio en «Alta rápida» arriba, conéctate a Idealista/Fotocasa, o carga datos de ejemplo con{" "}
        <code className="rounded bg-ink-100 px-1">npm run db:seed</code>.
      </p>
      <div className="mt-4 flex justify-center">
        <Link href="/opportunities/new" className="btn-primary">
          <Plus size={16} /> Alta manual
        </Link>
      </div>
    </div>
  );
}
