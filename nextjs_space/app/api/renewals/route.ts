import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/renewals:
 *   get:
 *     summary: Obtener renovaciones de contratos
 *     tags: [Renovaciones]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const estado = searchParams.get('estado');

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (estado) where.estadoRenovacion = estado;

    const renewals = await prisma.contractRenewal.findMany({
      where,
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: { building: true },
            },
          },
        },
      },
      orderBy: { fechaPropuesta: 'desc' },
    });

    return NextResponse.json(renewals);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener renovaciones' },
      { status: 500 }
    );
  }
}
