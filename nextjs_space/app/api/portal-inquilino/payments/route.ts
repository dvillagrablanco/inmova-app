/**
 * API de Pagos para Portal del Inquilino
 * Retorna solo los pagos asociados al inquilino autenticado
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar el inquilino por email
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Obtener todos los contratos del inquilino
    const contracts = await prisma.contract.findMany({
      where: { tenantId: tenant.id },
      select: { id: true },
    });

    const contractIds = contracts.map(c => c.id);

    // Obtener todos los pagos de esos contratos
    const payments = await prisma.payment.findMany({
      where: {
        contractId: { in: contractIds },
      },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
      orderBy: { fechaVencimiento: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    return NextResponse.json(
      { error: 'Error al obtener pagos' },
      { status: 500 }
    );
  }
}
