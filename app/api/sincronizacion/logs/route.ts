import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar logs de sincronización
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const integracionId = searchParams.get('integracionId');
    const nivel = searchParams.get('nivel');
    const limit = parseInt(searchParams.get('limit') || '100');

    const logs: any[] = [];

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error('[API Logs Sync Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
