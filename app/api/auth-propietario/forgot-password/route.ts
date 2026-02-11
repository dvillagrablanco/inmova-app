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
    const owner = await prisma.owner.findUnique({ where: { email } });

    if (owner) {
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.owner.update({
        where: { id: owner.id },
        data: {
          resetToken: tokenHash,
          resetTokenExpiry: expiresAt,
        },
      });

      const resetLink = buildResetLink('/portal-propietario/reset-password', rawToken);

      try {
        const emailResult = await sendEmail({
          to: owner.email,
          subject: 'Restablecer contraseña del portal',
          text: `Solicitaste restablecer tu contraseña. Usa este enlace: ${resetLink}`,
          html: `
            <p>Solicitaste restablecer tu contraseña del portal.</p>
            <p>Usa este enlace para crear una nueva contraseña:</p>
            <p><a href="${resetLink}">Restablecer contraseña</a></p>
            <p>Si no fuiste tú, ignora este mensaje.</p>
          `,
        });

        if (!emailResult.success) {
          logger.warn('Owner password reset email not sent', { ownerId: owner.id });
        }
      } catch (emailError) {
        logger.error('Error sending owner password reset email', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing owner forgot password request', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la solicitud' },
      { status: 500 }
    );
  }
}
