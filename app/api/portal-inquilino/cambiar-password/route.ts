import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { authTenantOptions } from '@/lib/auth-tenant-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

type TenantSessionUser = {
  id?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authTenantOptions);
    const user = session?.user as TenantSessionUser | undefined;
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.id },
    });

    if (!tenant || !tenant.password) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(
      parsed.data.currentPassword,
      tenant.password
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error cambiando contraseña del inquilino', error);
    return NextResponse.json(
      { error: 'Error al cambiar contraseña' },
      { status: 500 }
    );
  }
}
