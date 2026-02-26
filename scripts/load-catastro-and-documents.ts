/**
 * Script: Cargar fichas catastrales y documentos faltantes para Rovida y Viroda
 *
 * Funciones:
 * 1. Consulta API Catastro para cada edificio con ref catastral → actualiza datos
 * 2. Rellena refs catastrales individuales de unidades
 * 3. Registra documentos de seguros (Google Drive) para cada edificio
 * 4. Registra escrituras como documentos vinculados a edificios
 *
 * Uso:
 *   npx tsx scripts/load-catastro-and-documents.ts              # Dry-run
 *   npx tsx scripts/load-catastro-and-documents.ts --apply       # Aplicar cambios
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = !process.argv.includes('--apply');
const prisma = new PrismaClient();

// IDs reales de la BD de producción
const COMPANIES = ['cef19f55f7b6ce0637d5ffb53', 'cmkctneuh0001nokn7nvhuweq'];

// Google Drive carpetas de seguros
const SEGUROS_DRIVE_LINKS: Record<string, string> = {
  'cef19f55f7b6ce0637d5ffb53': 'https://drive.google.com/drive/folders/1tdvsqZ2d5lJZTx8bsMIY4Sk1BL0JGC8D',
  'cmkctneuh0001nokn7nvhuweq': 'https://drive.google.com/drive/folders/1tdvsqZ2d5lJZTx8bsMIY4Sk1BL0JGC8D',
};

// ============================================================================
// 1. CATASTRO API
// ============================================================================

const CATASTRO_BASE = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx';

interface CatastroFinca {
  referenciaCatastral: string;
  planta: string;
  puerta: string;
  uso: string;
  superficie: number;
}

interface CatastroResult {
  direccion: string;
  municipio: string;
  provincia: string;
  codigoPostal: string;
  anoConstruccion: number;
  superficieTotal: number;
  fincas: CatastroFinca[];
}

async function consultarCatastro(rc14: string): Promise<CatastroResult | null> {
  try {
    const rc1 = rc14.substring(0, 7);
    const rc2 = rc14.substring(7, 14);
    const url = `${CATASTRO_BASE}/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc1}${rc2}`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return null;
    const xml = await resp.text();

    const direccion = xml.match(/<ldt>([^<]+)<\/ldt>/)?.[1] || '';
    const cp = xml.match(/<dp>(\d+)<\/dp>/)?.[1] || '';
    const municipio = xml.match(/<nm>([^<]+)<\/nm>/)?.[1] || '';
    const provincia = xml.match(/<np>([^<]+)<\/np>/)?.[1] || '';
    const ano = parseInt(xml.match(/<ant>(\d+)<\/ant>/)?.[1] || '0');

    const fincas: CatastroFinca[] = [];
    const rcdnpBlocks = xml.match(/<rcdnp>[\s\S]*?<\/rcdnp>/g) || [];

    for (const block of rcdnpBlocks) {
      const pc1 = block.match(/<pc1>([^<]+)<\/pc1>/)?.[1] || '';
      const pc2 = block.match(/<pc2>([^<]+)<\/pc2>/)?.[1] || '';
      const car = block.match(/<car>([^<]+)<\/car>/)?.[1] || '';
      const cc1 = block.match(/<cc1>([^<]*)<\/cc1>/)?.[1] || '';
      const cc2 = block.match(/<cc2>([^<]*)<\/cc2>/)?.[1] || '';
      if (!pc1 || !pc2) continue;

      const ref = `${pc1}${pc2}${car}${cc1}${cc2}`.trim();
      if (ref.length < 18) continue;

      const pt = block.match(/<pt>([^<]*)<\/pt>/)?.[1] || '';
      const pu = block.match(/<pu>([^<]*)<\/pu>/)?.[1] || '';

      fincas.push({ referenciaCatastral: ref, planta: pt, puerta: pu, uso: '', superficie: 0 });
    }

    // Si no hubo rcdnp, intentar bloques <cons>
    if (fincas.length === 0) {
      const consBlocks = xml.match(/<cons>[\s\S]*?<\/cons>/g) || [];
      for (const block of consBlocks) {
        const uso = block.match(/<lcd>([^<]+)<\/lcd>/)?.[1] || '';
        const pt = block.match(/<pt>([^<]+)<\/pt>/)?.[1] || '';
        const pu = block.match(/<pu>([^<]+)<\/pu>/)?.[1] || '';
        const sup = parseInt(block.match(/<stl>(\d+)<\/stl>/)?.[1] || '0');
        if (sup > 0) {
          fincas.push({ referenciaCatastral: rc14, planta: pt, puerta: pu, uso, superficie: sup });
        }
      }
    }

    const superficieTotal = fincas.reduce((s, f) => s + f.superficie, 0);

    return { direccion, municipio, provincia, codigoPostal: cp, anoConstruccion: ano, superficieTotal, fincas };
  } catch (err: any) {
    console.error(`    ❌ Error catastro ${rc14}: ${err.message}`);
    return null;
  }
}

// ============================================================================
// 2. MATCHING UNIDADES CON FINCAS CATASTRALES
// ============================================================================

function matchUnitToFinca(
  unit: { numero: string; planta: number | null; tipo: string },
  fincas: CatastroFinca[]
): CatastroFinca | null {
  const unitPlanta = unit.planta !== null ? String(unit.planta) : '';
  const unitLetra = unit.numero.match(/[A-Z]$/)?.[0] || '';

  let best: CatastroFinca | null = null;
  let bestScore = 0;

  for (const f of fincas) {
    let score = 0;
    if (unitPlanta && (f.planta === unitPlanta || f.planta === `0${unitPlanta}`)) score += 3;
    if (unitLetra && f.puerta?.includes(unitLetra)) score += 5;
    // Match by numero if puerta contains it
    const numMatch = unit.numero.match(/(\d+)/);
    if (numMatch && f.puerta?.includes(numMatch[1])) score += 2;

    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }

  return bestScore >= 5 ? best : null;
}

// ============================================================================
// 3. LOAD ESCRITURAS METADATA
// ============================================================================

interface EscrituraData {
  numero: number;
  fecha: string;
  tipo: string;
  empresa: string;
  inmueble: string | null;
  edificio_app: string | null;
  precio_total: number | null;
  ref_catastral_principal?: string;
  archivo: string;
  notario?: string | null;
}

function loadEscriturasMetadata(): EscrituraData[] {
  const metaPath = path.join(process.cwd(), 'data', 'escrituras-metadata.json');
  if (!fs.existsSync(metaPath)) {
    console.warn('  ⚠️  data/escrituras-metadata.json no encontrado');
    return [];
  }
  const data = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  return data.escrituras || [];
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═'.repeat(70));
  console.log(`  CARGA DE FICHAS CATASTRALES Y DOCUMENTOS ${DRY_RUN ? '(DRY-RUN)' : '(APLICANDO)'}`);
  console.log('═'.repeat(70));

  const escrituras = loadEscriturasMetadata();
  console.log(`  📜 Escrituras cargadas: ${escrituras.length}`);

  let totalCatastroUpdated = 0;
  let totalUnitsUpdated = 0;
  let totalDocsCreated = 0;

  for (const companyId of COMPANIES) {
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, nombre: true } });
    if (!company) { console.warn(`  ⚠️  Company ${companyId} no encontrada`); continue; }

    console.log(`\n${'━'.repeat(70)}`);
    console.log(`  🏢 ${company.nombre} (${companyId})`);
    console.log('━'.repeat(70));

    const buildings = await prisma.building.findMany({
      where: { companyId, isDemo: false },
      include: {
        units: { select: { id: true, numero: true, planta: true, tipo: true, referenciaCatastral: true, superficie: true } },
        documents: { select: { id: true, tipo: true, nombre: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    console.log(`  📋 Edificios: ${buildings.length}\n`);

    for (const building of buildings) {
      console.log(`  ┌─ ${building.nombre}`);
      console.log(`  │  RC: ${building.referenciaCatastral || '(sin ref)'}`);
      console.log(`  │  Unidades: ${building.units.length}`);

      // ─────────────────────────────────────────────────────────────────
      // A) CATASTRO: Consultar API y actualizar datos
      // ─────────────────────────────────────────────────────────────────
      const rc = building.referenciaCatastral;
      if (rc && rc.length >= 14) {
        const rc14 = rc.substring(0, 14);
        console.log(`  │  🗺️  Consultando catastro (${rc14})...`);

        const catastro = await consultarCatastro(rc14);
        if (catastro) {
          console.log(`  │  ✅ Catastro: ${catastro.direccion}`);
          console.log(`  │     Municipio: ${catastro.municipio}, ${catastro.provincia} (${catastro.codigoPostal})`);
          console.log(`  │     Año: ${catastro.anoConstruccion} | Fincas: ${catastro.fincas.length}`);

          // Actualizar building (campo es anoConstructor; Building no tiene codigoPostal)
          if (!DRY_RUN && catastro.anoConstruccion > 1800) {
            await prisma.building.update({
              where: { id: building.id },
              data: { anoConstructor: catastro.anoConstruccion },
            });
            totalCatastroUpdated++;
          }

          // Actualizar unidades sin ref catastral
          const unitsWithoutRef = building.units.filter(u => !u.referenciaCatastral);
          if (unitsWithoutRef.length > 0 && catastro.fincas.length > 0) {
            for (const unit of unitsWithoutRef) {
              const finca = matchUnitToFinca(unit, catastro.fincas);
              if (finca) {
                if (!DRY_RUN) {
                  await prisma.unit.update({
                    where: { id: unit.id },
                    data: {
                      referenciaCatastral: finca.referenciaCatastral,
                      ...(finca.superficie > 0 ? { superficie: finca.superficie } : {}),
                    },
                  });
                }
                console.log(`  │  📌 ${unit.numero} → ${finca.referenciaCatastral}`);
                totalUnitsUpdated++;
              }
            }

            // Unidades restantes: asignar ref del edificio
            if (!DRY_RUN) {
              const stillWithout = await prisma.unit.count({
                where: { buildingId: building.id, referenciaCatastral: null },
              });
              if (stillWithout > 0 && rc) {
                await prisma.unit.updateMany({
                  where: { buildingId: building.id, referenciaCatastral: null },
                  data: { referenciaCatastral: rc },
                });
                console.log(`  │  📌 ${stillWithout} unidades restantes ← ref edificio`);
                totalUnitsUpdated += stillWithout;
              }
            }
          }
        } else {
          console.log(`  │  ⚠️  Sin respuesta del catastro`);
        }

        // Rate limit: 1.5s entre consultas
        await new Promise(r => setTimeout(r, 1500));
      }

      // ─────────────────────────────────────────────────────────────────
      // B) DOCUMENTO DE SEGURO: Crear si no existe
      // ─────────────────────────────────────────────────────────────────
      const hasSeguroDoc = building.documents.some(d => d.tipo === 'seguro');
      if (!hasSeguroDoc) {
        const driveLink = SEGUROS_DRIVE_LINKS[companyId];
        if (driveLink) {
          if (!DRY_RUN) {
            await prisma.document.create({
              data: {
                nombre: `Póliza de Seguro - ${building.nombre}`,
                tipo: 'seguro',
                cloudStoragePath: driveLink,
                buildingId: building.id,
                descripcion: `Documentación de seguros del edificio ${building.nombre}. Carpeta de Google Drive con pólizas vigentes.`,
                tags: ['seguros', 'poliza', 'google-drive', company.nombre.toLowerCase().replace(/\s+/g, '-')],
              },
            });
          }
          console.log(`  │  🛡️  Seguro registrado (Google Drive)`);
          totalDocsCreated++;
        }
      } else {
        console.log(`  │  ✅ Seguro ya existe`);
      }

      // ─────────────────────────────────────────────────────────────────
      // C) ESCRITURA: Vincular si existe en metadata
      // ─────────────────────────────────────────────────────────────────
      const hasEscrituraDoc = building.documents.some(d =>
        d.nombre.toLowerCase().includes('escritura') ||
        d.tipo === 'otro' && d.nombre.toLowerCase().includes('compraventa')
      );

      if (!hasEscrituraDoc) {
        // Buscar escritura que corresponda a este edificio
        const empresaKey = companyId === 'cef19f55f7b6ce0637d5ffb53' ? 'rovida' : 'viroda';
        const matchingEscritura = escrituras.find(e => {
          if (e.empresa !== empresaKey && e.empresa !== 'ambas') return false;
          if (!e.edificio_app) return false;
          const bName = building.nombre.toLowerCase();
          const eName = e.edificio_app.toLowerCase();
          return bName.includes(eName) || eName.includes(bName.split(' ')[0]);
        });

        if (matchingEscritura) {
          if (!DRY_RUN) {
            await prisma.document.create({
              data: {
                nombre: `Escritura ${matchingEscritura.numero} - ${matchingEscritura.tipo} - ${building.nombre}`,
                tipo: 'otro',
                cloudStoragePath: matchingEscritura.archivo,
                buildingId: building.id,
                descripcion: `Escritura nº ${matchingEscritura.numero} (${matchingEscritura.fecha}). ${matchingEscritura.tipo}. Notario: ${matchingEscritura.notario || 'N/D'}. Precio: ${matchingEscritura.precio_total ? '€' + matchingEscritura.precio_total.toLocaleString() : 'N/D'}.`,
                tags: ['escritura', 'compraventa', 'notarial', company.nombre.toLowerCase().replace(/\s+/g, '-')],
              },
            });
          }
          console.log(`  │  📜 Escritura ${matchingEscritura.numero} registrada`);
          totalDocsCreated++;
        } else {
          console.log(`  │  ⚠️  Sin escritura asociada en metadata`);
        }
      } else {
        console.log(`  │  ✅ Escritura ya existe`);
      }

      console.log(`  └─\n`);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // RESUMEN FINAL
  // ─────────────────────────────────────────────────────────────────
  console.log('═'.repeat(70));
  console.log('  📊 RESUMEN');
  console.log('═'.repeat(70));
  console.log(`  Edificios actualizados (catastro): ${totalCatastroUpdated}`);
  console.log(`  Unidades con ref catastral actualizada: ${totalUnitsUpdated}`);
  console.log(`  Documentos creados (seguros + escrituras): ${totalDocsCreated}`);

  if (DRY_RUN) {
    console.log('\n  ⚠️  DRY-RUN: No se realizaron cambios. Usar --apply para aplicar.');
  } else {
    console.log('\n  ✅ Cambios aplicados a la base de datos.');
  }

  // Estadísticas finales
  for (const companyId of COMPANIES) {
    const buildingsWithoutRC = await prisma.building.count({
      where: { companyId, isDemo: false, referenciaCatastral: null },
    });
    const unitsWithoutRC = await prisma.unit.count({
      where: { building: { companyId, isDemo: false }, referenciaCatastral: null },
    });
    const buildingsWithoutSeguro = await prisma.building.count({
      where: {
        companyId, isDemo: false,
        documents: { none: { tipo: 'seguro' } },
      },
    });

    const co = await prisma.company.findUnique({ where: { id: companyId }, select: { nombre: true } });
    console.log(`\n  ${co?.nombre}:`);
    console.log(`    Edificios sin ref catastral: ${buildingsWithoutRC}`);
    console.log(`    Unidades sin ref catastral: ${unitsWithoutRC}`);
    console.log(`    Edificios sin doc seguro: ${buildingsWithoutSeguro}`);
  }

  console.log('\n' + '═'.repeat(70));
}

main()
  .catch((err) => { console.error('❌ Error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
