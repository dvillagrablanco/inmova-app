/**
 * API: PRICING DINÁMICO PARA MEDIA ESTANCIA
 * 
 * Calcula el precio óptimo basado en mercado, características y temporada
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  calcularPricingOptimo,
  generarAnalisisPricingConIA,
  type CaracteristicasInmueble,
  type ParametrosAlquiler,
} from '@/lib/ai/medium-term-pricing-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const pricingRequestSchema = z.object({
  inmueble: z.object({
    ciudad: z.string().min(1),
    barrio: z.string().optional(),
    codigoPostal: z.string().min(4),
    superficie: z.number().positive(),
    habitaciones: z.number().int().positive(),
    banos: z.number().int().positive(),
    amueblado: z.boolean(),
    extras: z.array(z.string()).default([]),
    estadoConservacion: z.enum(['nuevo', 'reformado', 'bueno', 'mejorable']),
    antiguedad: z.number().int().min(0).optional(),
  }),
  parametros: z.object({
    duracionMeses: z.number().int().min(1).max(11),
    fechaInicio: z.string().datetime().or(z.date()),
    serviciosIncluidos: z.array(z.string()).default([]),
    aceptaMascotas: z.boolean().default(false),
    aceptaFumadores: z.boolean().default(false),
  }),
  incluirAnalisisIA: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = pricingRequestSchema.parse(body);

    // Preparar datos para el servicio
    const inmueble: CaracteristicasInmueble = {
      ...validatedData.inmueble,
    };

    const parametros: ParametrosAlquiler = {
      duracionMeses: validatedData.parametros.duracionMeses,
      fechaInicio: new Date(validatedData.parametros.fechaInicio),
      serviciosIncluidos: validatedData.parametros.serviciosIncluidos,
      aceptaMascotas: validatedData.parametros.aceptaMascotas,
      aceptaFumadores: validatedData.parametros.aceptaFumadores,
    };

    // Calcular pricing
    const pricing = await calcularPricingOptimo(inmueble, parametros);

    // Opcionalmente incluir análisis con IA
    let analisisIA: string | undefined;
    if (validatedData.incluirAnalisisIA) {
      analisisIA = await generarAnalisisPricingConIA(inmueble, parametros, pricing);
    }

    return NextResponse.json({
      success: true,
      data: {
        pricing,
        analisisIA,
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

    console.error('[API Error] POST /api/contracts/medium-term/pricing:', error);
    return NextResponse.json(
      { error: 'Error calculando pricing' },
      { status: 500 }
    );
  }
}
