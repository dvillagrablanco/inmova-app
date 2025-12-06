import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/sales/commissions/[id] - Obtener una comisión específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const commission = await prisma.salesCommission.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!commission) {
      return NextResponse.json(
        { error: 'Comisión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(commission);
  } catch (error) {
    logError('Error en GET /api/sales/commissions/[id]', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener comisión' },
      { status: 500 }
    );
  }
}

// PATCH /api/sales/commissions/[id] - Actualizar una comisión
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins pueden actualizar comisiones
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Verificar que la comisión existe y pertenece a la company
    const existingCommission = await prisma.salesCommission.findUnique({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingCommission) {
      return NextResponse.json(
        { error: 'Comisión no encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Campos actualizables
    if (data.monto !== undefined) updateData.monto = parseFloat(data.monto);
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.concepto !== undefined) updateData.concepto = data.concepto;
    if (data.detalles !== undefined) updateData.detalles = data.detalles;
    if (data.porcentaje !== undefined) updateData.porcentaje = data.porcentaje;
    if (data.baseCalculo !== undefined) updateData.baseCalculo = data.baseCalculo;

    // Actualizar fecha de pago si se marca como pagada
    if (data.estado === 'PAGADA' && !existingCommission.fechaPago) {
      updateData.fechaPago = new Date();
    }

    const commission = await prisma.salesCommission.update({
      where: { id: params.id },
      data: updateData,
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    logger.info(`Comisión actualizada: ${commission.id}`);

    return NextResponse.json(commission);
  } catch (error) {
    logError('Error en PATCH /api/sales/commissions/[id]', error as Error);
    return NextResponse.json(
      { error: 'Error al actualizar comisión' },
      { status: 500 }
    );
  }
}
