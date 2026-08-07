// INMOSEARCH — Motor de barridos (sweeps)
// Ejecuta un perfil de activos sobre las fuentes seleccionadas, deduplica,
// enriquece, analiza, comprueba el encaje con el buy-box y persiste. Registra
// cada ejecución en SweepRun.
import { prisma } from "@/lib/db";
import { normalizeToInput, searchConnectors, type RawListing } from "@/lib/connectors";
import { ingestOpportunity, type OpportunityDTO } from "@/lib/opportunity";
import { profileToInput, profilesDue, type ProfileDTO } from "@/lib/profiles";
import { alertsConfigured, buildDigest, deliverDigest } from "@/lib/alerts";

export interface BySourceStat {
  source: string;
  found: number;
  error?: string;
}

export interface SweepOutcome {
  runId: string;
  profileId: string;
  profileName: string;
  status: "OK" | "PARTIAL" | "ERROR";
  found: number;
  imported: number;
  matched: number;
  duplicates: number;
  updated: number; // duplicados con cambio de precio (actualizados)
  priceDrops: number; // de los actualizados, cuántos bajaron de precio
  bySource: BySourceStat[];
  alertStatus?: string; // resumen de la entrega de alertas
}

const MAX_PER_SOURCE_ZONE = 25;

/** Ejecuta el barrido de un perfil. */
export async function runSweepForProfile(profile: ProfileDTO): Promise<SweepOutcome> {
  const input = profileToInput(profile);
  const zones = profile.zones.length > 0 ? profile.zones : [""]; // "" = sin filtro de zona
  const sources = profile.sources.length > 0 ? profile.sources : ["mock"];

  const bySource = new Map<string, BySourceStat>();
  const newMatched: OpportunityDTO[] = [];
  let found = 0;
  let imported = 0;
  let matched = 0;
  let duplicates = 0;
  let updated = 0;
  let priceDrops = 0;

  for (const zone of zones) {
    const results = await searchConnectors(
      {
        location: zone || undefined,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        maxResults: MAX_PER_SOURCE_ZONE,
      },
      sources
    );

    for (const r of results) {
      const agg = bySource.get(r.connectorId) ?? { source: r.connectorId, found: 0 };
      if (r.error) agg.error = r.error;
      agg.found += r.listings.length;
      bySource.set(r.connectorId, agg);
      found += r.listings.length;

      for (const listing of r.listings) {
        try {
          const res = await ingestOpportunity(normalizeToInput(listing, r.connectorId), {
            profileId: profile.id,
            profileInput: input,
            dedupKey: dedupKeyFor(r.connectorId, listing),
          });
          if (res.status === "duplicate") {
            duplicates++;
          } else if (res.status === "updated") {
            updated++;
            if (res.priceDropped) priceDrops++;
            // Una bajada de precio que ahora encaja es alertable.
            if (res.priceDropped && res.dto?.matched) newMatched.push(res.dto);
          } else {
            imported++;
            if (res.dto?.matched) {
              matched++;
              if (res.dto) newMatched.push(res.dto);
            }
          }
        } catch (e) {
          const cur = bySource.get(r.connectorId)!;
          cur.error = e instanceof Error ? e.message : String(e);
        }
      }
    }
  }

  const hasError = [...bySource.values()].some((v) => v.error);
  const status: SweepOutcome["status"] = hasError ? (imported > 0 ? "PARTIAL" : "ERROR") : "OK";
  const bySourceArr = [...bySource.values()];

  const run = await prisma.sweepRun.create({
    data: {
      profileId: profile.id,
      status,
      found,
      imported,
      matched,
      duplicates,
      bySource: JSON.stringify(bySourceArr),
      newMatchedIds: JSON.stringify(newMatched.map((d) => d.id)),
      notes: updated > 0 ? `${updated} actualizadas · ${priceDrops} bajadas de precio` : null,
    },
  });
  await prisma.searchProfile.update({ where: { id: profile.id }, data: { lastRunAt: new Date() } });

  // --- Alertas: entrega el digest de las nuevas oportunidades que encajan ---
  let alertStatus: string | undefined;
  if (newMatched.length > 0 && alertsConfigured()) {
    const digest = buildDigest(profile.name, run.id, newMatched);
    const delivery = await deliverDigest(digest);
    alertStatus = delivery.channels.map((c) => `${c.name}:${c.ok ? "ok" : c.error}`).join(", ") || "sin canales";
    await prisma.sweepRun.update({ where: { id: run.id }, data: { alertStatus } });
  }

  return { runId: run.id, profileId: profile.id, profileName: profile.name, status, found, imported, matched, duplicates, updated, priceDrops, bySource: bySourceArr, alertStatus };
}

/** Ejecuta todos los perfiles activos que tocan según su programación. */
export async function runDueSweeps(now = new Date()): Promise<SweepOutcome[]> {
  const due = await profilesDue(now);
  const outcomes: SweepOutcome[] = [];
  for (const p of due) {
    outcomes.push(await runSweepForProfile(p));
  }
  return outcomes;
}

/** Clave de deduplicación estable para evitar reimportar el mismo anuncio. */
function dedupKeyFor(connectorId: string, raw: RawListing): string {
  if (raw.sourceRef) return `${connectorId}:${raw.sourceRef}`;
  if (raw.sourceUrl) return `url:${raw.sourceUrl}`;
  return `k:${connectorId}:${norm(raw.title)}:${raw.price}`;
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

/** Últimas ejecuciones de barrido (para la UI). */
export async function recentSweepRuns(limit = 10) {
  return prisma.sweepRun.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
