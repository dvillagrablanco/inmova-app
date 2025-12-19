import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
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

    const result = await prisma.notification.updateMany({
      where: {
        companyId: user.companyId,
        OR: [
          { userId: user.id },
          { userId: null }
        ],
        leida: false
      },
      data: {
        leida: true
      }
    });

    return NextResponse.json({ 
      message: 'Todas las notificaciones marcadas como leídas',
      count: result.count
    });
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    return NextResponse.json(
      { error: 'Error al actualizar notificaciones' },
      { status: 500 }
    );
  }
}
