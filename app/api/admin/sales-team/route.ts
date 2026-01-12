import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Por ahora, retornar datos vacíos
    // En el futuro, conectar con modelo real del equipo de ventas
    return NextResponse.json({
      stats: {
        totalVendedores: 0,
        ventasMes: 0,
        metaGlobal: 0,
        progresoMeta: 0,
        mejorVendedor: '-',
        clientesNuevos: 0,
      },
      salesReps: [],
    });
  } catch (error) {
    console.error('[API Error] Sales team:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
