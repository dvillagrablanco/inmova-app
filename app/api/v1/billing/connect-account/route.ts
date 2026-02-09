/**
 * API Route: Stripe Connect Account
 * 
 * POST /api/v1/billing/connect-account - Crear cuenta Connect
 * GET /api/v1/billing/connect-account - Obtener estado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createConnectAccount, getConnectAccountStatus } from '@/lib/stripe-connect-service';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins pueden crear cuenta Connect
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const result = await createConnectAccount(session.user.companyId);

    return NextResponse.json(result);

  } catch (error: any) {
    logger.error('Error creating Connect account:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });
    const stripeConnectAccountId = (company as any)?.stripeConnectAccountId;

    if (!stripeConnectAccountId) {
      return NextResponse.json({ hasAccount: false });
    }

    const status = await getConnectAccountStatus(stripeConnectAccountId);

    return NextResponse.json({
      hasAccount: true,
      accountId: stripeConnectAccountId,
      ...status,
    });

  } catch (error: any) {
    logger.error('Error fetching Connect account:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
