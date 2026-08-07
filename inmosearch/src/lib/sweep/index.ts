// INMOSEARCH — Motor de barridos (sweeps)
// Ejecuta un perfil de activos sobre las fuentes seleccionadas, deduplica,
// enriquece, analiza, comprueba el encaje con el buy-box y persiste. Registra
// cada ejecución en SweepRun.
import { prisma } from "@/lib/db";
import { normalizeToInput, searchConnectors, type RawListing } from "@/lib/connectors";
import { ingestOpportunity } from "@/lib/opportunity";
import { profileToInput, profilesDue, type ProfileDTO } from "@/lib/profiles";

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
  bySource: BySourceStat[];
}

const MAX_PER_SOURCE_ZONE = 25;

/** Ejecuta el barrido de un perfil. */
export async function runSweepForProfile(profile: ProfileDTO): Promise<SweepOutcome> {
  const input = profileToInput(profile);
  const zones = profile.zones.length > 0 ? profile.zones : [""]; // "" = sin filtro de zona
  const sources = profile.sources.length > 0 ? profile.sources : ["mock"];

  const bySource = new Map<string, BySourceStat>();
  let found = 0;
  let imported = 0;
  let matched = 0;
  let duplicates = 0;

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
          if (res.status === "duplicate") duplicates++;
          else {
            imported++;
            if (res.dto?.matched) matched++;
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
    },
  });
  await prisma.searchProfile.update({ where: { id: profile.id }, data: { lastRunAt: new Date() } });

  return { runId: run.id, profileId: profile.id, profileName: profile.name, status, found, imported, matched, duplicates, bySource: bySourceArr };
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
