import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user?.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const prisma = await getPrisma();

    const txs = await prisma.accountingTransaction.findMany({
      where: {
        companyId: scope.activeCompanyId,
        paymentId: { not: null },
        referencia: { startsWith: 'INV-' },
      },
      select: { paymentId: true, referencia: true },
    });

    const map: Record<string, string> = {};
    for (const tx of txs) {
      if (tx.paymentId && tx.referencia) {
        map[tx.paymentId] = tx.referencia;
      }
    }

    return NextResponse.json(map);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al listar facturas' },
      { status: 500 }
    );
  }
}
