import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { parsePictetPDF } from '@/lib/parsers/pictet-pdf-parser';

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const statement = await parsePictetPDF(buffer);

    return NextResponse.json({
      accountName: statement.accountName,
      currency: statement.currency,
      period: statement.period,
      transactionCount: statement.transactions.length,
      closingBalance: statement.closingBalance,
    });
  } catch (error) {
    logger.error('[Family Office Import Pictet PDF]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
