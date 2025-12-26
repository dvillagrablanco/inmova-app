import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const userEmail = user.email;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Buscar usuario por email
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar contraseña actual
    const passwordValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    logger.error('Error changing password:', error);
    return NextResponse.json({ error: 'Error al cambiar contraseña' }, { status: 500 });
  }
}
