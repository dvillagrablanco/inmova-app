import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/companies
 * Obtiene todas las empresas a las que tiene acceso el usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todas las empresas a las que tiene acceso el usuario
    const userAccess = await prisma.userCompanyAccess.findMany({
      where: {
        userId: session?.user?.id,
        activo: true,
      },
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
            estadoCliente: true,
            activo: true,
            dominioPersonalizado: true,
          },
        },
      },
      orderBy: {
        lastAccess: 'desc',
      },
    });

    // También incluir la empresa principal del usuario
    const user = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
            estadoCliente: true,
            activo: true,
            dominioPersonalizado: true,
          },
        },
      },
    });

    // Crear un set de IDs de empresas para evitar duplicados
    const companyIds = new Set(userAccess.map((access) => access.companyId));

    const companies = userAccess.map((access) => ({
      ...access.company,
      roleInCompany: access.roleInCompany,
      isCurrent: access.companyId === session?.user?.companyId,
      isPrimary: access.companyId === user?.companyId,
      lastAccess: access.lastAccess,
    }));

    // Añadir la empresa principal si no está en la lista
    if (user?.company && !companyIds.has(user.companyId)) {
      companies.unshift({
        ...user.company,
        roleInCompany: user.role,
        isCurrent: user.companyId === session?.user?.companyId,
        isPrimary: true,
        lastAccess: null,
      });
    }

    return NextResponse.json({
      success: true,
      companies,
      currentCompanyId: session?.user?.companyId,
    });
  } catch (error) {
    logger.error('Error fetching user companies:', error);
    return NextResponse.json({ error: 'Error al obtener las empresas' }, { status: 500 });
  }
}
