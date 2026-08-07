// INMOSEARCH — Analítica por zona (mapa de calor)
// Agrega las oportunidades por zona (provincia o ciudad) para ver de un vistazo
// dónde hay más descuento, mejor rentabilidad y más oportunidades "Invertir".
import { listOpportunities } from "./opportunity";

export interface ZoneStat {
  zone: string;
  count: number;
  avgScore: number;
  avgDiscount: number | null; // % medio vs mercado
  avgNetYield: number | null; // % medio rent. neta
  avgFlipMargin: number | null; // % medio margen flip
  bestScore: number;
  invertir: number; // nº de oportunidades con veredicto INVERTIR
}

function avg(nums: number[]): number | null {
  const v = nums.filter((n) => Number.isFinite(n));
  if (v.length === 0) return null;
  return Math.round((v.reduce((s, n) => s + n, 0) / v.length) * 10) / 10;
}

/** Devuelve las estadísticas por zona, ordenadas por descuento medio desc. */
export async function zoneHeatmap(): Promise<ZoneStat[]> {
  const opportunities = await listOpportunities({});
  const groups = new Map<string, typeof opportunities>();

  for (const o of opportunities) {
    const zone = o.province || o.city || "Sin zona";
    const arr = groups.get(zone) ?? [];
    arr.push(o);
    groups.set(zone, arr);
  }

  const stats: ZoneStat[] = [];
  for (const [zone, arr] of groups) {
    const scores = arr.map((o) => o.score ?? 0);
    stats.push({
      zone,
      count: arr.length,
      avgScore: avg(scores) ?? 0,
      avgDiscount: avg(arr.map((o) => o.analysis?.discountToMarket ?? NaN).filter((n) => !Number.isNaN(n))),
      avgNetYield: avg(arr.map((o) => o.analysis?.rental?.netYield ?? NaN).filter((n) => !Number.isNaN(n))),
      avgFlipMargin: avg(arr.map((o) => o.analysis?.flip?.marginOnCost ?? NaN).filter((n) => !Number.isNaN(n))),
      bestScore: Math.max(...scores, 0),
      invertir: arr.filter((o) => o.verdict === "INVERTIR").length,
    });
  }

  stats.sort((a, b) => (b.avgDiscount ?? -Infinity) - (a.avgDiscount ?? -Infinity));
  return stats;
}
