import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/renewals:
 *   get:
 *     summary: Obtener renovaciones de contratos
 *     tags: [Renovaciones]
 * 
 * NOTE: ContractRenewal model not yet implemented in Prisma schema
 * This endpoint is temporarily disabled
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // TODO: Implement ContractRenewal model in Prisma schema first
    return NextResponse.json({ 
      error: 'ContractRenewal feature not yet implemented',
      message: 'This endpoint requires the ContractRenewal model to be added to the Prisma schema'
    }, { status: 501 });

    /* Original code - to be uncommented after ContractRenewal model is added
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
    */
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error processing renewal request' },
      { status: 500 }
    );
  }
}
