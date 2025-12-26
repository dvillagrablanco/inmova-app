import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/switch-company
 * Cambia la empresa activa del usuario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'El ID de la empresa es requerido' }, { status: 400 });
    }

    // Verificar que el usuario tiene acceso a esta empresa
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true },
    });

    // Verificar si es la empresa principal del usuario
    const isPrimaryCompany = user?.companyId === companyId;

    // Si no es la empresa principal, verificar en UserCompanyAccess
    if (!isPrimaryCompany) {
      const access = await prisma.userCompanyAccess.findUnique({
        where: {
          userId_companyId: {
            userId: session.user.id,
            companyId,
          },
        },
      });

      if (!access || !access.activo) {
        return NextResponse.json({ error: 'No tienes acceso a esta empresa' }, { status: 403 });
      }

      // Actualizar lastAccess
      await prisma.userCompanyAccess.update({
        where: {
          userId_companyId: {
            userId: session.user.id,
            companyId,
          },
        },
        data: {
          lastAccess: new Date(),
        },
      });
    }

    // Actualizar el companyId en la sesión del usuario
    // Nota: Esto requiere que el usuario vuelva a iniciar sesión o se refresque la sesión
    // Por ahora, simplemente devolvemos success y el frontend manejará el redirect

    return NextResponse.json({
      success: true,
      message: 'Empresa cambiada exitosamente',
      companyId,
      redirect: true,
    });
  } catch (error) {
    logger.error('Error switching company:', error);
    return NextResponse.json({ error: 'Error al cambiar de empresa' }, { status: 500 });
  }
}
