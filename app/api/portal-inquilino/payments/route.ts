import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * API: Pagos para Portal Inquilino
 * GET - Obtener historial de pagos del inquilino
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar el tenant asociado al usuario
    const tenant = await prisma.tenant.findFirst({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'No se encontró información de inquilino' },
        { status: 404 }
      );
    }

    // Buscar contratos del inquilino
    const contracts = await prisma.contract.findMany({
      where: {
        tenantId: tenant.id,
      },
      select: {
        id: true,
      },
    });

    const contractIds = contracts.map((c) => c.id);

    // Buscar pagos de los contratos del inquilino
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
                    nombre: true,
                    direccion: true,
                    ciudad: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        fechaVencimiento: 'desc',
      },
      take: 50,
    });

    // Transformar estructura para facilitar uso en frontend
    const transformedPayments = payments.map((payment) => ({
      id: payment.id,
      periodo: payment.periodo,
      monto: payment.monto,
      fechaVencimiento: payment.fechaVencimiento,
      fechaPago: payment.fechaPago,
      estado: payment.estado,
      metodoPago: payment.metodoPago,
      nivelRiesgo: payment.nivelRiesgo,
      propiedad: {
        nombre: payment.contract.unit.building.nombre,
        direccion: payment.contract.unit.building.direccion,
        ciudad: payment.contract.unit.building.ciudad,
        unidad: payment.contract.unit.numero,
      },
    }));

    return NextResponse.json({
      success: true,
      payments: transformedPayments,
    });
  } catch (error: any) {
    console.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
