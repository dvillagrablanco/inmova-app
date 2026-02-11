import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


import logger from '@/lib/logger';
import { sendEmail } from '@/lib/email-config';
import { buildResetLink, generateResetToken, hashResetToken } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const body: unknown = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const provider = await prisma.provider.findFirst({ where: { email } });

    if (provider && provider.activo) {
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.providerPasswordResetToken.updateMany({
        where: { providerId: provider.id, used: false },
        data: { used: true, usedAt: new Date() },
      });

      await prisma.providerPasswordResetToken.create({
        data: {
          providerId: provider.id,
          token: tokenHash,
          expiresAt,
        },
      });

      const resetLink = buildResetLink('/portal-proveedor/reset-password', rawToken);

      try {
        const emailResult = await sendEmail({
          to: provider.email || email,
          subject: 'Recuperación de contraseña',
          text: `Usa este enlace para restablecer tu contraseña: ${resetLink}`,
          html: `<p>Usa este enlace para restablecer tu contraseña:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
        });

        if (!emailResult.success) {
          logger.warn('Provider reset email not sent', { providerId: provider.id });
        }
      } catch (emailError) {
        logger.error('Error sending provider reset email', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.',
    });
  } catch (error) {
    logger.error('Error en solicitud de recuperación de contraseña:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
