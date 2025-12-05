import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  generateCommunityFees,
  getCommunityFeesByBuilding,
  markFeeAsPaid,
  GenerateFeesParams,
} from '@/lib/services/community-management-service';
import { CuotaTipo } from '@prisma/client';

/**
 * @swagger
 * /api/communities/fees:
 *   get:
 *     summary: Obtener cuotas de comunidad
 *     tags: [Comunidades]
 *   post:
 *     summary: Generar cuotas para un edificio
 *     tags: [Comunidades]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const buildingId = searchParams.get('buildingId');
    const periodo = searchParams.get('periodo') || undefined;

    if (!buildingId) {
      return NextResponse.json(
        { error: 'buildingId es requerido' },
        { status: 400 }
      );
    }

    const fees = await getCommunityFeesByBuilding(buildingId, periodo);

    return NextResponse.json(fees);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener cuotas' },
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

    if (body.action === 'generate') {
      // Generar cuotas
      const params: GenerateFeesParams = {
        buildingId: body.buildingId,
        companyId: body.companyId,
        periodo: body.periodo,
        tipo: body.tipo as CuotaTipo,
        montoPorUnidad: body.montoPorUnidad,
      };

      const fees = await generateCommunityFees(params);
      return NextResponse.json(fees, { status: 201 });
    }

    if (body.action === 'mark_paid') {
      // Marcar cuota como pagada
      const fee = await markFeeAsPaid(
        body.feeId,
        new Date(body.fechaPago),
        body.metodoPago
      );
      return NextResponse.json(fee);
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar cuotas' },
      { status: 500 }
    );
  }
}
