import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getBalanceSheet } from '@/lib/accounting-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get('fecha');
    const fecha = fechaParam ? new Date(fechaParam) : new Date();

    const balance = await getBalanceSheet(user.companyId, fecha);

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Error al obtener balance' },
      { status: 500 }
    );
  }
}
