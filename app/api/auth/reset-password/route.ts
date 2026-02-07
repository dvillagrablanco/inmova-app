import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { hashResetToken } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const tokenHash = hashResetToken(parsed.data.token);
    const now = new Date();

    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: {
          gt: now,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error resetting password', error);
    return NextResponse.json(
      { error: 'No se pudo restablecer la contraseña' },
      { status: 500 }
    );
  }
}
