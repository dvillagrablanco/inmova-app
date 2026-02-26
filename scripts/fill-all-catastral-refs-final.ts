/**
 * Rellena TODAS las referencias catastrales faltantes de Viroda y Rovida.
 *
 * Estrategia por tipo:
 * - Garajes (cuotas indivisas): asigna ref del edificio (la plaza no tiene ref propia)
 * - Viviendas/locales: consulta API Catastro para obtener ref individual
 * - Garajes M. Pelayo 17: tiene refs individuales de escritura 1368
 * - Terrenos/naves: asigna ref del edificio
 *
 * Uso: npx tsx scripts/fill-all-catastral-refs-final.ts [--apply]
 */

import { PrismaClient } from '@prisma/client';

const DRY_RUN = !process.argv.includes('--apply');
const prisma = new PrismaClient();

// Refs catastrales de garajes M. Pelayo 17 (de escritura 1368)
const MPELAYO_GARAJE_REFS: Record<string, string> = {
  '76': '3023206UM7532S01360K',
  '81': '3023206UM7532S0141AB',
  '13': '3023206UM7532S0070TF',
  '16': '3023206UM7532500731J',
  '18': '3023206UM7532S0075PL',
  '19': '3023206UM7532S0076AB',
  '20': '3023206UM7532S0077SZ',
  '26': '3023206UM7532S0083GO',
  '27': '3023206UM753250084HW',
  '28': '3023206UM7532S0085JE',
  '29': '3023206UM7532S0086KR',
  '30': '3023206UM7532S0087LT',
  '31': '3023206UM7532S0088BY',
  '32': '3023206UM7532S0089ZU',
  '33': '3023206UM7532S0090LT',
  '34': '3023206UM7532S0091BY',
  '35': '3023206UM7532S0092ZU',
  '36': '3023206UM7532S0093XI',
  '38': '3023206UM7532S500950P',
  '84': '3023206UM7532S0098RD',
  '85': '3023206UM7532S0099TF',
  '118': '3023206UM7532S0098RD',
  '119': '3023206UM7532S0099TF',
};

// Refs de escritura Reina 15 para plantas 4A/4B/4C (escritura 441)
const REINA_EXTRA: Record<string, string> = {
  '4A': '0749012VK4704H1015XF',
  '4B': '0749012VK4704H1016SM',
  '4C': '0749012VK4704H1017DQ',
};

// Refs Camilo José Cela Marbella (escritura 1369 Incofasa→Viroda)
const CJC_REFS: Record<string, string> = {
  '4ºI': '0121101UF3402S0040HU',
  'Garaje': '0121101UF3402S0124OM',
};

// Ref de Menéndez Pelayo Viroda (escritura 1369)
const MPELAYO_VIRODA: Record<string, string> = {
  '1D': '3023207UM7532S0005HH',
  '4D': '3023207UM7532S0011LL',
  'ATICO': '3023207UM7532S0012BB',
  'Ático': '3023207UM7532S0012BB',
};

const norm = (s: string) => s.replace(/[ºª°\s]/g, '').toUpperCase();

async function queryCatastroForUnits(buildingRef14: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rc1 = buildingRef14.substring(0, 7);
    const rc2 = buildingRef14.substring(7, 14);
    const url = `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc1}${rc2}`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return map;
    const xml = await resp.text();

    const blocks = xml.match(/<rcdnp>[\s\S]*?<\/rcdnp>/g) || [];
    for (const block of blocks) {
      const pc1 = block.match(/<pc1>([^<]+)<\/pc1>/)?.[1] || '';
      const pc2 = block.match(/<pc2>([^<]+)<\/pc2>/)?.[1] || '';
      const car = block.match(/<car>([^<]+)<\/car>/)?.[1] || '';
      const cc1 = block.match(/<cc1>([^<]*)<\/cc1>/)?.[1] || '';
      const cc2 = block.match(/<cc2>([^<]*)<\/cc2>/)?.[1] || '';
      const pt = block.match(/<pt>([^<]*)<\/pt>/)?.[1] || '';
      const pu = block.match(/<pu>([^<]*)<\/pu>/)?.[1] || '';

      const ref = `${pc1}${pc2}${car}${cc1}${cc2}`.trim();
      if (ref.length >= 18 && (pt || pu)) {
        const key = `${pt}_${pu}`.toUpperCase();
        map.set(key, ref);
      }
    }
  } catch { /* API error, continue */ }
  return map;
}

async function main() {
  console.log('='.repeat(60));
  console.log(`FILL ALL CATASTRAL REFS ${DRY_RUN ? '(DRY-RUN)' : '(APLICANDO)'}`);
  console.log('='.repeat(60));

  const companies = await prisma.company.findMany({
    where: { nombre: { in: ['Viroda Inversiones S.L.', 'Rovida S.L.'] } },
  });

  let totalUpdated = 0;
  let totalCatastroQueries = 0;

  for (const co of companies) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`${co.nombre}`);
    console.log('═'.repeat(50));

    const buildings = await prisma.building.findMany({
      where: { companyId: co.id, isDemo: false },
      include: {
        units: {
          where: { referenciaCatastral: null },
          select: { id: true, numero: true, planta: true, tipo: true, superficie: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    for (const b of buildings) {
      if (b.units.length === 0) continue;

      console.log(`\n  ${b.nombre} (${b.units.length} sin ref) [${b.referenciaCatastral || 'NO REF'}]`);
      const bRef = b.referenciaCatastral;

      // Strategy 1: Garajes que son cuotas indivisas → asignar ref del edificio
      if (b.nombre.includes('Espronceda') || b.nombre.includes('Hernández de Tejada')) {
        for (const u of b.units) {
          if (bRef) {
            if (!DRY_RUN) {
              await prisma.unit.update({ where: { id: u.id }, data: { referenciaCatastral: bRef } });
            }
            totalUpdated++;
          }
        }
        console.log(`    → ${b.units.length} plazas ← ref edificio ${bRef}`);
        continue;
      }

      // Strategy 2: Garajes M. Pelayo 17 → refs individuales de escritura 1368
      if (b.nombre.includes('Menéndez Pelayo') && b.nombre.includes('17') || b.nombre.includes('Garajes Menéndez')) {
        for (const u of b.units) {
          const num = u.numero.replace(/[^\d]/g, '');
          const parenthetical = u.numero.match(/\((\d+)\)/)?.[1];
          const ref = MPELAYO_GARAJE_REFS[parenthetical || num];
          if (ref) {
            if (!DRY_RUN) {
              await prisma.unit.update({ where: { id: u.id }, data: { referenciaCatastral: ref } });
            }
            console.log(`    ✓ ${u.numero} → ${ref}`);
            totalUpdated++;
          } else if (bRef) {
            if (!DRY_RUN) {
              await prisma.unit.update({ where: { id: u.id }, data: { referenciaCatastral: bRef } });
            }
            totalUpdated++;
          }
        }
        continue;
      }

      // Strategy 3: Refs manuales de escrituras
      if (b.nombre.includes('Camilo') || b.nombre.includes('Cela')) {
        for (const u of b.units) {
          const ref = CJC_REFS[u.numero];
          if (ref) {
            if (!DRY_RUN) {
              await prisma.unit.update({ where: { id: u.id }, data: { referenciaCatastral: ref } });
            }
            console.log(`    ✓ ${u.numero} → ${ref}`);
            totalUpdated++;
          }
        }
        continue;
      }

      if (b.nombre.includes('Menendez Pelayo') && co.nombre.includes('Viroda')) {
        for (const u of b.units) {
          const ref = MPELAYO_VIRODA[u.numero] || MPELAYO_VIRODA[norm(u.numero)];
          if (ref) {
            if (!DRY_RUN) {
              await prisma.unit.update({ where: { id: u.id }, data: { referenciaCatastral: ref } });
            }
            console.log(`    ✓ ${u.numero} → ${ref}`);
            totalUpdated++;
          }
        }
        continue;
      }

      if (b.nombre.includes('Reina') && co.nombre.includes('Viroda')) {
        for (const u of b.units) {
          const ref = REINA_EXTRA[norm(u.numero)];
          if (ref) {
            if (!DRY_RUN) {
              await prisma.unit.update({ where: { id: u.id }, data: { referenciaCatastral: ref } });
            }
            console.log(`    ✓ ${u.numero} → ${ref}`);
            totalUpdated++;
          }
        }
      }

      // Strategy 4: Consultar API Catastro para viviendas/locales
      if (bRef && bRef.length >= 14 && b.units.some(u => u.tipo === 'vivienda' || u.tipo === 'local' || u.tipo === 'oficina')) {
        console.log(`    Consultando Catastro (${bRef.substring(0, 14)})...`);
        const catastroMap = await queryCatastroForUnits(bRef.substring(0, 14));
        totalCatastroQueries++;

        if (catastroMap.size > 0) {
          console.log(`    ${catastroMap.size} fincas del catastro`);

          for (const u of b.units) {
            if (u.referenciaCatastral) continue;

            // Try matching by planta + letra
            const planta = u.planta !== null ? String(u.planta) : '';
            const letra = u.numero.match(/[A-Z]$/)?.[0] || u.numero.match(/Lt\.?\s*([A-Z])/)?.[1] || '';

            let bestRef = '';
            let bestScore = 0;

            for (const [key, ref] of catastroMap) {
              const [kPlanta, kPuerta] = key.split('_');
              let score = 0;
              if (planta && kPlanta === planta) score += 3;
              if (planta && kPlanta === `0${planta}`) score += 3;
              if (letra && kPuerta?.includes(letra)) score += 5;
              if (score > bestScore) { bestScore = score; bestRef = ref; }
            }

            if (bestRef && bestScore >= 5) {
              if (!DRY_RUN) {
                await prisma.unit.update({ where: { id: u.id }, data: { referenciaCatastral: bestRef } });
              }
              console.log(`    ✓ ${u.numero} → ${bestRef} (score:${bestScore})`);
              totalUpdated++;
            }
          }
        }

        await new Promise(r => setTimeout(r, 1500));
      }

      // Strategy 5: Para unidades restantes sin ref, asignar ref edificio si existe
      const remaining = await prisma.unit.findMany({
        where: { buildingId: b.id, referenciaCatastral: null },
        select: { id: true, numero: true },
      });

      if (remaining.length > 0 && bRef) {
        for (const u of remaining) {
          if (!DRY_RUN) {
            await prisma.unit.update({ where: { id: u.id }, data: { referenciaCatastral: bRef } });
          }
          totalUpdated++;
        }
        console.log(`    → ${remaining.length} restantes ← ref edificio ${bRef}`);
      }
    }
  }

  // Final count
  const totalWithout = await prisma.unit.count({
    where: {
      referenciaCatastral: null,
      building: {
        isDemo: false,
        company: { nombre: { in: ['Viroda Inversiones S.L.', 'Rovida S.L.'] } },
      },
    },
  });

  const totalWith = await prisma.unit.count({
    where: {
      referenciaCatastral: { not: null },
      building: {
        isDemo: false,
        company: { nombre: { in: ['Viroda Inversiones S.L.', 'Rovida S.L.'] } },
      },
    },
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Actualizadas: ${totalUpdated}`);
  console.log(`Consultas Catastro: ${totalCatastroQueries}`);
  console.log(`Con ref: ${DRY_RUN ? '(sin aplicar)' : totalWith}`);
  console.log(`Sin ref: ${DRY_RUN ? '(sin aplicar)' : totalWithout}`);
  if (DRY_RUN) console.log('\nPara aplicar: npx tsx scripts/fill-all-catastral-refs-final.ts --apply');
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
