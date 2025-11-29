import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    const history = await prisma.searchHistory.findMany({
      where: {
        userId: session.user.id,
        companyId
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error al obtener historial:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    await prisma.searchHistory.deleteMany({
      where: {
        userId: session.user.id,
        companyId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al limpiar historial:', error);
    return NextResponse.json(
      { error: 'Error al limpiar historial' },
      { status: 500 }
    );
  }
}
