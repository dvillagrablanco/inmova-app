import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal-propietario/documents
 * Obtiene los documentos del propietario
 */
export async function GET(request: NextRequest) {
  try {
    // Get owner session (assuming we have owner authentication)
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

    // Get all buildings the owner has access to
    const buildingIds = owner.ownerBuildings
      .filter(ob => ob.verDocumentos)
      .map(ob => ob.buildingId);

    // Get units for these buildings
    const units = await prisma.unit.findMany({
      where: {
        buildingId: { in: buildingIds },
      },
      select: { id: true },
    });
    const unitIds = units.map(u => u.id);

    // Get contracts and related documents
    const contracts = await prisma.contract.findMany({
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
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
          },
        },
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });

    // Get maintenance documents
    const maintenanceRecords = await prisma.maintenanceRequest.findMany({
      where: {
        unitId: { in: unitIds },
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        fechaSolicitud: true,
        estado: true,
        prioridad: true,
        unit: {
          include: {
            building: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaSolicitud: 'desc',
      },
      take: 50,
    });

    // Get contract IDs for payments
    const contractIds = contracts.map(c => c.id);

    // Get financial documents (invoices, receipts)
    const payments = await prisma.payment.findMany({
      where: {
        contractId: { in: contractIds },
      },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
            tenant: {
              select: {
                id: true,
                nombreCompleto: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaPago: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({
      contracts,
      maintenanceRecords,
      payments,
    });
  } catch (error: any) {
    logger.error('Error al obtener documentos del propietario:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    );
  }
}