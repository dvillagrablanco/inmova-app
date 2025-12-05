import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  analyzeContractForRenewal,
  generateRenewalRecommendations,
} from '@/lib/services/renewal-service-simple';

/**
 * @swagger
 * /api/renewals/analyze:
 *   get:
 *     summary: Analizar probabilidad de renovación
 *     tags: [Renovaciones]
 *   post:
 *     summary: Generar recomendaciones masivas
 *     tags: [Renovaciones]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const contractId = searchParams.get('contractId');

    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId es requerido' },
        { status: 400 }
      );
    }

    const analysis = await analyzeContractForRenewal(contractId);

    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al analizar contrato' },
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

    if (!body.companyId) {
      return NextResponse.json(
        { error: 'companyId es requerido' },
        { status: 400 }
      );
    }

    const recommendations = await generateRenewalRecommendations(body.companyId);

    return NextResponse.json(recommendations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al generar recomendaciones' },
      { status: 500 }
    );
  }
}
