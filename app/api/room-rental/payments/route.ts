import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
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
 * GET /api/room-rental/payments
 * Obtiene todos los pagos de contratos de habitaciones
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const estado = searchParams.get('estado');

    const whereClause: any = {
      companyId: session.user.companyId,
    };

    if (contractId) whereClause.contractId = contractId;
    if (estado) whereClause.estado = estado;

    // OPTIMIZADO - Bug Fix Week: Query Optimization
    const payments = await prisma.roomPayment.findMany({
      where: whereClause,
      select: {
        ...selectRoomPaymentMinimal,
        contract: {
          select: {
            ...selectRoomContractMinimal,
            room: {
              select: {
                id: true,
                numero: true,
                nombre: true,
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
        },
      },
      orderBy: {
        fechaVencimiento: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    logger.error('Error fetching payments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/room-rental/payments
 * Crea un nuevo pago
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    // Validaciones
    if (!data.contractId || !data.mes || !data.monto || !data.fechaVencimiento) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // BUG FIX: Validar montos positivos
    const monto = parseFloat(data.monto);
    if (isNaN(monto) || monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número positivo' },
        { status: 400 }
      );
    }

    // Validar montos de prorrateo si existen
    const prorationFields = [
      'montoProrrateoLuz',
      'montoProrrateoAgua',
      'montoProrrateoGas',
      'montoProrrateoInternet',
      'montoProrrateoLimpieza',
    ];

    for (const field of prorationFields) {
      if (data[field] !== undefined && data[field] !== null) {
        const value = parseFloat(data[field]);
        if (isNaN(value) || value < 0) {
          return NextResponse.json(
            { error: `${field} debe ser un número no negativo` },
            { status: 400 }
          );
        }
      }
    }

    // OPTIMIZADO - Bug Fix Week: Query Optimization + select minimal
    const payment = await prisma.roomPayment.create({
      data: {
        companyId: session.user.companyId,
        contractId: data.contractId,
        concepto: data.concepto || 'Renta mensual',
        mes: new Date(data.mes),
        monto,
        montoProrrateoLuz: data.montoProrrateoLuz ? parseFloat(data.montoProrrateoLuz) : null,
        montoProrrateoAgua: data.montoProrrateoAgua ? parseFloat(data.montoProrrateoAgua) : null,
        montoProrrateoGas: data.montoProrrateoGas ? parseFloat(data.montoProrrateoGas) : null,
        montoProrrateoInternet: data.montoProrrateoInternet ? parseFloat(data.montoProrrateoInternet) : null,
        montoProrrateoLimpieza: data.montoProrrateoLimpieza ? parseFloat(data.montoProrrateoLimpieza) : null,
        estado: data.estado || 'pendiente',
        fechaVencimiento: new Date(data.fechaVencimiento),
        fechaPago: data.fechaPago ? new Date(data.fechaPago) : null,
        metodoPago: data.metodoPago,
        notas: data.notas,
      },
      select: {
        ...selectRoomPaymentMinimal,
        contract: {
          select: {
            ...selectRoomContractMinimal,
            room: {
              select: {
                id: true,
                numero: true,
                nombre: true,
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
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
