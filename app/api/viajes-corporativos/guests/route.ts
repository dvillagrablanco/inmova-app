import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ViajesCorporativosService } from '@/lib/services/viajes-corporativos-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
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
