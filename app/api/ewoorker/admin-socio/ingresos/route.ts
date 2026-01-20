/**
 * API: Resumen de ingresos del socio eWoorker
 * GET /api/ewoorker/admin-socio/ingresos
 * 
 * Muestra la división de beneficios:
 * - 50% para el socio fundador
 * - 50% para la plataforma (eWoorker/Inmova)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import ewoorkerStripeService from '@/lib/ewoorker-stripe-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar roles permitidos
    const allowedRoles = ['super_admin', 'administrador', 'socio_ewoorker'];
    if (!session || !allowedRoles.includes(session.user.role as string)) {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'mes_actual';

    // Calcular fechas
    const now = new Date();
    let desde: Date;
    let hasta: Date = now;

    switch (periodo) {
      case 'mes_actual':
        desde = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'mes_anterior':
        desde = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        hasta = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'trimestre':
        desde = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'anual':
        desde = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        desde = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Obtener resumen de ingresos
    const resumen = await ewoorkerStripeService.getResumenIngresosSocio({
      desde,
      hasta,
    });

    return NextResponse.json({
      periodo,
      desde: desde.toISOString(),
      hasta: hasta.toISOString(),
      divisionBeneficios: {
        socioPercentage: ewoorkerStripeService.EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE,
        plataformaPercentage: ewoorkerStripeService.EWOORKER_REVENUE_SPLIT.PLATAFORMA_PERCENTAGE,
      },
      resumen: {
        totalIngresos: resumen.totalIngresos,
        beneficioSocio: resumen.beneficioSocio,
        beneficioPlataforma: resumen.beneficioPlataforma,
        pagosCount: resumen.pagosCount,
      },
      desglosePorTipo: resumen.porTipo,
      nota: 'Todos los montos están en EUR. Los ingresos de eWoorker se dividen 50/50 entre el socio fundador y la plataforma.',
    });
  } catch (error: any) {
    logger.error('[eWoorker Admin Socio Ingresos Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener ingresos', details: error.message },
      { status: 500 }
    );
  }
}
