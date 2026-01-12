import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/portal-propietario/maintenance
 * Obtiene las solicitudes de mantenimiento relacionadas con las propiedades del propietario
 */
export async function GET(request: NextRequest) {
  try {
    const ownerId = request.headers.get('x-owner-id');
    if (!ownerId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: {
        ownerBuildings: {
          include: {
            building: true,
          },
        },
      },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'Propietario no encontrado' },
        { status: 404 }
      );
    }

    const buildingIds = owner.ownerBuildings
      .filter(ob => ob.verMantenimiento)
      .map(ob => ob.buildingId);

    // Get units for these buildings
    const units = await prisma.unit.findMany({
      where: {
        buildingId: { in: buildingIds },
      },
      select: { id: true },
    });
    const unitIds = units.map(u => u.id);

    const maintenanceRecords = await prisma.maintenanceRequest.findMany({
      where: {
        unitId: { in: unitIds },
      },
      include: {
        unit: {
          include: {
            building: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
              },
            },
          },
        },
        provider: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: {
        fechaSolicitud: 'desc',
      },
    });

    // Get maintenance statistics
    const stats = {
      total: maintenanceRecords.length,
      pendiente: maintenanceRecords.filter((m: any) => m.estado === 'pendiente').length,
      en_progreso: maintenanceRecords.filter((m: any) => m.estado === 'en_progreso').length,
      completado: maintenanceRecords.filter((m: any) => m.estado === 'completado').length,
      urgente: maintenanceRecords.filter((m: any) => m.prioridad === 'critico' || m.prioridad === 'alto').length,
    };

    return NextResponse.json({
      maintenance: maintenanceRecords,
      stats,
    });
  } catch (error: any) {
    logger.error('Error al obtener mantenimiento del propietario:', error);
    return NextResponse.json(
      { error: 'Error al obtener mantenimiento' },
      { status: 500 }
    );
  }
}