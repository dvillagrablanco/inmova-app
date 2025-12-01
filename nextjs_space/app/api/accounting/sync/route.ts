import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { syncPaymentsToAccounting, syncExpensesToAccounting } from '@/lib/accounting-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    const paymentsSynced = await syncPaymentsToAccounting(user.companyId);
    const expensesSynced = await syncExpensesToAccounting(user.companyId);

    return NextResponse.json({
      message: 'Sincronización completada',
      paymentsSynced,
      expensesSynced,
      totalSynced: paymentsSynced + expensesSynced,
    });
  } catch (error) {
    console.error('Error syncing to accounting:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar con contabilidad' },
      { status: 500 }
    );
  }
}
