import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if platform-level Contasimple is configured
    const authKey = process.env.INMOVA_CONTASIMPLE_AUTH_KEY;
    const configured = !!authKey;

    // Count synced and pending invoices
    const [syncedCount, pendingCount] = await Promise.all([
      prisma.b2BInvoice.count({
        where: { contasimpleInvoiceId: { not: null } },
      }),
      prisma.b2BInvoice.count({
        where: { contasimpleInvoiceId: null },
      }),
    ]);

    return NextResponse.json({
      configured,
      enabled: configured,
      authKeyMasked: authKey ? `****${authKey.slice(-8)}` : null,
      invoicesSynced: syncedCount,
      pendingSync: pendingCount,
    });
  } catch (error) {
    console.error('Error getting Contasimple status:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado' },
      { status: 500 }
    );
  }
}
