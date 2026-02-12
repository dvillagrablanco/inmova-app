import { NextRequest, NextResponse } from 'next/server';
import { PRICING_PLANS, ADD_ONS } from '@/lib/pricing-config';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/planes
 * API pública para obtener los planes y add-ons disponibles
 * Se usa en la landing page de precios
 * 
 * Fuentes de datos (prioridad):
 * 1. Base de datos (subscription_plans, addons)
 * 2. Configuración estática (pricing-config.ts)
 */
export async function GET(request: NextRequest) {
  try {
    // Lazy load Prisma

    // Intentar obtener de BD
    let planesFromDB: any[] = [];
    let addonsFromDB: any[] = [];

    try {
      planesFromDB = await prisma.subscriptionPlan.findMany({
        where: { activo: true },
        orderBy: { precioMensual: 'asc' },
      });
    } catch (e) {
      logger.warn('[Planes API] No se pudo leer planes de BD');
    }

    try {
      addonsFromDB = await prisma.addOn.findMany({
        where: { activo: true },
        orderBy: [{ destacado: 'desc' }, { orden: 'asc' }],
      });
    } catch (e) {
      logger.warn('[Planes API] No se pudo leer add-ons de BD');
    }

    // Formatear add-ons
    let addOns;
    if (addonsFromDB.length > 0) {
      addOns = addonsFromDB.map((addon: any) => ({
        id: addon.id,
        codigo: addon.codigo,
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        categoria: addon.categoria,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual,
        unidades: addon.unidades,
        tipoUnidad: addon.tipoUnidad,
        disponiblePara: addon.disponiblePara,
        incluidoEn: addon.incluidoEn,
        destacado: addon.destacado,
      }));
    } else {
      // Fallback a config
      addOns = Object.values(ADD_ONS).map(addon => ({
        id: addon.id,
        codigo: addon.id,
        nombre: addon.name,
        descripcion: addon.description,
        categoria: 'feature',
        precioMensual: addon.monthlyPrice,
        precioAnual: addon.monthlyPrice * 10,
        disponiblePara: addon.availableFor,
        incluidoEn: addon.includedIn,
        destacado: false,
      }));
    }

    // Si no hay planes en BD, usar los del config
    if (planesFromDB.length === 0) {
      const planesFromConfig = Object.values(PRICING_PLANS).map(plan => ({
        id: plan.id,
        nombre: plan.name,
        tier: plan.tier.toUpperCase(),
        descripcion: plan.description,
        precioMensual: plan.monthlyPrice,
        precioAnual: plan.annualPrice,
        ahorroAnual: plan.annualSavings,
        maxUsuarios: typeof plan.maxUsers === 'number' ? plan.maxUsers : 999,
        maxPropiedades: typeof plan.maxProperties === 'number' ? plan.maxProperties : 9999,
        features: plan.features.filter(f => f.included).map(f => f.text),
        popular: plan.popular || false,
        cta: plan.cta,
        targetAudience: plan.targetAudience,
        killerFeature: plan.killerFeature,
      }));

      return NextResponse.json({
        source: addonsFromDB.length > 0 ? 'mixed' : 'config',
        planes: planesFromConfig,
        addOns,
      });
    }

    // Formatear planes de BD
    const planes = planesFromDB.map((plan: any) => ({
      id: plan.id,
      nombre: plan.nombre,
      tier: plan.tier,
      descripcion: plan.descripcion,
      precioMensual: plan.precioMensual,
      precioAnual: plan.precioMensual * 10, // 2 meses gratis
      ahorroAnual: plan.precioMensual * 2,
      maxUsuarios: plan.maxUsuarios,
      maxPropiedades: plan.maxPropiedades,
      limites: {
        firmasDigitales: plan.signaturesIncludedMonth,
        almacenamientoGB: plan.storageIncludedGB,
        tokensIA: plan.aiTokensIncludedMonth,
        sms: plan.smsIncludedMonth,
      },
      modulosIncluidos: plan.modulosIncluidos,
    }));

    return NextResponse.json({
      source: 'database',
      planes,
      addOns,
    });

  } catch (error: any) {
    logger.error('[Planes API Error]:', error);
    
    // Fallback completo a config si falla todo
    const planesFromConfig = Object.values(PRICING_PLANS).map(plan => ({
      id: plan.id,
      nombre: plan.name,
      tier: plan.tier.toUpperCase(),
      descripcion: plan.description,
      precioMensual: plan.monthlyPrice,
      precioAnual: plan.annualPrice,
      ahorroAnual: plan.annualSavings,
      maxUsuarios: typeof plan.maxUsers === 'number' ? plan.maxUsers : 999,
      maxPropiedades: typeof plan.maxProperties === 'number' ? plan.maxProperties : 9999,
      features: plan.features.filter(f => f.included).map(f => f.text),
      popular: plan.popular || false,
    }));

    const addOnsFromConfig = Object.values(ADD_ONS).map(addon => ({
      id: addon.id,
      codigo: addon.id,
      nombre: addon.name,
      descripcion: addon.description,
      precioMensual: addon.monthlyPrice,
      disponiblePara: addon.availableFor,
      incluidoEn: addon.includedIn,
    }));

    return NextResponse.json({
      source: 'config-fallback',
      planes: planesFromConfig,
      addOns: addOnsFromConfig,
    });
  }
}
