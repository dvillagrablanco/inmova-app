import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { EWOORKER_PLANS } from '@/lib/ewoorker-stripe-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/ewoorker/planes
 * Lista los planes de suscripción de eWoorker
 * 
 * Modelo de negocio freemium + comisión:
 * - Obrero: Gratis + 5% comisión
 * - Capataz: €49/mes + 2% comisión (MÁS POPULAR)
 * - Constructor: €149/mes + 0% comisión
 */
export async function GET(request: NextRequest) {
  try {
    // Lazy load Prisma

    // Intentar obtener de BD
    let planesFromDB: any[] = [];
    
    try {
      planesFromDB = await prisma.ewoorkerPlan.findMany({
        where: { activo: true },
        orderBy: { orden: 'asc' },
      });
    } catch (dbError) {
      logger.warn('[eWoorker Planes] No se pudo leer de BD, usando config');
    }

    // Si hay planes en BD, usarlos
    if (planesFromDB.length > 0) {
      const planes = planesFromDB.map((plan: any) => ({
        id: plan.id,
        codigo: plan.codigo,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precio: {
          mensual: plan.precioMensual,
          anual: plan.precioAnual,
        },
        limites: {
          maxOfertas: plan.maxOfertas,
          comisionEscrow: plan.comisionEscrow,
        },
        features: plan.features,
        destacado: plan.destacado,
        revenueSpilt: {
          socio: plan.socioPercentage,
          plataforma: plan.plataformaPercentage,
        },
      }));

      return NextResponse.json({
        success: true,
        source: 'database',
        data: planes,
      });
    }

    // Fallback: usar config
    const planes = Object.values(EWOORKER_PLANS).map(plan => ({
      id: plan.id,
      codigo: plan.id.replace('ewoorker_', '').toUpperCase(),
      nombre: plan.name,
      precio: {
        mensual: plan.price,
        anual: plan.price * 10, // 2 meses gratis
      },
      limites: {
        maxOfertas: plan.maxOfertas,
        comisionEscrow: plan.comisionEscrow,
      },
      features: plan.features,
      destacado: plan.id === 'ewoorker_capataz', // Capataz es el popular
    }));

    return NextResponse.json({
      success: true,
      source: 'config',
      data: planes,
    });
  } catch (error: any) {
    logger.error('[eWoorker Planes Error]:', error);

    // Fallback a config siempre
    const planes = Object.values(EWOORKER_PLANS).map(plan => ({
      id: plan.id,
      codigo: plan.id.replace('ewoorker_', '').toUpperCase(),
      nombre: plan.name,
      precio: {
        mensual: plan.price,
        anual: plan.price * 10,
      },
      limites: {
        maxOfertas: plan.maxOfertas,
        comisionEscrow: plan.comisionEscrow,
      },
      features: plan.features,
      destacado: plan.id === 'ewoorker_capataz',
    }));

    return NextResponse.json({
      success: true,
      source: 'config-fallback',
      data: planes,
    });
  }
}
