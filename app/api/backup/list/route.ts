import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBackups } from '@/lib/backup-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const backups = await getBackups(companyId);

    return NextResponse.json({ backups });
  } catch (error: any) {
    logger.error('Error listing backups:', error);
    return NextResponse.json({ error: 'Error al listar backups' }, { status: 500 });
  }
}
