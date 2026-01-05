import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/subscription-plans
 * Endpoint público para obtener planes de suscripción activos
 * No requiere autenticación
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener solo planes activos, ordenados por precio
    const planes = await prisma.subscriptionPlan.findMany({
      where: {
        activo: true
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
        // Límites de integraciones
        signaturesIncludedMonth: true,
        storageIncludedGB: true,
        aiTokensIncludedMonth: true,
        smsIncludedMonth: true,
      },
      orderBy: {
        precioMensual: 'asc'
      }
    });

    // Añadir información adicional según tier
    const planesConFeatures = planes.map(plan => {
      let features: string[] = [];

      switch (plan.tier) {
        case 'basico':
          features = [
            'Dashboard básico',
            'Portal inquilino web',
            'Contratos digitales',
            'Soporte por email (48h)',
            'App móvil',
            'Notificaciones email'
          ];
          break;
        case 'profesional':
          features = [
            'Todo lo de Basic',
            'CRM con pipeline de ventas',
            'Automatizaciones básicas',
            'Informes personalizados',
            'Soporte prioritario (24h)',
            '1 módulo add-on gratis',
            'Integraciones con terceros',
            'Firma digital de contratos',
            'API access básico'
          ];
          break;
        case 'empresarial':
          features = [
            'Todo lo de Professional',
            'Multi-empresa',
            'Workflows personalizados',
            'Integraciones avanzadas',
            'Soporte 24/7',
            'Account manager dedicado',
            'Capacitación incluida',
            '3 módulos add-on incluidos',
            'API access completo',
            'White-label opcional'
          ];
          break;
        case 'premium':
          features = [
            'Todo lo de Business',
            'Desarrollo a medida',
            'White-label completo',
            'SLA 99.9% garantizado',
            'Infraestructura dedicada',
            'Todos los add-ons incluidos',
            'Consultoría estratégica',
            'Soporte 24/7 premium',
            'Account manager senior',
            'Acceso anticipado a features',
            'Integraciones custom',
            'Capacitación ilimitada'
          ];
          break;
      }

      return {
        ...plan,
        features
      };
    });

    return NextResponse.json(planesConFeatures);
  } catch (error: any) {
    console.error('[Public Plans API Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo planes' },
      { status: 500 }
    );
  }
}
