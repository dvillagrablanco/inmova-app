import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  createCommunityFund,
  addFundMovement,
  CreateFundParams,
} from '@/lib/services/community-management-service';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


/**
 * @swagger
 * /api/communities/funds:
 *   get:
 *     summary: Obtener fondos de comunidad
 *     tags: [Comunidades]
 *   post:
 *     summary: Crear fondo o añadir movimiento
 *     tags: [Comunidades]
 */

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const buildingId = searchParams.get('buildingId');
    const companyId = searchParams.get('companyId');

    const where: any = {};
    if (buildingId) where.buildingId = buildingId;
    if (companyId) where.companyId = companyId;

    const funds = await prisma.communityFund.findMany({
      where,
      include: {
        building: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(funds);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener fondos' },
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

    if (body.action === 'create') {
      // Crear fondo
      const params: CreateFundParams = {
        buildingId: body.buildingId,
        companyId: body.companyId,
        tipo: body.tipo as any,
        nombre: body.nombre,
        saldoActual: body.saldoActual || 0,
        objetivo: body.objetivo,
      };

      const fund = await createCommunityFund(params);
      return NextResponse.json(fund, { status: 201 });
    }

    if (body.action === 'movement') {
      // Añadir movimiento
      const fund = await addFundMovement(
        body.fundId,
        body.tipo,
        body.monto,
        body.concepto
      );
      return NextResponse.json(fund);
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar fondos' },
      { status: 500 }
    );
  }
}
