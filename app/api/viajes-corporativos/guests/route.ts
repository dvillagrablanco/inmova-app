import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ViajesCorporativosService } from '@/lib/services/viajes-corporativos-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;
    const { searchParams } = new URL(request.url);
    const filters = {
      departamento: searchParams.get('departamento') || undefined,
      nivelViajero: searchParams.get('nivelViajero') || undefined,
      search: searchParams.get('search') || undefined
    };
    const travelers = await ViajesCorporativosService.getTravelers(session.user.companyId, filters);
    return NextResponse.json({ success: true, data: travelers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
