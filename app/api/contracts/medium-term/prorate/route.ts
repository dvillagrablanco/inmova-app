/**
 * API: CALCULADORA DE PRORRATEO
 * 
 * Calcula el prorrateo de días para contratos de media estancia
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { calcularProrrateoSchema } from '@/lib/validations/medium-term-rental';
import { calcularProrrateo, generarResumenProrrateo } from '@/lib/medium-term-rental-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * POST: Calcular prorrateo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = calcularProrrateoSchema.parse(body);

    const fechaInicio = new Date(validatedData.fechaInicio);
    const fechaFin = new Date(validatedData.fechaFin);
    const rentaMensual = validatedData.rentaMensual;

    const prorrateo = calcularProrrateo(fechaInicio, fechaFin, rentaMensual);

    return NextResponse.json({
      success: true,
      data: {
        ...prorrateo,
        resumenTexto: generarResumenProrrateo(prorrateo),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          detalles: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[API Error] POST /api/contracts/medium-term/prorate:', error);
    return NextResponse.json(
      { error: 'Error calculando prorrateo' },
      { status: 500 }
    );
  }
}
