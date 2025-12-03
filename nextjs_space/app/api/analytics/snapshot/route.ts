import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateAnalyticsSnapshot } from '@/lib/analytics-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const snapshot = await generateAnalyticsSnapshot(companyId);

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error: any) {
    logger.error('Error generating snapshot:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar snapshot' },
      { status: 500 }
    );
  }
}
