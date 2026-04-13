import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import { calcularMorosidad } from '@/lib/services/morosidad-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user?.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Company no encontrada' }, { status: 400 });
    }

    const result = await calcularMorosidad(scope.scopeCompanyIds);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API morosidad]:', error);
    return NextResponse.json({ error: 'Error al calcular morosidad' }, { status: 500 });
  }
}
