import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  generateModelo347,
  GenerateModelo347Params,
} from '@/lib/services/compliance-service';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/compliance/modelo347:
 *   get:
 *     summary: Obtener registros del Modelo 347
 *     tags: [Cumplimiento]
 *   post:
 *     summary: Generar Modelo 347 para un ejercicio
 *     tags: [Cumplimiento]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const ejercicio = searchParams.get('ejercicio');

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (ejercicio) where.ejercicio = parseInt(ejercicio);

    const records = await prisma.modelo347Record.findMany({
      where,
      orderBy: { ejercicio: 'desc' },
    });

    // Calcular totales
    const totalIngresos = records
      .filter((r) => r.tipoOperacion === 'ingreso')
      .reduce((sum, r) => sum + r.importeAnual, 0);

    const totalGastos = records
      .filter((r) => r.tipoOperacion === 'gasto')
      .reduce((sum, r) => sum + r.importeAnual, 0);

    return NextResponse.json({
      records,
      summary: {
        totalRegistros: records.length,
        totalIngresos,
        totalGastos,
        neto: totalIngresos - totalGastos,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener Modelo 347' },
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
    const params: GenerateModelo347Params = {
      companyId: body.companyId,
      ejercicio: body.ejercicio || new Date().getFullYear() - 1,
    };

    const result = await generateModelo347(params);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al generar Modelo 347' },
      { status: 500 }
    );
  }
}
