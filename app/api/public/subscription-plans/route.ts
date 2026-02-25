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

    // Añadir features según tier (sincronizado con landing /landing/precios)
    const planesConFeatures = planes.map(plan => {
      let features: string[] = [];
      const tier = plan.tier?.toUpperCase();

      switch (tier) {
        case 'STARTER':
        case 'FREE':
          features = [
            'Hasta 5 propiedades',
            'Gestión básica de inquilinos',
            'Contratos simples',
            '5 firmas digitales/mes incluidas',
            '2GB almacenamiento',
            'Soporte por email',
          ];
          break;
        case 'PROFESSIONAL':
          features = [
            'Hasta 25 propiedades',
            'Gestión avanzada de inquilinos',
            'Contratos con firma digital',
            '20 firmas digitales/mes incluidas',
            '10GB almacenamiento',
            'Cobro automático de rentas',
            'Informes financieros',
            'Recordatorios automáticos',
            'Soporte prioritario',
          ];
          break;
        case 'BUSINESS':
          features = [
            'Hasta 100 propiedades',
            'Multi-propietario',
            '50 firmas digitales/mes incluidas',
            '50GB almacenamiento',
            'CRM integrado',
            'API de integración',
            'Los 7 verticales inmobiliarios',
            'Reportes avanzados',
            'Multi-idioma',
            'Account manager dedicado',
          ];
          break;
        case 'ENTERPRISE':
          features = [
            'Todo de Business',
            'Propiedades ilimitadas',
            'Firmas digitales ilimitadas',
            'Almacenamiento ilimitado',
            'White-label completo',
            'API ilimitada',
            'SLA garantizado 99.9%',
            'Integraciones personalizadas',
            'Todos los add-ons incluidos',
            'Soporte 24/7 dedicado',
          ];
          break;
        default:
          // Legacy tiers fallback
          features = plan.modulosIncluidos as string[] || [];
          break;
      }

      return {
        ...plan,
        features
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
