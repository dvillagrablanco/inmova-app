/**
 * POST /api/catastro/auto-fill
 *
 * Busca todos los edificios y unidades sin referencia catastral
 * y consulta el Catastro público para obtenerla automáticamente.
 *
 * Proceso:
 * 1. Para edificios sin ref: intenta obtenerla por dirección
 * 2. Para edificios con ref (14 chars): consulta todas las fincas del edificio
 * 3. Mapea cada finca catastral a las unidades de la app por planta/puerta/tipo
 * 4. Actualiza las refs en la BD
 *
 * GET  /api/catastro/auto-fill?preview=true  → muestra lo que haría sin aplicar
 * POST /api/catastro/auto-fill               → aplica los cambios
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const norm = (s: string) => s.replace(/[ºª°\s]/g, '').toUpperCase();

function matchUnitToFinca(
  unit: { numero: string; planta: number | null; tipo: string; superficie: number },
  finca: { planta: string; puerta: string; uso: string; superficie: number }
): number {
  let score = 0;

  // Match by planta
  const fincaPlanta = parseInt(finca.planta) || 0;
  if (unit.planta !== null && unit.planta === fincaPlanta) score += 3;

  // Match by puerta/letra in unit.numero
  const unitNorm = norm(unit.numero);
  const puertaNorm = norm(finca.puerta);
  if (puertaNorm && unitNorm.includes(puertaNorm)) score += 5;
  if (puertaNorm && unitNorm.endsWith(puertaNorm)) score += 3;

  // Match by tipo/uso
  const usoLower = finca.uso.toLowerCase();
  if (unit.tipo === 'vivienda' && (usoLower.includes('vivienda') || usoLower.includes('residencial'))) score += 2;
  if (unit.tipo === 'local' && (usoLower.includes('comercial') || usoLower.includes('local'))) score += 2;
  if (unit.tipo === 'garaje' && (usoLower.includes('garaje') || usoLower.includes('aparcamiento'))) score += 2;
  if (unit.tipo === 'trastero' && (usoLower.includes('almac') || usoLower.includes('trastero'))) score += 2;
  if (unit.tipo === 'oficina' && usoLower.includes('oficina')) score += 2;

  // Match by superficie (within 20%)
  if (unit.superficie > 0 && finca.superficie > 0) {
    const ratio = unit.superficie / finca.superficie;
    if (ratio > 0.8 && ratio < 1.2) score += 2;
    if (ratio > 0.95 && ratio < 1.05) score += 2;
  }

  return score;
}

export async function GET(request: NextRequest) {
  return handleRequest(request, true);
}

export async function POST(request: NextRequest) {
  return handleRequest(request, false);
}

async function handleRequest(request: NextRequest, previewOnly: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { consultarEdificioPorRC, obtenerRefPorDireccion } = await import('@/lib/catastro-service');
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const companyId = (session.user as any).companyId;

    // Get all buildings for the company (and child companies if holding)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { childCompanies: { select: { id: true } } },
    });

    const companyIds = company
      ? [company.id, ...(company.childCompanies?.map((c: any) => c.id) || [])]
      : [companyId];

    const buildings = await prisma.building.findMany({
      where: { companyId: { in: companyIds }, isDemo: false },
      include: {
        units: {
          select: {
            id: true, numero: true, planta: true, tipo: true,
            superficie: true, referenciaCatastral: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const results: any[] = [];
    let buildingsUpdated = 0;
    let unitsUpdated = 0;
    let catastroQueries = 0;

    for (const building of buildings) {
      const buildingResult: any = {
        nombre: building.nombre,
        direccion: building.direccion,
        refActual: building.referenciaCatastral,
        unidadesSinRef: building.units.filter(u => !u.referenciaCatastral).length,
        unidadesTotal: building.units.length,
        acciones: [],
      };

      // Step 1: If building has no ref, try to get it by address
      let buildingRef = building.referenciaCatastral;
      if (!buildingRef && building.direccion) {
        const ref = await obtenerRefPorDireccion(building.direccion);
        catastroQueries++;

        if (ref) {
          buildingRef = ref;
          buildingResult.acciones.push(`Edificio: ref obtenida por dirección → ${ref}`);

          if (!previewOnly) {
            await prisma.building.update({
              where: { id: building.id },
              data: { referenciaCatastral: ref },
            });
            buildingsUpdated++;
          }
        } else {
          buildingResult.acciones.push('Edificio: no se pudo obtener ref por dirección');
        }
      }

      // Step 2: If building has ref, get all individual fincas
      if (buildingRef && buildingRef.length >= 14) {
        const unitsWithoutRef = building.units.filter(u => !u.referenciaCatastral);

        if (unitsWithoutRef.length > 0) {
          const catastroData = await consultarEdificioPorRC(buildingRef.substring(0, 14));
          catastroQueries++;

          if (catastroData && catastroData.fincas.length > 0) {
            buildingResult.fincasCatastro = catastroData.fincas.length;

            // Match each unit without ref to a catastro finca
            const usedFincas = new Set<string>();

            for (const unit of unitsWithoutRef) {
              let bestMatch: any = null;
              let bestScore = 0;

              for (const finca of catastroData.fincas) {
                if (usedFincas.has(finca.referenciaCatastral)) continue;

                const score = matchUnitToFinca(
                  { numero: unit.numero, planta: unit.planta, tipo: unit.tipo, superficie: unit.superficie },
                  finca
                );

                if (score > bestScore) {
                  bestScore = score;
                  bestMatch = finca;
                }
              }

              if (bestMatch && bestScore >= 4) {
                usedFincas.add(bestMatch.referenciaCatastral);
                buildingResult.acciones.push(
                  `${unit.numero}: → ${bestMatch.referenciaCatastral} (score:${bestScore}, ${bestMatch.uso}, pl:${bestMatch.planta}, pta:${bestMatch.puerta})`
                );

                if (!previewOnly) {
                  await prisma.unit.update({
                    where: { id: unit.id },
                    data: { referenciaCatastral: bestMatch.referenciaCatastral },
                  });
                  unitsUpdated++;
                }
              } else {
                buildingResult.acciones.push(
                  `${unit.numero}: sin match suficiente (mejor score: ${bestScore})`
                );
              }
            }
          } else {
            buildingResult.acciones.push('Sin datos del catastro para este edificio');
          }
        } else {
          buildingResult.acciones.push('Todas las unidades ya tienen ref catastral');
        }
      }

      if (buildingResult.acciones.length > 0) {
        results.push(buildingResult);
      }
    }

    return NextResponse.json({
      success: true,
      preview: previewOnly,
      summary: {
        edificiosAnalizados: buildings.length,
        edificiosActualizados: buildingsUpdated,
        unidadesActualizadas: unitsUpdated,
        consultasCatastro: catastroQueries,
      },
      results,
    });
  } catch (error: any) {
    logger.error('[Catastro Auto-fill]:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}
