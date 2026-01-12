import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Solo admins o superadmins pueden activar módulos
    if (user.role !== 'super_admin' && user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No tienes permisos para activar módulos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { moduloCodigo } = body;

    if (!moduloCodigo) {
      return NextResponse.json(
        { error: 'Código de módulo requerido' },
        { status: 400 }
      );
    }

    // Verificar si el módulo ya existe para esta empresa
    const existingModule = await prisma.companyModule.findFirst({
      where: {
        companyId: user.companyId,
        moduloCodigo
      }
    });

    if (existingModule) {
      // Si ya existe, solo actualizar el estado
      await prisma.companyModule.update({
        where: { id: existingModule.id },
        data: { activo: true }
      });
    } else {
      // Crear nuevo registro de módulo
      await prisma.companyModule.create({
        data: {
          companyId: user.companyId,
          moduloCodigo,
          activo: true
        }
      });
    }

    // Registrar en el log de auditoría
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Module',
        entityId: moduloCodigo,
        entityName: moduloCodigo,
        changes: `Usuario ${user.name} activó el módulo ${moduloCodigo}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }
    });

    logger.info(`Módulo ${moduloCodigo} activado para empresa ${user.companyId}`);

    return NextResponse.json({
      success: true,
      message: 'Módulo activado correctamente'
    });
  } catch (error) {
    logger.error('Error activating module:', error);
    return NextResponse.json(
      { error: 'Error al activar módulo' },
      { status: 500 }
    );
  }
}
