import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/admin/companies/[id]/access
 * Obtiene la lista de usuarios con acceso a una empresa
 * Solo para super_admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const companyId = params.id;

    // Obtener usuarios con acceso a esta empresa
    const userAccess = await prisma.userCompanyAccess.findMany({
      where: {
        companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            activo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // También obtener usuarios cuya empresa principal es esta
    const primaryUsers = await prisma.user.findMany({
      where: {
        companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
      },
    });

    // Combinar ambos resultados
    const allAccess = [
      ...primaryUsers.map(user => ({
        userId: user.id,
        user,
        roleInCompany: user.role,
        activo: user.activo,
        isPrimary: true,
        grantedAt: null,
        lastAccess: null,
      })),
      ...userAccess.map(access => ({
        userId: access.userId,
        user: access.user,
        roleInCompany: access.roleInCompany,
        activo: access.activo,
        isPrimary: false,
        grantedAt: access.grantedAt,
        lastAccess: access.lastAccess,
      })),
    ];

    return NextResponse.json({
      success: true,
      access: allAccess,
    });
  } catch (error) {
    logger.error('Error fetching company access:', error);
    return NextResponse.json(
      { error: 'Error al obtener los accesos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/companies/[id]/access
 * Otorga acceso a un usuario a una empresa
 * Solo para super_admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const companyId = params.id;
    const body = await request.json();
    const { userId, roleInCompany } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'El ID de usuario es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Crear o actualizar el acceso
    const access = await prisma.userCompanyAccess.upsert({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      create: {
        userId,
        companyId,
        roleInCompany: roleInCompany || 'gestor',
        grantedBy: session.user.id,
        activo: true,
      },
      update: {
        roleInCompany: roleInCompany || 'gestor',
        activo: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Acceso otorgado exitosamente',
      access,
    });
  } catch (error) {
    logger.error('Error granting company access:', error);
    return NextResponse.json(
      { error: 'Error al otorgar el acceso' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/companies/[id]/access
 * Revoca el acceso de un usuario a una empresa
 * Solo para super_admin
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const companyId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'El ID de usuario es requerido' },
        { status: 400 }
      );
    }

    // No permitir revocar acceso a la empresa principal del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (user?.companyId === companyId) {
      return NextResponse.json(
        { error: 'No se puede revocar el acceso a la empresa principal del usuario' },
        { status: 400 }
      );
    }

    // Desactivar el acceso
    await prisma.userCompanyAccess.update({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      data: {
        activo: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Acceso revocado exitosamente',
    });
  } catch (error) {
    logger.error('Error revoking company access:', error);
    return NextResponse.json(
      { error: 'Error al revocar el acceso' },
      { status: 500 }
    );
  }
}
