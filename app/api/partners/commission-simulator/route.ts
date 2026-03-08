import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/partners/commission-simulator?clients=20&avgSubscription=149
 * Simulates potential earnings for a partner
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clients = parseInt(searchParams.get('clients') || '10');
  const avgSubscription = parseFloat(searchParams.get('avgSubscription') || '149');

  // Commission tiers
  const tiers = [
    { min: 1, max: 10, pct: 20 },
    { min: 11, max: 25, pct: 30 },
    { min: 26, max: 50, pct: 40 },
    { min: 51, max: 100, pct: 50 },
    { min: 101, max: 250, pct: 60 },
    { min: 251, max: 9999, pct: 70 },
  ];

  const tier = tiers.find(t => clients >= t.min && clients <= t.max) || tiers[0];
  const monthlyRevenue = clients * avgSubscription;
  const monthlyCommission = monthlyRevenue * (tier.pct / 100);
  const annualCommission = monthlyCommission * 12;

  // Projections
  const projections = [6, 12, 24, 36].map(months => ({
    months,
    clients: Math.round(clients * (1 + months * 0.05)), // 5% growth/month
    commission: Math.round(monthlyCommission * months * (1 + months * 0.025)),
  }));

  return NextResponse.json({
    success: true,
    simulation: {
      clients,
      avgSubscription,
      tier: tier.pct + '%',
      tierLabel: clients >= 251 ? 'Platinum' : clients >= 51 ? 'Gold' : clients >= 11 ? 'Silver+' : 'Silver',
      monthlyRevenue: Math.round(monthlyRevenue),
      monthlyCommission: Math.round(monthlyCommission),
      annualCommission: Math.round(annualCommission),
    },
    tiers,
    projections,
  });
}
