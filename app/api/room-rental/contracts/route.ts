import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { checkRoomAvailability, generateColivingRulesTemplate } from '@/lib/room-rental-service';
import logger, { logError } from '@/lib/logger';
import { 
  selectUnitMinimal, 
  selectBuildingMinimal, 
  selectRoomContractMinimal, 
  selectTenantMinimal,
  selectRoomPaymentMinimal
} from '@/lib/query-optimizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/room-rental/contracts
 * Obtiene todos los contratos de habitaciones
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const tenantId = searchParams.get('tenantId');
    const estado = searchParams.get('estado');

    const whereClause: any = {
      companyId: session.user.companyId,
    };

    if (roomId) whereClause.roomId = roomId;
    if (tenantId) whereClause.tenantId = tenantId;
    if (estado) whereClause.estado = estado;

    // OPTIMIZADO - Bug Fix Week: Query Optimization
    // Usa select minimal para reducir payload en ~70%
    const contracts = await prisma.roomContract.findMany({
      where: whereClause,
      select: {
        ...selectRoomContractMinimal,
        room: {
          select: {
            id: true,
            numero: true,
            nombre: true,
            superficie: true,
            rentaMensual: true,
            estado: true,
            unitId: true,
            unit: {
              select: {
                ...selectUnitMinimal,
                building: {
                  select: selectBuildingMinimal,
                },
              },
            },
          },
        },
        tenant: {
          select: selectTenantMinimal,
        },
        payments: {
          select: selectRoomPaymentMinimal,
        },
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });

    return NextResponse.json(contracts);
  } catch (error: any) {
    logger.error('Error fetching contracts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/room-rental/contracts
 * Crea un nuevo contrato de habitación
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    // Validaciones
    if (!data.roomId || !data.tenantId || !data.fechaInicio || !data.fechaFin || !data.rentaMensual) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar disponibilidad de la habitación
    const availability = await checkRoomAvailability(
      data.roomId,
      new Date(data.fechaInicio),
      new Date(data.fechaFin)
    );

    if (!availability.isAvailable) {
      return NextResponse.json(
        { error: 'La habitación no está disponible para las fechas seleccionadas' },
        { status: 400 }
      );
    }

    // Generar normas de convivencia si no se proporcionan
    const normasConvivencia = data.normasConvivencia || generateColivingRulesTemplate(data.customRules);

    // BUG FIX: Usar transacción para garantizar consistencia
    // Si falla la actualización del estado, se revierte la creación del contrato
    const contract = await prisma.$transaction(async (tx) => {
      // Crear contrato
      const newContract = await tx.roomContract.create({
        data: {
          companyId: session.user.companyId,
          roomId: data.roomId,
          tenantId: data.tenantId,
          fechaInicio: new Date(data.fechaInicio),
          fechaFin: new Date(data.fechaFin),
          rentaMensual: parseFloat(data.rentaMensual),
          diaPago: data.diaPago || 1,
          deposito: data.deposito ? parseFloat(data.deposito) : 0,
          gastosIncluidos: data.gastosIncluidos || [],
          normasConvivencia,
          horariosVisitas: data.horariosVisitas,
          permiteMascotas: data.permiteMascotas || false,
          permiteFumar: data.permiteFumar || false,
          frecuenciaLimpieza: data.frecuenciaLimpieza || 'semanal',
          estado: 'activo',
        },
        select: {
          ...selectRoomContractMinimal,
          room: {
            select: {
              id: true,
              numero: true,
              nombre: true,
              superficie: true,
              rentaMensual: true,
              estado: true,
              unitId: true,
              unit: {
                select: {
                  ...selectUnitMinimal,
                  building: {
                    select: selectBuildingMinimal,
                  },
                },
              },
            },
          },
          tenant: {
            select: selectTenantMinimal,
          },
        },
      });

      // Actualizar estado de la habitación a ocupada
      await tx.room.update({
        where: { id: data.roomId },
        data: { estado: 'ocupada' },
      });

      return newContract;
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating contract:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
