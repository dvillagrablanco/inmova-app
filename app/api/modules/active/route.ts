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

    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const userRole = (session.user as any).role;
    
    // Si es super_admin y se especifica un companyId, usar ese
    // De lo contrario, usar el companyId de la sesión
    let companyId = (session.user as any).companyId;
    
    if (queryCompanyId && userRole === 'super_admin') {
      companyId = queryCompanyId;
    }
    
    const activeModules = await getActiveModulesForCompany(companyId);

    return NextResponse.json({ activeModules, companyId });
  } catch (error: any) {
    logger.error('Error al obtener módulos activos:', error);
    return NextResponse.json(
      { error: 'Error al obtener módulos activos' },
      { status: 500 }
    );
  }
}
