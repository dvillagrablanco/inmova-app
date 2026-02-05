import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    const session = await getServerSession(authOptions);
    if (!session) {
      if (usePagination) {
        return NextResponse.json({
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
          success: false,
          error: 'No autorizado',
        });
      }
      return NextResponse.json([]);
    }

    const companyId = session.user?.companyId;
    if (!companyId) {
      if (usePagination) {
        return NextResponse.json({
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
          success: false,
          error: 'CompanyId no encontrado',
        });
      }
      return NextResponse.json([]);
    }

    const where: any = {
      unit: {
        building: {
          companyId,
        },
      },
    };
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;

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
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (usePagination) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
        success: false,
        error: 'Error al obtener solicitudes de mantenimiento',
      });
    }
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
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
