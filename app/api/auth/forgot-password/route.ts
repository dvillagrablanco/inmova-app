import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { sendEmail } from '@/lib/email-config';
import { buildResetLink, generateResetToken, hashResetToken } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: tokenHash,
          resetTokenExpiry: expiresAt,
        },
      });

      const resetLink = buildResetLink('/reset-password', rawToken);

      try {
        const emailResult = await sendEmail({
          to: user.email,
          subject: 'Restablecer contraseña',
          text: `Solicitaste restablecer tu contraseña. Usa este enlace: ${resetLink}`,
          html: `
            <p>Solicitaste restablecer tu contraseña.</p>
            <p>Usa este enlace para crear una nueva contraseña:</p>
            <p><a href="${resetLink}">Restablecer contraseña</a></p>
            <p>Si no fuiste tú, ignora este mensaje.</p>
          `,
        });

        if (!emailResult.success) {
          logger.warn('Password reset email not sent', { userId: user.id });
        }
      } catch (emailError) {
        logger.error('Error sending password reset email', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error processing forgot password request', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la solicitud' },
      { status: 500 }
    );
  }
}
