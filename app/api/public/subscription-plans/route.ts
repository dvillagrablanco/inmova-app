import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/public/subscription-plans
 * Endpoint público para obtener planes de suscripción activos
 * No requiere autenticación
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener solo planes activos y públicos (no internos), ordenados por precio
    // Los planes con esInterno=true (como Owner) no se muestran en landing
    const planes = await prisma.subscriptionPlan.findMany({
      where: {
        activo: true,
        esInterno: false, // Excluir planes internos (Owner)
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        tier: true,
        precioMensual: true,
        maxUsuarios: true,
        maxPropiedades: true,
        modulosIncluidos: true,
        activo: true,
      },
      orderBy: {
        precioMensual: 'asc'
      }
    });

    // Añadir información adicional según tier
    // Soporta tanto tiers nuevos (STARTER, PROFESSIONAL, etc.) como legacy (basico, profesional, etc.)
    const planesConFeatures = planes.map(plan => {
      let features: string[] = [];
      const tierLower = plan.tier.toLowerCase();

      if (tierLower === 'starter' || tierLower === 'basico' || tierLower === 'free') {
        features = [
          'Hasta 5 propiedades',
          'Gestión básica de inquilinos',
          'Contratos simples',
          '2 firmas digitales/mes',
          '1GB almacenamiento',
          'Soporte por email',
        ];
      } else if (tierLower === 'professional' || tierLower === 'profesional') {
        features = [
          'Todo de Starter +',
          'Hasta 25 propiedades',
          '5 firmas digitales/mes',
          'Portal inquilinos y propietarios',
          'CRM integrado',
          'Reportes avanzados',
          'Cobro automático de rentas',
          'Soporte prioritario',
        ];
      } else if (tierLower === 'business' || tierLower === 'empresarial') {
        features = [
          'Todo de Professional +',
          'Hasta 100 propiedades',
          '15 firmas digitales/mes',
          'Los 7 verticales inmobiliarios',
          'API de integración',
          'Automatizaciones',
          'Account manager dedicado',
          'Multi-idioma',
        ];
      } else if (tierLower === 'enterprise' || tierLower === 'personalizado') {
        features = [
          'Todo de Business +',
          'Propiedades ilimitadas',
          'Firmas digitales ilimitadas',
          'Almacenamiento ilimitado',
          'White-label completo',
          'API ilimitada',
          'SLA 99.9% garantizado',
          'Todos los add-ons incluidos',
          'Soporte 24/7 dedicado',
        ];
      }

      return {
        ...plan,
        features,
        // Añadir precio anual calculado (2 meses gratis)
        precioAnual: plan.precioMensual * 10,
        ahorroAnual: plan.precioMensual * 2,
      };
    });

    return NextResponse.json(planesConFeatures);
  } catch (error: any) {
    logger.error('[Public Plans API Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo planes' },
      { status: 500 }
    );
  }
}
