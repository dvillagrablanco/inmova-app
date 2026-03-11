import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const CERTIFICATION_TIERS = [
  {
    tier: 'silver',
    minClientes: 1,
    minComisiones: 0,
    label: 'Silver',
    color: '#C0C0C0',
    beneficios: ['Acceso al portal partner', 'Landing co-branded', 'Soporte por email'],
  },
  {
    tier: 'gold',
    minClientes: 10,
    minComisiones: 5000,
    label: 'Gold',
    color: '#FFD700',
    beneficios: ['Todo de Silver', 'Comisión 30%', 'Soporte prioritario', 'Formación exclusiva'],
  },
  {
    tier: 'platinum',
    minClientes: 50,
    minComisiones: 25000,
    label: 'Platinum',
    color: '#E5E4E2',
    beneficios: [
      'Todo de Gold',
      'Comisión 50%',
      'Account manager dedicado',
      'White-label completo',
      'API premium',
    ],
  },
];

/**
 * GET /api/partners/certification?partnerId=xxx
 * Returns partner's certification level based on performance
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 });

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true, nombre: true, comisionPorcentaje: true, createdAt: true },
    });
    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

    // Count referrals converted
    const clientesConvertidos = await prisma.lead.count({
      where: {
        origenDetalle: partnerId,
        fuente: 'partner_referral',
        estado: { in: ['convertido', 'cliente', 'ganado'] },
      },
    });

    // Sum commissions
    const comisiones = await prisma.commission.aggregate({
      where: { partnerId },
      _sum: { montoComision: true },
    });
    const totalComisiones = comisiones._sum.montoComision || 0;

    // Determine tier
    let currentTier = CERTIFICATION_TIERS[0];
    for (const tier of CERTIFICATION_TIERS) {
      if (clientesConvertidos >= tier.minClientes && totalComisiones >= tier.minComisiones) {
        currentTier = tier;
      }
    }

    // Next tier
    const nextTierIdx = CERTIFICATION_TIERS.indexOf(currentTier) + 1;
    const nextTier =
      nextTierIdx < CERTIFICATION_TIERS.length ? CERTIFICATION_TIERS[nextTierIdx] : null;

    return NextResponse.json({
      success: true,
      partner: partner.nombre,
      certification: {
        tier: currentTier.tier,
        label: currentTier.label,
        color: currentTier.color,
        beneficios: currentTier.beneficios,
      },
      metrics: { clientesConvertidos, totalComisiones: Math.round(totalComisiones * 100) / 100 },
      nextTier: nextTier
        ? {
            tier: nextTier.tier,
            label: nextTier.label,
            clientesFaltan: Math.max(0, nextTier.minClientes - clientesConvertidos),
            comisionesFaltan: Math.max(0, nextTier.minComisiones - totalComisiones),
          }
        : null,
      allTiers: CERTIFICATION_TIERS,
    });
  } catch (error: any) {
    logger.error('[Partner Certification]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
