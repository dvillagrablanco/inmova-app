import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get tenant by email
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Get all payments for this tenant's contracts
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          tenantId: tenant.id,
        },
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
      orderBy: {
        fechaVencimiento: 'desc',
      },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Error fetching tenant payments:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar pagos' },
      { status: 500 }
    );
  }
}
