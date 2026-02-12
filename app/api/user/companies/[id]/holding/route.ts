import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const updateSchema = z.object({
  parentCompanyId: z.string().nullable(),
});

async function userHasCompanyAccess(userId: string, companyId: string) {
  const prisma = await getPrisma();
  const access = await prisma.userCompanyAccess.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  if (access?.activo) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  return user?.companyId === companyId;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    const companyId = params.id;
    const { parentCompanyId } = parsed.data;
    const role = session.user.role;

    if (parentCompanyId && parentCompanyId === companyId) {
      return NextResponse.json(
        { error: 'La empresa no puede ser su propia holding' },
        { status: 400 }
      );
    }

    // Verificar acceso a la empresa objetivo
    if (role !== 'super_admin') {
      const hasAccess = await userHasCompanyAccess(session.user.id, companyId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes acceso a esta empresa' },
          { status: 403 }
        );
      }
    }

    // Validar holding si se proporciona
    if (parentCompanyId) {
      const parent = await prisma.company.findUnique({
        where: { id: parentCompanyId },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json(
          { error: 'Holding no encontrada' },
          { status: 404 }
        );
      }

      if (role !== 'super_admin') {
        const hasParentAccess = await userHasCompanyAccess(
          session.user.id,
          parentCompanyId
        );
        if (!hasParentAccess) {
          return NextResponse.json(
            { error: 'No tienes acceso a la holding seleccionada' },
            { status: 403 }
          );
        }
      }
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { parentCompanyId },
      select: {
        id: true,
        nombre: true,
        parentCompanyId: true,
        parentCompany: {
          select: { id: true, nombre: true },
        },
      },
    });

    return NextResponse.json({ success: true, company: updated });
  } catch (error) {
    logger.error('Error updating holding:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la holding' },
      { status: 500 }
    );
  }
}
