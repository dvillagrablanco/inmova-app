import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getCenterOfCostsReport } from '@/lib/accounting-service';
import { format } from 'date-fns';

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
    const periodo = searchParams.get('periodo') || format(new Date(), 'yyyy-MM');

    const report = await getCenterOfCostsReport(user.companyId, periodo);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    return NextResponse.json(
      { error: 'Error al obtener centros de costo' },
      { status: 500 }
    );
  }
}
