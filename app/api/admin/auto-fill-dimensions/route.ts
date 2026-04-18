/**
 * POST /api/admin/auto-fill-dimensions
 *
 * Auto-rellena en lote las dimensiones de todas las unidades de la empresa
 * que tengan campos vacíos. Solo administradores.
 *
 * Query params:
 *   - limit (default 50, max 200)
 *   - force=true para sobrescribir
 *   - preview=true para previsualizar
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_ROLES = new Set(['administrador', 'gestor', 'super_admin']);

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

async function findCandidates(prisma: any, companyIds: string[], force: boolean) {
  // Si force, todas las unidades. Si no, solo las que tengan algún campo vacío.
  const where: any = {
    building: { companyId: { in: companyIds } },
  };
  if (!force) {
    where.OR = [
      { superficie: 0 },
      { superficieUtil: null },
      { habitaciones: null },
      { banos: null },
      { planta: null },
      { referenciaCatastral: null },
    ];
  }

  return prisma.unit.findMany({
    where,
    select: {
      id: true,
      numero: true,
      planta: true,
      tipo: true,
      superficie: true,
      superficieUtil: true,
      habitaciones: true,
      banos: true,
      referenciaCatastral: true,
      building: {
        select: { id: true, nombre: true, referenciaCatastral: true },
      },
    },
    take: 200,
    orderBy: [{ buildingId: 'asc' }, { numero: 'asc' }],
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ALLOWED_ROLES.has((session.user as any).role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';
    const candidates = await findCandidates(prisma, scope.scopeCompanyIds, force);

    return NextResponse.json({
      success: true,
      total: candidates.length,
      candidates: candidates.slice(0, 50).map((u: any) => ({
        id: u.id,
        numero: u.numero,
        planta: u.planta,
        tipo: u.tipo,
        superficie: u.superficie,
        edificio: u.building?.nombre,
        rcEdificio: u.building?.referenciaCatastral,
        rcUnidad: u.referenciaCatastral,
      })),
    });
  } catch (error: any) {
    logger.error('[Auto-fill admin GET]:', error);
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ALLOWED_ROLES.has((session.user as any).role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user.companyId,
      request,
    });

    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';
    const preview = url.searchParams.get('preview') === 'true';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '30', 10) || 30, 200);

    const candidates = await findCandidates(prisma, scope.scopeCompanyIds, force);
    const batch = candidates.slice(0, limit);

    const { autoFillUnitDimensions, applyAutoFillResult } = await import(
      '@/lib/unit-auto-fill-service'
    );

    let processed = 0;
    let withData = 0;
    let updated = 0;
    const results: any[] = [];

    for (const u of batch) {
      processed++;
      const r = await autoFillUnitDimensions(u.id);

      if (r.source === 'none') {
        results.push({
          id: u.id,
          numero: u.numero,
          edificio: u.building?.nombre,
          source: 'none',
          updatedFields: 0,
        });
        continue;
      }
      withData++;

      let updatedFields = 0;
      if (!preview) {
        const applied = await applyAutoFillResult(u.id, r, { force, updateBuilding: true });
        updatedFields = applied.updatedUnit;
        if (updatedFields > 0) updated++;
      } else {
        // Preview: contar cuántos cambiarían
        updatedFields = Object.keys(r.fields).filter((k) => {
          const before = (u as any)[k];
          if (before === r.fields[k as keyof typeof r.fields]) return false;
          return force || !before || before === 0;
        }).length;
      }

      results.push({
        id: u.id,
        numero: u.numero,
        edificio: u.building?.nombre,
        source: r.source,
        confidence: r.confidence,
        updatedFields,
        fields: r.fields,
        note: r.rawNote,
      });

      // Pequeño delay para no saturar Catastro (1 req/s aprox)
      await new Promise((res) => setTimeout(res, 250));
    }

    return NextResponse.json({
      success: true,
      preview,
      summary: {
        processed,
        withData,
        updated,
        remaining: Math.max(0, candidates.length - batch.length),
      },
      results,
    });
  } catch (error: any) {
    logger.error('[Auto-fill admin POST]:', error);
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
  }
}
