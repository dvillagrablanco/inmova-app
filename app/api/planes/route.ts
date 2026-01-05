import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PRICING_PLANS, ADD_ONS } from '@/lib/pricing-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/planes
 * API pública para obtener los planes disponibles
 * Se usa en la landing page de precios
 */
export async function GET(request: NextRequest) {
  try {
    // Intentar obtener de BD
    let planesFromDB = await prisma.subscriptionPlan.findMany({
      where: { activo: true },
      orderBy: { precioMensual: 'asc' },
    });

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
        source: 'config',
        planes: planesFromConfig,
        addOns: Object.values(ADD_ONS).map(addon => ({
          id: addon.id,
          nombre: addon.name,
          descripcion: addon.description,
          precioMensual: addon.monthlyPrice,
          disponiblePara: addon.availableFor,
          incluidoEn: addon.includedIn,
        })),
      });
    }

    // Formatear planes de BD
    const planes = planesFromDB.map(plan => ({
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
      addOns: Object.values(ADD_ONS).map(addon => ({
        id: addon.id,
        nombre: addon.name,
        descripcion: addon.description,
        precioMensual: addon.monthlyPrice,
        disponiblePara: addon.availableFor,
        incluidoEn: addon.includedIn,
      })),
    });

  } catch (error: any) {
    console.error('[Planes API Error]:', error);
    
    // Fallback a config si falla BD
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

    return NextResponse.json({
      source: 'config-fallback',
      planes: planesFromConfig,
    });
  }
}
