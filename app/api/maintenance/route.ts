import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json([]);
    }

    const companyFilter = scope.scopeCompanyIds.length > 1
      ? { in: scope.scopeCompanyIds }
      : scope.activeCompanyId;

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;

    const where: any = {
      unit: {
        building: {
          companyId: companyFilter,
        },
      },
    };
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;

    // Verificar si se está usando paginación
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (usePagination) {
      const [maintenanceRequests, total] = await Promise.all([
        prisma.maintenanceRequest.findMany({
          where,
          include: {
            unit: {
              include: {
                building: true,
                tenant: true,
              },
            },
          },
          orderBy: { fechaSolicitud: 'desc' },
          skip,
          take: limit,
        }),
        prisma.maintenanceRequest.count({ where }),
      ]);

      return NextResponse.json({
        data: maintenanceRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        },
      });
    }

    // Sin paginación (para compatibilidad con código existente)
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        unit: {
          include: {
            building: true,
            tenant: true,
          },
        },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });

    return NextResponse.json(maintenanceRequests);
  } catch (error) {
    logger.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: 'Error al obtener solicitudes de mantenimiento' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { unitId, titulo, descripcion, prioridad, estado, fechaProgramada, providerId, costoEstimado } = body;

    if (!unitId || !titulo || !descripcion) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        unitId,
        titulo,
        descripcion,
        prioridad: prioridad || 'media',
        estado: estado || 'pendiente',
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
        providerId,
        costoEstimado: costoEstimado ? parseFloat(costoEstimado) : null,
      },
    });

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    logger.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: 'Error al crear solicitud de mantenimiento' }, { status: 500 });
  }
}
