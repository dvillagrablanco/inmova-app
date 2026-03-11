import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/units/[id]/insurance-coverage
 *
 * Devuelve la cobertura de seguro de una unidad:
 * - Pólizas directas (asignadas a la unidad específica)
 * - Pólizas de edificio (asignadas al edificio, cubren todas sus unidades)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const unitId = params.id;

    // Get unit with building info
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        numero: true,
        buildingId: true,
        building: {
          select: {
            id: true,
            nombre: true,
            companyId: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    // 1. Direct policies — assigned specifically to this unit
    const directPolicies = await prisma.insurance.findMany({
      where: { unitId },
      include: {
        building: { select: { nombre: true } },
        _count: { select: { claims: true } },
      },
      orderBy: { fechaVencimiento: 'desc' },
    });

    // 2. Building policies — assigned to the building (cover all units)
    const buildingPolicies = unit.buildingId
      ? await prisma.insurance.findMany({
          where: {
            buildingId: unit.buildingId,
            unitId: null, // Only building-level policies (not assigned to a specific unit)
          },
          include: {
            building: { select: { nombre: true } },
            _count: { select: { claims: true } },
          },
          orderBy: { fechaVencimiento: 'desc' },
        })
      : [];

    // Calculate coverage status
    const now = new Date();
    const activeDirect = directPolicies.filter(
      (p) => p.estado === 'activa' && new Date(p.fechaVencimiento) > now
    );
    const activeBuilding = buildingPolicies.filter(
      (p) => p.estado === 'activa' && new Date(p.fechaVencimiento) > now
    );
    const hasCoverage = activeDirect.length > 0 || activeBuilding.length > 0;

    // Count total units covered by building policies
    let buildingUnitsCount = 0;
    if (unit.buildingId && buildingPolicies.length > 0) {
      buildingUnitsCount = await prisma.unit.count({
        where: { buildingId: unit.buildingId },
      });
    }

    return NextResponse.json({
      unitId,
      unitNumber: unit.numero,
      buildingId: unit.buildingId,
      buildingName: unit.building?.nombre,
      hasCoverage,
      coverageSource:
        activeDirect.length > 0 && activeBuilding.length > 0
          ? 'both'
          : activeDirect.length > 0
            ? 'direct'
            : activeBuilding.length > 0
              ? 'building'
              : 'none',
      directPolicies: directPolicies.map((p) => ({
        id: p.id,
        tipo: p.tipo,
        aseguradora: p.aseguradora,
        numeroPoliza: p.numeroPoliza,
        sumaAsegurada: p.sumaAsegurada,
        primaAnual: p.primaAnual,
        fechaVencimiento: p.fechaVencimiento,
        estado: p.estado,
        cobertura: p.cobertura,
        documentoPath: p.urlDocumento,
        claims: p._count.claims,
      })),
      buildingPolicies: buildingPolicies.map((p) => ({
        id: p.id,
        tipo: p.tipo,
        aseguradora: p.aseguradora,
        numeroPoliza: p.numeroPoliza,
        sumaAsegurada: p.sumaAsegurada,
        primaAnual: p.primaAnual,
        fechaVencimiento: p.fechaVencimiento,
        estado: p.estado,
        cobertura: p.cobertura,
        documentoPath: p.urlDocumento,
        buildingName: p.building?.nombre,
        unidadesCubiertas: buildingUnitsCount,
        claims: p._count.claims,
      })),
      summary: {
        totalPolicies: directPolicies.length + buildingPolicies.length,
        activePolicies: activeDirect.length + activeBuilding.length,
        totalCoverage: [
          ...activeDirect.map((p) => p.sumaAsegurada || 0),
          ...activeBuilding.map((p) => p.sumaAsegurada || 0),
        ].reduce((s, v) => s + v, 0),
      },
    });
  } catch (error: any) {
    logger.error('[Insurance Coverage Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo cobertura' }, { status: 500 });
  }
}
