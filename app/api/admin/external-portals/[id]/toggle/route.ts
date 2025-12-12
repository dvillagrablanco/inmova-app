import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { id } = params;
    const { enabled } = data;

    // Aquí deberías actualizar en la base de datos
    logger.info(`Portal ${enabled ? 'activado' : 'desactivado'}:`, { portalId: id });

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    logger.error('Error al activar/desactivar portal:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
