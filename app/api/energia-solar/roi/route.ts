import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Obtener datos de ROI
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const instalacionId = searchParams.get('instalacionId');

    // Mock - en producción calcular ROI real
    const roiData: any[] = [];

    return NextResponse.json({
      success: true,
      data: roiData,
    });
  } catch (error: any) {
    console.error('[API Energía Solar ROI Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
