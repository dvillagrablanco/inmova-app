/**
 * GET /api/accounting/contasimple/status
 * Estado de la integración ContaSimple
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ configured: false });
    }

    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const activeCompanyId = queryCompanyId || cookieCompanyId || session.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: activeCompanyId },
      select: { contasimpleEnabled: true, contasimpleAuthKey: true },
    });

    return NextResponse.json({
      configured: !!(company?.contasimpleEnabled && company?.contasimpleAuthKey),
      enabled: company?.contasimpleEnabled || false,
    });
  } catch {
    return NextResponse.json({ configured: false });
  }
}
