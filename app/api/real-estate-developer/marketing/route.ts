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
      estado: searchParams.get('estado') || undefined
    };
    const campaigns = await RealEstateDeveloperService.getCampaigns(session.user.companyId, filters);
    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
