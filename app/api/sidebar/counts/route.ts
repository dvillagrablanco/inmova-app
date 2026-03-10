import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Mock data - en producción se calcularían desde BD
    const counts = {
      pagos_pendientes: 3,
      incidencias_abiertas: 5,
      contratos_por_vencer: 2,
      candidatos_nuevos: 4,
    };

    return NextResponse.json(counts);
  } catch (error) {
    console.error('[Sidebar Counts API] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener contadores' },
      { status: 500 }
    );
  }
}
