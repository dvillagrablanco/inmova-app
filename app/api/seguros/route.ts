import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { resolveCompanyScope } from '@/lib/company-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');
    const queryCompanyId = searchParams.get('companyId');
    const userRole = (session.user as any).role;

    const seguros = await prisma.insurance.findMany({
      where: {
        companyId: { in: scope.scopeCompanyIds },
        ...(buildingId && { buildingId }),
        ...(tipo && { tipo: tipo as any }),
        ...(estado && { estado: estado as any }),
      },
      include: {
        building: { select: { nombre: true, direccion: true } },
        unit: { select: { numero: true } },
        _count: { select: { claims: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    // Enrich with coverage scope and unit counts
    const enriched = await Promise.all(
      seguros.map(async (seguro: any) => {
        const isBuilding = seguro.buildingId && !seguro.unitId;
        let unidadesCubiertas = 0;

        if (isBuilding) {
          unidadesCubiertas = await prisma.unit.count({
            where: { buildingId: seguro.buildingId },
          });
        }

        return {
          ...seguro,
          alcance: isBuilding ? 'edificio' : seguro.unitId ? 'unidad' : 'empresa',
          unidadesCubiertas: isBuilding ? unidadesCubiertas : seguro.unitId ? 1 : 0,
          diasHastaVencimiento: Math.ceil(
            (new Date(seguro.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener seguros' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    const seguro = await prisma.insurance.create({
      data: { ...body, companyId: session.user.companyId },
      include: {
        building: { select: { nombre: true } },
        unit: { select: { numero: true } },
      },
    });

    return NextResponse.json(seguro, { status: 201 });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear seguro' }, { status: 500 });
  }
}
