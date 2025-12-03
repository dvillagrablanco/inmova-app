import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getActiveModulesForCompany } from '@/lib/modules-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const activeModules = await getActiveModulesForCompany(companyId);

    return NextResponse.json({ activeModules });
  } catch (error: any) {
    logger.error('Error al obtener módulos activos:', error);
    return NextResponse.json(
      { error: 'Error al obtener módulos activos' },
      { status: 500 }
    );
  }
}
