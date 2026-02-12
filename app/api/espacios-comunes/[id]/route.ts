import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/espacios-comunes/[id] - Obtener espacio común por ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const espacio = await prisma.commonSpace.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
        reservations: {
          where: {
            estado: {
              in: ['pendiente', 'confirmada'],
            },
          },
          include: {
            tenant: {
              select: {
                nombreCompleto: true,
                email: true,
                telefono: true,
              },
            },
          },
          orderBy: {
            fechaReserva: 'asc',
          },
          take: 10,
        },
      },
    });

    if (!espacio) {
      return NextResponse.json({ error: 'Espacio común no encontrado' }, { status: 404 });
    }

    return NextResponse.json(espacio);
  } catch (error) {
    logger.error('Error fetching espacio común:', error);
    return NextResponse.json({ error: 'Error al obtener espacio común' }, { status: 500 });
  }
}

// PATCH /api/espacios-comunes/[id] - Actualizar espacio común
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Validar rol
    if (session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    // Verificar que el espacio pertenece a la empresa del usuario
    const espacioExistente = await prisma.commonSpace.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!espacioExistente) {
      return NextResponse.json({ error: 'Espacio común no encontrado' }, { status: 404 });
    }

    const espacio = await prisma.commonSpace.update({
      where: { id: params.id },
      data: body,
      include: {
        building: {
          select: {
            nombre: true,
            direccion: true,
          },
        },
      },
    });

    return NextResponse.json(espacio);
  } catch (error) {
    logger.error('Error updating espacio común:', error);
    return NextResponse.json({ error: 'Error al actualizar espacio común' }, { status: 500 });
  }
}

// DELETE /api/espacios-comunes/[id] - Eliminar espacio común
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Validar rol - administradores y super_admin pueden eliminar
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar que el espacio pertenece a la empresa del usuario
    const espacioExistente = await prisma.commonSpace.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!espacioExistente) {
      return NextResponse.json({ error: 'Espacio común no encontrado' }, { status: 404 });
    }

    await prisma.commonSpace.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Espacio común eliminado exitosamente' });
  } catch (error) {
    logger.error('Error deleting espacio común:', error);
    return NextResponse.json({ error: 'Error al eliminar espacio común' }, { status: 500 });
  }
}
