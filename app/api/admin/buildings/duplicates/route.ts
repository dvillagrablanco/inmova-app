/**
 * Detección y consolidación de buildings duplicados.
 *
 * GET   /api/admin/buildings/duplicates
 *   Detecta grupos de buildings que probablemente son el MISMO edificio físico
 *   pero están registrados por separado (típicamente porque se cargaron en
 *   tandas distintas para distintos tipos de activo: viviendas vs locales vs
 *   garajes).
 *
 *   Criterios de detección (cualquiera basta):
 *     - Misma referencia catastral 14 chars
 *     - Misma dirección normalizada (sin acentos, espacios extra, etc.)
 *
 * POST /api/admin/buildings/duplicates
 *   Body: { keepId: string, mergeFromIds: string[] }
 *   Migra TODAS las unidades de los buildings mergeFromIds al building keepId.
 *   Los buildings origen quedan vacíos (no se eliminan, se preservan para
 *   histórico).
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

function normalizeAddress(addr: string): string {
  return String(addr || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s,.-]+/g, ' ')
    .replace(/\bc\/|\bcalle\b|\bavda?\b|\bavenida\b|\bplaza\b|\bpaseo\b/g, '')
    .replace(/\b(spain|españa|esp)\b/g, '')
    .trim();
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

    const buildings = await prisma.building.findMany({
      where: { companyId: { in: scope.scopeCompanyIds } },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        referenciaCatastral: true,
        companyId: true,
        company: { select: { id: true, nombre: true } },
        _count: { select: { units: true } },
        units: { select: { ownerCompanyId: true, tipo: true } },
      },
      orderBy: { direccion: 'asc' },
    });

    // Agrupar por RC (14 chars) y por dirección normalizada
    const byRc = new Map<string, typeof buildings>();
    const byAddr = new Map<string, typeof buildings>();

    for (const b of buildings) {
      const rc = (b.referenciaCatastral || '').substring(0, 14).toUpperCase();
      if (rc.length >= 14) {
        if (!byRc.has(rc)) byRc.set(rc, []);
        byRc.get(rc)!.push(b);
      }

      const addrKey = normalizeAddress(b.direccion);
      if (addrKey.length > 5) {
        if (!byAddr.has(addrKey)) byAddr.set(addrKey, []);
        byAddr.get(addrKey)!.push(b);
      }
    }

    // Filtrar grupos con >1 building
    const duplicateGroups: Array<{
      type: 'same_rc' | 'same_address';
      key: string;
      buildings: any[];
      suggestedKeepId: string;
    }> = [];

    for (const [rc, bs] of byRc.entries()) {
      if (bs.length > 1) {
        const sorted = [...bs].sort((a, b) => b._count.units - a._count.units);
        // Detectar si hay sociedades propietarias distintas en el grupo
        const allOwnerIds = new Set<string>();
        for (const b of sorted) {
          allOwnerIds.add(b.companyId);
          for (const u of b.units) {
            if (u.ownerCompanyId) allOwnerIds.add(u.ownerCompanyId);
          }
        }
        duplicateGroups.push({
          type: 'same_rc',
          key: rc,
          crossCompany: allOwnerIds.size > 1,
          ownerCompanies: Array.from(allOwnerIds),
          buildings: sorted.map((b) => ({
            id: b.id,
            nombre: b.nombre,
            direccion: b.direccion,
            referenciaCatastral: b.referenciaCatastral,
            companyId: b.companyId,
            companyName: b.company?.nombre,
            unidades: b._count.units,
            tiposPresentes: Array.from(new Set(b.units.map((u: any) => u.tipo))),
          })),
          suggestedKeepId: sorted[0].id,
        });
      }
    }

    for (const [addr, bs] of byAddr.entries()) {
      if (bs.length > 1) {
        // Solo si NO se han incluído ya por RC
        const ids = bs.map((b) => b.id).sort().join('|');
        const already = duplicateGroups.some(
          (g) => g.buildings.map((x: any) => x.id).sort().join('|') === ids
        );
        if (already) continue;
        const sorted = [...bs].sort((a, b) => b._count.units - a._count.units);
        duplicateGroups.push({
          type: 'same_address',
          key: addr,
          buildings: sorted.map((b) => ({
            id: b.id,
            nombre: b.nombre,
            direccion: b.direccion,
            referenciaCatastral: b.referenciaCatastral,
            unidades: b._count.units,
          })),
          suggestedKeepId: sorted[0].id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalBuildings: buildings.length,
      duplicateGroups: duplicateGroups.length,
      groups: duplicateGroups,
    });
  } catch (error: any) {
    logger.error('[Buildings duplicates GET]:', error);
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

    const body = await request.json();
    const { keepId, mergeFromIds } = body || {};

    if (!keepId || !Array.isArray(mergeFromIds) || mergeFromIds.length === 0) {
      return NextResponse.json(
        { error: 'Falta keepId o mergeFromIds (array)' },
        { status: 400 }
      );
    }

    // Verificar que todos pertenecen al scope
    const allIds = [keepId, ...mergeFromIds];
    const buildings = await prisma.building.findMany({
      where: { id: { in: allIds }, companyId: { in: scope.scopeCompanyIds } },
      select: { id: true, nombre: true, _count: { select: { units: true } } },
    });

    if (buildings.length !== allIds.length) {
      return NextResponse.json(
        { error: 'Alguno de los buildings no existe o no tienes acceso' },
        { status: 403 }
      );
    }

    // Migrar todas las unidades.
    //
    // IMPORTANTE: solo cambiamos `buildingId` (referencia al edificio físico).
    // El `ownerCompanyId` de la unit se preserva porque la propiedad real
    // (sociedad propietaria) puede ser distinta de la del building destino,
    // y eso es el caso normal en grupos de sociedades (ej: grupo Vidaro).
    //
    // Si la unit no tenía ownerCompanyId previo, lo seteamos al companyId
    // del building origen para no perder información.
    let totalMigrated = 0;
    const details: any[] = [];

    for (const sourceId of mergeFromIds) {
      const sourceBld = await prisma.building.findUnique({
        where: { id: sourceId },
        select: { companyId: true },
      });

      // Backfill ownerCompanyId si está vacío
      if (sourceBld?.companyId) {
        await prisma.unit.updateMany({
          where: { buildingId: sourceId, ownerCompanyId: null },
          data: { ownerCompanyId: sourceBld.companyId },
        });
      }

      const result = await prisma.unit.updateMany({
        where: { buildingId: sourceId },
        data: { buildingId: keepId },
      });
      totalMigrated += result.count;
      details.push({
        from: sourceId,
        migratedUnits: result.count,
        preservedOwnerCompanyId: sourceBld?.companyId || null,
      });

      // También migrar otros recursos vinculados (gastos, documentos, seguros)
      const expenses = await prisma.expense.updateMany({
        where: { buildingId: sourceId },
        data: { buildingId: keepId },
      }).catch(() => ({ count: 0 }));
      const docs = await prisma.document.updateMany({
        where: { buildingId: sourceId },
        data: { buildingId: keepId },
      }).catch(() => ({ count: 0 }));
      const insurances = await prisma.insurance.updateMany({
        where: { buildingId: sourceId },
        data: { buildingId: keepId },
      }).catch(() => ({ count: 0 }));
      details[details.length - 1].migratedExpenses = expenses.count;
      details[details.length - 1].migratedDocuments = docs.count;
      details[details.length - 1].migratedInsurances = insurances.count;
    }

    logger.info(
      `[Buildings merge] Usuario ${session.user.id} mergeó ${mergeFromIds.length} buildings → ${keepId}: ${totalMigrated} unidades migradas`
    );

    return NextResponse.json({
      success: true,
      keepId,
      mergeFromIds,
      totalUnitsMigrated: totalMigrated,
      details,
    });
  } catch (error: any) {
    logger.error('[Buildings duplicates POST]:', error);
    return NextResponse.json(
      { error: error?.message || 'Error en merge' },
      { status: 500 }
    );
  }
}
