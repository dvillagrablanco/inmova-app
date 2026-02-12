/**
 * API: Verificación Exprés eWoorker
 * GET /api/ewoorker/verification/express - Verificar elegibilidad
 * POST /api/ewoorker/verification/express - Crear solicitud de verificación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerVerification } from '@/lib/ewoorker-verification-service';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET: Verificar elegibilidad para verificación exprés
 */
export async function GET() {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener perfil ewoorker del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: {
          include: { ewoorkerPerfil: true },
        },
      },
    });

    if (!user?.company?.ewoorkerPerfil) {
      return NextResponse.json({ error: 'No tienes perfil eWoorker' }, { status: 404 });
    }

    const eligibility = await ewoorkerVerification.checkVerificationEligibility(
      user.company.ewoorkerPerfil.id
    );

    return NextResponse.json({
      perfilEmpresaId: user.company.ewoorkerPerfil.id,
      empresaNombre: user.company.nombre,
      verificada: user.company.ewoorkerPerfil.verificado,
      eligibility,
      precio: 29, // €29
      beneficios: [
        'Revisión en menos de 24 horas',
        'Badge de verificación en tu perfil',
        'Prioridad en resultados de búsqueda',
        'Acceso a obras premium',
        'Mayor confianza de contratistas',
      ],
    });
  } catch (error: any) {
    logger.error('[EWOORKER_VERIFICATION_EXPRESS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Crear solicitud de verificación exprés
 */
export async function POST() {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener perfil ewoorker del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: {
          include: { ewoorkerPerfil: true },
        },
      },
    });

    if (!user?.company?.ewoorkerPerfil) {
      return NextResponse.json({ error: 'No tienes perfil eWoorker' }, { status: 404 });
    }

    const result = await ewoorkerVerification.createExpressVerificationRequest(
      user.company.ewoorkerPerfil.id,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      clientSecret: result.clientSecret,
      message: 'Solicitud creada. Completa el pago para procesar tu verificación.',
    });
  } catch (error: any) {
    logger.error('[EWOORKER_VERIFICATION_EXPRESS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
