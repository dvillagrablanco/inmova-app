import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Por ahora, retornar datos vacíos
    // En el futuro, conectar con modelo real de proveedores
    return NextResponse.json({
      providers: [],
    });
  } catch (error) {
    console.error('[API Error] Marketplace providers:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
