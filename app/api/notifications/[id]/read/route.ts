import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        OR: [
          { userId: user.id },
          { userId: null }
        ]
      }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { leida: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return NextResponse.json(
      { error: 'Error al actualizar notificación' },
      { status: 500 }
    );
  }
}
