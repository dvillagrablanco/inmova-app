import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

const switchCompanySchema = z.object({
  companyId: z.string(),
});

// POST - Cambiar de empresa (para usuarios de soporte)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Solo super_admin puede cambiar de empresa
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para cambiar de empresa' },
        { status: 403 }
      );
    }

    const validatedData = switchCompanySchema.parse(body);

    // Verificar que la empresa existe
    const company = await prisma.company.findUnique({
      where: { id: validatedData.companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya tiene acceso a esta empresa
    let access = await prisma.userCompanyAccess.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: validatedData.companyId,
        },
      },
    });

    // Si no tiene acceso, crearlo
    if (!access) {
      access = await prisma.userCompanyAccess.create({
        data: {
          userId: user.id,
          companyId: validatedData.companyId,
          roleInCompany: user.role,
          grantedBy: user.id,
          activo: true,
        },
      });
    }

    // Actualizar el último acceso
    await prisma.userCompanyAccess.update({
      where: { id: access.id },
      data: { lastAccess: new Date() },
    });

    return NextResponse.json({
      message: 'Empresa cambiada exitosamente',
      company,
      access,
    });
  } catch (error: any) {
    logger.error('Error al cambiar de empresa:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al cambiar de empresa' },
      { status: 500 }
    );
  }
}
