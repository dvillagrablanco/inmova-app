import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * API: Pagos para Portal Inquilino
 * GET - Obtener historial de pagos del inquilino
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que sea inquilino
    if (session.user.role !== 'TENANT' && session.user.role !== 'INQUILINO') {
      return NextResponse.json(
        { error: 'Acceso denegado - Solo para inquilinos' },
        { status: 403 }
      );
    }

    // Buscar pagos del inquilino
    const pagos = await prisma.pago.findMany({
      where: {
        inquilinoId: session.user.id,
      },
      include: {
        contrato: {
          include: {
            propiedad: {
              select: {
                direccion: true,
                ciudad: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaPago: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      payments: pagos,
    });
  } catch (error: any) {
    console.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
