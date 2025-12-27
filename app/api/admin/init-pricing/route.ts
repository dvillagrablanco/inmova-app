/**
 * API Endpoint para inicializar planes de suscripción y cupones promocionales
 * Solo accesible para super_admin
 * 
 * POST /api/admin/init-pricing?type=plans
 * POST /api/admin/init-pricing?type=coupons
 * POST /api/admin/init-pricing?type=all
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { PRICING_PLANS, PROMO_CAMPAIGNS } from '@/lib/pricing-config';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const MAIN_COMPANY_ID = 'sistema';
const CREATED_BY = 'sistema';

async function initializePlans() {
  const results = [];
  
  for (const [key, plan] of Object.entries(PRICING_PLANS)) {
    try {
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: { tier: plan.tier }
      });

      const planData = {
        nombre: plan.name,
        tier: plan.tier,
        descripcion: plan.description,
        precioMensual: plan.monthlyPrice,
        maxUsuarios: typeof plan.maxUsers === 'number' ? plan.maxUsers : 999,
        maxPropiedades: typeof plan.maxProperties === 'number' ? plan.maxProperties : 999999,
        modulosIncluidos: plan.features
          .filter(f => f.included)
          .map(f => f.text),
        activo: true,
      };

      if (existingPlan) {
        const updated = await prisma.subscriptionPlan.update({
          where: { id: existingPlan.id },
          data: planData
        });
        results.push({ action: 'updated', plan: updated.nombre });
      } else {
        const created = await prisma.subscriptionPlan.create({
          data: planData
        });
        results.push({ action: 'created', plan: created.nombre });
      }
    } catch (error) {
      logger.error(`Error processing plan ${plan.name}:`, error);
      results.push({ action: 'error', plan: plan.name, error: String(error) });
    }
  }
  
  return results;
}

async function initializeCoupons() {
  const results = [];
  
  for (const [key, campaign] of Object.entries(PROMO_CAMPAIGNS)) {
    try {
      const existingCoupon = await prisma.discountCoupon.findFirst({
        where: { codigo: campaign.code }
      });

      const couponData = {
        companyId: MAIN_COMPANY_ID,
        codigo: campaign.code,
        tipo: campaign.discountType === 'percentage' ? 'percentage' as const : 'fixed_amount' as const,
        valor: campaign.discountValue,
        descripcion: `${campaign.name} - ${campaign.description}\n\n${campaign.message}`,
        usosMaximos: campaign.maxUses || null,
        usosActuales: 0,
        usosPorUsuario: 1,
        montoMinimo: null,
        fechaInicio: campaign.validFrom,
        fechaExpiracion: campaign.validUntil,
        aplicaATodos: true,
        unidadesPermitidas: [],
        planesPermitidos: [campaign.targetPlan],
        estado: 'activo' as const,
        activo: true,
        creadoPor: CREATED_BY,
      };

      if (existingCoupon) {
        const updated = await prisma.discountCoupon.update({
          where: { id: existingCoupon.id },
          data: couponData
        });
        results.push({ action: 'updated', coupon: updated.codigo });
      } else {
        const created = await prisma.discountCoupon.create({
          data: couponData
        });
        results.push({ action: 'created', coupon: created.codigo });
      }
    } catch (error) {
      logger.error(`Error processing campaign ${campaign.name}:`, error);
      results.push({ action: 'error', coupon: campaign.code, error: String(error) });
    }
  }
  
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const response: any = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    if (type === 'plans' || type === 'all') {
      logger.info('Inicializando planes de suscripción...');
      response.plans = await initializePlans();
    }

    if (type === 'coupons' || type === 'all') {
      logger.info('Inicializando cupones promocionales...');
      response.coupons = await initializeCoupons();
    }

    // Obtener resumen
    if (type === 'plans' || type === 'all') {
      const allPlans = await prisma.subscriptionPlan.findMany({
        include: {
          _count: {
            select: { companies: true }
          }
        },
        orderBy: { precioMensual: 'asc' }
      });
      response.plansSummary = allPlans.map(p => ({
        nombre: p.nombre,
        tier: p.tier,
        precioMensual: p.precioMensual,
        companias: p._count.companies,
        activo: p.activo
      }));
    }

    if (type === 'coupons' || type === 'all') {
      const allCoupons = await prisma.discountCoupon.findMany({
        where: {
          codigo: {
            in: Object.values(PROMO_CAMPAIGNS).map(c => c.code)
          }
        },
        include: {
          _count: {
            select: { usos: true }
          }
        }
      });
      response.couponsSummary = allCoupons.map(c => ({
        codigo: c.codigo,
        tipo: c.tipo,
        valor: c.valor,
        usos: `${c.usosActuales}/${c.usosMaximos || '∞'}`,
        vigencia: {
          inicio: c.fechaInicio,
          fin: c.fechaExpiracion
        },
        activo: c.activo
      }));
    }

    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('Error initializing pricing:', error);
    return NextResponse.json(
      { 
        error: 'Error al inicializar configuración de precios',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
