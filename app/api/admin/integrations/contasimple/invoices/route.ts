import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const synced = searchParams.get('synced');

    const where: any = {};
    
    if (synced === 'true') {
      where.contasimpleInvoiceId = { not: null };
    } else if (synced === 'false') {
      where.contasimpleInvoiceId = null;
    }

    const invoices = await prisma.b2BInvoice.findMany({
      where,
      include: {
        company: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error getting invoices:', error);
    return NextResponse.json(
      { error: 'Error obteniendo facturas' },
      { status: 500 }
    );
  }
}
