import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  calculateBadDebtProvisions,
  BadDebtProvisionParams,
} from '@/lib/services/treasury-service-simple';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


/**
 * @swagger
 * /api/treasury/provisions:
 *   get:
 *     summary: Obtener provisiones de impagos
 *     tags: [Tesorería]
 *   post:
 *     summary: Calcular provisiones automáticas
 *     tags: [Tesorería]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId es requerido' },
        { status: 400 }
      );
    }

    const provisions = await prisma.badDebtProvision.findMany({
      where: { companyId },
      include: {
        payment: {
          include: {
            contract: {
              include: {
                tenant: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { diasRetraso: 'desc' },
    });

    // Calcular totales
    const totalProvision = provisions.reduce(
      (sum, p) => sum + p.montoProvision,
      0
    );
    const totalOriginal = provisions.reduce(
      (sum, p) => sum + p.montoOriginal,
      0
    );

    return NextResponse.json({
      provisions,
      summary: {
        totalProvision,
        totalOriginal,
        porcentajeTotal:
          totalOriginal > 0 ? (totalProvision / totalOriginal) * 100 : 0,
        totalImpagos: provisions.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener provisiones' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const params: BadDebtProvisionParams = {
      companyId: body.companyId,
    };

    const provisions = await calculateBadDebtProvisions(params);

    return NextResponse.json(provisions, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al calcular provisiones' },
      { status: 500 }
    );
  }
}
