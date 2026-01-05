/**
 * API de Referidos para Portal de Inquilinos
 * GET: Obtener estadísticas y código de referido
 * POST: Enviar invitación
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { tenantReferrals, REFERRAL_CONFIG } from '@/lib/tenant-referral-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Obtener estadísticas y código
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener código activo
    const code = await tenantReferrals.getOrCreateReferralCode(tenantId);

    // Obtener estadísticas
    const stats = await tenantReferrals.getReferralStats(tenantId);

    // Obtener invitaciones
    const invitations = await tenantReferrals.getInvitations(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        code,
        shareUrl: `${process.env.NEXTAUTH_URL}/portal-inquilino/register?ref=${code}`,
        stats,
        invitations,
        config: {
          referrerRewardPoints: REFERRAL_CONFIG.REFERRER_REWARD_POINTS,
          referredRewardPoints: REFERRAL_CONFIG.REFERRED_REWARD_POINTS,
          verifiedBonusPoints: REFERRAL_CONFIG.VERIFIED_BONUS_POINTS,
          maxActiveReferrals: REFERRAL_CONFIG.MAX_ACTIVE_REFERRALS,
          codeExpiryDays: REFERRAL_CONFIG.CODE_EXPIRY_DAYS,
        },
      },
    });
  } catch (error: any) {
    console.error('[Tenant Referrals GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo referidos' },
      { status: 500 }
    );
  }
}

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  message: z.string().optional(),
});

// POST: Enviar invitación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = inviteSchema.parse(body);

    const result = await tenantReferrals.sendInvitation(
      tenantId,
      validated.email,
      validated.message
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: `Invitación enviada a ${validated.email}`,
    });
  } catch (error: any) {
    console.error('[Tenant Referrals POST Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email inválido', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Error enviando invitación' },
      { status: 500 }
    );
  }
}
