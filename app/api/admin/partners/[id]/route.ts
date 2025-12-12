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

    // Aquí deberías actualizar en la base de datos
    const updatedPartner = {
      id,
      ...data,
    };

    logger.info('Partner actualizado:', { partnerId: id });

    return NextResponse.json(updatedPartner);
  } catch (error) {
    logger.error('Error al actualizar partner:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Aquí deberías eliminar de la base de datos
    logger.info('Partner eliminado:', { partnerId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error al eliminar partner:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
