import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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
    const searchParams = req.nextUrl.searchParams;
    const estado = searchParams.get('estado');
    const days = parseInt(searchParams.get('days') || '90', 10);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const where = {
      companyId: session.user.companyId,
      ...(estado ? { estado } : {}),
      fechaFin: { lte: cutoff },
    };

    const renewals = await prisma.contract.findMany({
      where,
      include: {
        tenant: true,
        unit: {
          include: { building: true },
        },
      },
      orderBy: { fechaFin: 'asc' },
    });

    return NextResponse.json(renewals);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error processing renewal request';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
