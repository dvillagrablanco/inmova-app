import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { RealEstateDeveloperService } from '@/lib/services/real-estate-developer-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const filters = {
      proyectoId: searchParams.get('proyectoId') || undefined,
      estadoPago: searchParams.get('estadoPago') || undefined
    };
    const sales = await RealEstateDeveloperService.getSales(session.user.companyId, filters);
    return NextResponse.json({ success: true, data: sales });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
