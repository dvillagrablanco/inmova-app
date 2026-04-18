/**
 * POST /api/units/[id]/auto-fill-dimensions
 *
 * Auto-rellena las dimensiones (superficie, planta, RC, año, etc.) de una
 * unidad consultando:
 *   1) Escrituras procesadas previamente vinculadas al edificio
 *   2) Catastro público (por RC propia o RC del edificio + matching)
 *
 * Query/body params:
 *   - force=true        → sobrescribe valores ya rellenos en BD
 *   - preview=true      → solo previsualiza sin modificar BD
 *   - updateBuilding=true → también actualiza año de construcción del edificio
 *
 * Devuelve los campos detectados, la fuente y los cambios aplicados.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';
    const preview = url.searchParams.get('preview') === 'true';
    const updateBuilding = url.searchParams.get('updateBuilding') !== 'false';

    const prisma = await getPrisma();
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    // Verificar acceso a la unidad
    const unit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        building: { companyId: { in: scope.scopeCompanyIds } },
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            referenciaCatastral: true,
            direccion: true,
            anoConstructor: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    // Capturar estado ANTES para mostrar diff
    const before = {
      superficie: unit.superficie,
      superficieUtil: unit.superficieUtil,
      habitaciones: unit.habitaciones,
      banos: unit.banos,
      planta: unit.planta,
      orientacion: unit.orientacion,
      referenciaCatastral: unit.referenciaCatastral,
      anoConstructor: unit.building?.anoConstructor,
    };

    const { autoFillUnitDimensions, applyAutoFillResult } = await import(
      '@/lib/unit-auto-fill-service'
    );

    const result = await autoFillUnitDimensions(params.id);

    if (preview) {
      return NextResponse.json({
        success: true,
        preview: true,
        unit: {
          id: unit.id,
          numero: unit.numero,
          buildingId: unit.buildingId,
        },
        currentValues: before,
        autoFillResult: result,
        changes: computeChanges(before, result.fields, force),
      });
    }

    // Aplicar
    const applied = await applyAutoFillResult(params.id, result, {
      force,
      updateBuilding,
    });

    logger.info(
      `[Auto-fill] Unidad ${params.id} (${unit.numero}): source=${result.source}, conf=${result.confidence}, fields actualizados=${applied.updatedUnit}, building=${applied.updatedBuilding}`
    );

    return NextResponse.json({
      success: true,
      unit: {
        id: unit.id,
        numero: unit.numero,
        buildingId: unit.buildingId,
      },
      autoFillResult: result,
      currentValues: before,
      applied,
      changes: computeChanges(before, result.fields, force),
    });
  } catch (error: any) {
    logger.error('[Auto-fill API]:', {
      message: error?.message,
      stack: error?.stack?.substring(0, 800),
    });
    return NextResponse.json(
      { error: error?.message || 'Error al auto-rellenar dimensiones' },
      { status: 500 }
    );
  }
}

function computeChanges(
  before: Record<string, any>,
  fields: Record<string, any>,
  force: boolean
): Array<{ field: string; from: any; to: any; willApply: boolean }> {
  const changes: Array<{ field: string; from: any; to: any; willApply: boolean }> = [];
  const isEmpty = (v: any) =>
    v === null || v === undefined || v === '' || v === 0;

  const fieldMap: Record<string, string> = {
    superficie: 'superficie',
    superficieUtil: 'superficieUtil',
    habitaciones: 'habitaciones',
    banos: 'banos',
    planta: 'planta',
    orientacion: 'orientacion',
    referenciaCatastral: 'referenciaCatastral',
  };

  for (const [k, v] of Object.entries(fields)) {
    const beforeKey = fieldMap[k] || k;
    const beforeVal = before[beforeKey];
    if (v === undefined || v === null) continue;
    if (beforeVal === v) continue;
    const willApply = force || isEmpty(beforeVal);
    changes.push({ field: k, from: beforeVal, to: v, willApply });
  }
  return changes;
}
