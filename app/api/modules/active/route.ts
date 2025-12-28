import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getActiveModulesForCompany } from '@/lib/modules-service';
import logger from '@/lib/logger';
import { withDatabaseFallback, DEMO_DATA } from '@/lib/db-status';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Si no hay sesión, devolver módulos por defecto sin error
    if (!session?.user) {
      return NextResponse.json({
        activeModules: DEMO_DATA.activeModules,
      });
    }

    const companyId = (session.user as any).companyId;

    // Usar fallback si no hay BD disponible
    const activeModules = await withDatabaseFallback(
      () => getActiveModulesForCompany(companyId),
      DEMO_DATA.activeModules
    );

    return NextResponse.json({ activeModules });
  } catch (error: any) {
    logger.error('Error al obtener módulos activos:', error);

    // Devolver módulos por defecto en lugar de error
    return NextResponse.json({
      activeModules: DEMO_DATA.activeModules,
    });
  }
}
