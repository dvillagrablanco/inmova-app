import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  registerDeposit,
  returnDeposit,
  DepositManagementParams,
} from '@/lib/services/treasury-service-simple';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


/**
 * @swagger
 * /api/treasury/deposits:
 *   get:
 *     summary: Obtener fianzas gestionadas
 *     tags: [Tesorería]
 *   post:
 *     summary: Registrar fianza o devolverla
 *     tags: [Tesorería]
 */

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const contractId = searchParams.get('contractId');

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (contractId) where.contractId = contractId;

    const deposits = await prisma.depositManagement.findMany({
      where,
      include: {
        contract: {
          include: {
            tenant: true,
            unit: true,
          },
        },
      },
      orderBy: { fechaDeposito: 'desc' },
    });

    return NextResponse.json(deposits);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener fianzas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === 'register') {
      // Registrar fianza
      const params: DepositManagementParams = {
        contractId: body.contractId,
        monto: body.monto,
        cuentaDeposito: body.cuentaDeposito,
        numeroRegistro: body.numeroRegistro,
      };

      const deposit = await registerDeposit(params);
      return NextResponse.json(deposit, { status: 201 });
    }

    if (body.action === 'return') {
      // Devolver fianza
      const deposit = await returnDeposit(
        body.depositId,
        body.montoDevuelto,
        body.deducciones || []
      );
      return NextResponse.json(deposit);
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar fianza' },
      { status: 500 }
    );
  }
}
