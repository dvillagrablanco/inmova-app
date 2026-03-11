import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  generateCommunityFees,
  getCommunityFeesByBuilding,
  markFeeAsPaid,
  GenerateFeesParams,
} from '@/lib/services/community-management-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const feesBodySchema = z.union([
  z.object({
    action: z.literal('generate'),
    buildingId: z.string().min(1),
    companyId: z.string().optional(),
    periodo: z.string().optional(),
    tipo: z.string().optional(),
    montoPorUnidad: z.number().optional(),
  }),
  z.object({
    action: z.literal('mark_paid'),
    feeId: z.string().min(1),
    fechaPago: z.string(),
    metodoPago: z.string().optional(),
  }),
]);


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
    const parsed = feesBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (parsed.data.action === 'generate') {
      const companyId = parsed.data.companyId || session.user.companyId;
      if (!companyId) {
        return NextResponse.json(
          { error: 'companyId es requerido' },
          { status: 400 }
        );
      }
      const params: GenerateFeesParams = {
        buildingId: parsed.data.buildingId,
        companyId,
        periodo: parsed.data.periodo || new Date().toISOString().slice(0, 7),
        tipo: parsed.data.tipo as any,
        montoPorUnidad: parsed.data.montoPorUnidad,
      };
      const fees = await generateCommunityFees(params);
      return NextResponse.json(fees, { status: 201 });
    }

    if (parsed.data.action === 'mark_paid') {
      const fee = await markFeeAsPaid(
        parsed.data.feeId,
        new Date(parsed.data.fechaPago),
        parsed.data.metodoPago || ''
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
