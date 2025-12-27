import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  generateModelo180,
  GenerateModelo180Params,
} from '@/lib/services/compliance-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';


/**
 * @swagger
 * /api/compliance/modelo180:
 *   get:
 *     summary: Obtener registros del Modelo 180
 *     tags: [Cumplimiento]
 *   post:
 *     summary: Generar Modelo 180 para un trimestre
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
    const trimestre = searchParams.get('trimestre');

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (ejercicio) where.ejercicio = parseInt(ejercicio);
    if (trimestre) where.trimestre = parseInt(trimestre);

    const records = await prisma.modelo180Record.findMany({
      where,
      orderBy: [{ ejercicio: 'desc' }, { trimestre: 'desc' }],
    });

    // Calcular totales
    const totalBaseImponible = records.reduce(
      (sum, r) => sum + r.baseImponible,
      0
    );
    const totalRetenido = records.reduce((sum, r) => sum + r.importeRetenido, 0);

    return NextResponse.json({
      records,
      summary: {
        totalRegistros: records.length,
        totalBaseImponible,
        totalRetenido,
        porcentajeRetencion:
          totalBaseImponible > 0
            ? (totalRetenido / totalBaseImponible) * 100
            : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener Modelo 180' },
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
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

    const params: GenerateModelo180Params = {
      companyId: body.companyId,
      ejercicio: body.ejercicio || currentYear,
      trimestre: body.trimestre || currentQuarter - 1 || 4,
    };

    const result = await generateModelo180(params);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al generar Modelo 180' },
      { status: 500 }
    );
  }
}
