/**
 * Rellena automáticamente las referencias catastrales faltantes consultando
 * la API pública del Catastro español.
 *
 * Proceso:
 * 1. Edificios sin ref → busca por dirección en el Catastro
 * 2. Edificios con ref (14 chars) → obtiene todas las fincas individuales
 * 3. Mapea fincas catastrales a unidades de la app por planta/puerta/tipo
 *
 * Uso: npx tsx scripts/auto-fill-catastro-refs.ts [--apply]
 */

import { PrismaClient } from '@prisma/client';
import {
  consultarEdificioPorRC,
  obtenerRefPorDireccion,
  type CatastroFinca,
} from '../lib/catastro-service';

const DRY_RUN = !process.argv.includes('--apply');
const prisma = new PrismaClient();

const norm = (s: string) => s.replace(/[ºª°\s]/g, '').toUpperCase();

function scoreMatch(
  unit: { numero: string; planta: number | null; tipo: string; superficie: number },
  finca: CatastroFinca,
): number {
  let score = 0;
  const fincaPlanta = parseInt(finca.planta) || 0;
  if (unit.planta !== null && unit.planta === fincaPlanta) score += 3;

  const unitN = norm(unit.numero);
  const puertaN = norm(finca.puerta);
  if (puertaN && unitN.includes(puertaN)) score += 5;
  if (puertaN && unitN.endsWith(puertaN)) score += 3;

  const uso = finca.uso.toLowerCase();
  if (unit.tipo === 'vivienda' && (uso.includes('vivienda') || uso.includes('residencial'))) score += 2;
  if (unit.tipo === 'local' && (uso.includes('comercial') || uso.includes('local'))) score += 2;
  if (unit.tipo === 'garaje' && (uso.includes('garaje') || uso.includes('aparcamiento'))) score += 2;
  if (unit.tipo === 'oficina' && uso.includes('oficina')) score += 2;

  if (unit.superficie > 0 && finca.superficie > 0) {
    const r = unit.superficie / finca.superficie;
    if (r > 0.8 && r < 1.2) score += 2;
  }

  return score;
}

async function main() {
  console.log('='.repeat(60));
  console.log(`AUTO-FILL CATASTRO ${DRY_RUN ? '(DRY-RUN)' : '(APLICANDO)'}`);
  console.log('='.repeat(60));
  if (DRY_RUN) console.log('Usa --apply para ejecutar.\n');

  const buildings = await prisma.building.findMany({
    where: { isDemo: false },
    include: {
      company: { select: { nombre: true } },
      units: {
        select: {
          id: true, numero: true, planta: true, tipo: true,
          superficie: true, referenciaCatastral: true,
        },
      },
    },
    orderBy: { nombre: 'asc' },
  });

  let bUpdated = 0, uUpdated = 0, queries = 0;

  for (const b of buildings) {
    const unitsWithoutRef = b.units.filter(u => !u.referenciaCatastral);
    if (unitsWithoutRef.length === 0 && b.referenciaCatastral) continue;

    console.log(`\n${b.company.nombre} | ${b.nombre} (${unitsWithoutRef.length}/${b.units.length} sin ref)`);

    // Step 1: Get building ref if missing
    let buildingRef = b.referenciaCatastral;
    if (!buildingRef && b.direccion) {
      console.log(`  Buscando ref por dirección: ${b.direccion}`);
      buildingRef = await obtenerRefPorDireccion(b.direccion);
      queries++;

      if (buildingRef) {
        console.log(`  ${DRY_RUN ? '[DRY-RUN] ' : '✓ '}Edificio → ${buildingRef}`);
        if (!DRY_RUN) {
          await prisma.building.update({ where: { id: b.id }, data: { referenciaCatastral: buildingRef } });
          bUpdated++;
        }
      } else {
        console.log('  ✗ No encontrada en catastro');
        continue;
      }
    }

    if (!buildingRef || unitsWithoutRef.length === 0) continue;

    // Step 2: Get all fincas from catastro
    console.log(`  Consultando fincas del edificio (${buildingRef.substring(0, 14)})...`);
    const catastro = await consultarEdificioPorRC(buildingRef.substring(0, 14));
    queries++;

    if (!catastro || catastro.fincas.length === 0) {
      console.log('  ✗ Sin fincas en catastro');
      continue;
    }
    console.log(`  ${catastro.fincas.length} fincas encontradas`);

    // Step 3: Match units to fincas
    const usedFincas = new Set<string>();
    for (const unit of unitsWithoutRef) {
      let best: CatastroFinca | null = null;
      let bestScore = 0;

      for (const finca of catastro.fincas) {
        if (usedFincas.has(finca.referenciaCatastral)) continue;
        const s = scoreMatch(
          { numero: unit.numero, planta: unit.planta, tipo: unit.tipo, superficie: unit.superficie },
          finca,
        );
        if (s > bestScore) { bestScore = s; best = finca; }
      }

      if (best && bestScore >= 4) {
        usedFincas.add(best.referenciaCatastral);
        console.log(`  ${DRY_RUN ? '[DRY-RUN] ' : '✓ '}${unit.numero} → ${best.referenciaCatastral} (score:${bestScore})`);
        if (!DRY_RUN) {
          await prisma.unit.update({ where: { id: unit.id }, data: { referenciaCatastral: best.referenciaCatastral } });
          uUpdated++;
        }
      }
    }

    // Rate limit: 1 req/sec to be polite with catastro API
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Edificios actualizados: ${bUpdated}`);
  console.log(`Unidades actualizadas: ${uUpdated}`);
  console.log(`Consultas al catastro: ${queries}`);
  if (DRY_RUN) console.log('\nPara aplicar: npx tsx scripts/auto-fill-catastro-refs.ts --apply');
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
