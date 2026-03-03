import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { parseMT940File } from '@/lib/parsers/swift-mt940-parser';
import { parseMT535File } from '@/lib/parsers/swift-mt535-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const ADMIN_ROLES = ['super_admin', 'administrador'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const type = (formData.get('type') as string)?.toLowerCase() || 'mt940';
    const buffer = Buffer.from(await file.arrayBuffer());

    if (type === 'mt535') {
      const statements = parseMT535File(buffer);
      const totalMarketValue = statements.reduce((sum, s) => sum + (s.totalMarketValue ?? 0), 0);
      return NextResponse.json({
        type: 'mt535',
        statementCount: statements.length,
        statements: statements.map((s) => ({
          accountId: s.accountId,
          currency: s.currency,
          statementDate: s.statementDate,
          preparationDate: s.preparationDate,
          totalMarketValue: s.totalMarketValue,
          positionCount: s.positions?.length ?? 0,
        })),
        totalMarketValue,
      });
    }

    const statements = parseMT940File(buffer);
    const totalBalance = statements.reduce((sum, s) => sum + (s.closingBalance ?? 0), 0);
    return NextResponse.json({
      type: 'mt940',
      statementCount: statements.length,
      statements: statements.map((s) => ({
        accountId: s.accountId,
        currency: s.currency,
        statementNumber: s.statementNumber,
        openingBalance: s.openingBalance,
        closingBalance: s.closingBalance,
        transactionCount: s.transactions?.length ?? 0,
      })),
      totalBalance,
    });
  } catch (error) {
    logger.error('[Family Office Import SWIFT]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
