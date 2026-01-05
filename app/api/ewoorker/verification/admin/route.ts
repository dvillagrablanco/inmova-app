/**
 * API: Admin de verificaciones eWoorker
 * GET /api/ewoorker/verification/admin - Listar pendientes
 * POST /api/ewoorker/verification/admin - Procesar verificación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerVerification } from '@/lib/ewoorker-verification-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['super_admin', 'administrador', 'socio_ewoorker'];

/**
 * GET: Listar verificaciones pendientes
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const [pendientes, stats] = await Promise.all([
      ewoorkerVerification.getPendingVerifications(),
      ewoorkerVerification.getVerificationStats(),
    ]);

    return NextResponse.json({
      pendientes,
      stats,
    });
  } catch (error: any) {
    console.error('[EWOORKER_VERIFICATION_ADMIN_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const processSchema = z.object({
  solicitudId: z.string(),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

/**
 * POST: Procesar una verificación
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { solicitudId, approved, rejectionReason } = processSchema.parse(body);

    if (!approved && !rejectionReason) {
      return NextResponse.json(
        { error: 'Debe proporcionar un motivo de rechazo' },
        { status: 400 }
      );
    }

    const result = await ewoorkerVerification.processVerification(
      solicitudId,
      session.user.id,
      approved,
      rejectionReason
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: approved ? 'Verificación aprobada' : 'Verificación rechazada',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[EWOORKER_VERIFICATION_ADMIN_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
