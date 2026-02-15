import { requireSession } from '@/lib/api-auth-guard';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/portal-propietario/settings
 * Obtiene la configuración del propietario
 */
export async function GET(request: NextRequest) {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
  const prisma = await getPrisma();
  try {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
    const ownerId = request.headers.get('x-owner-id');
    if (!ownerId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        telefono: true,
        direccion: true,
        notificarPagos: true,
        notificarOcupacion: true,
        notificarMantenimiento: true,
        notificarVencimientos: true,
        idioma: true,
        zona: true,
      },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'Propietario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(owner);
  } catch (error: any) {
    logger.error('Error al obtener configuración del propietario:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portal-propietario/settings
 * Actualiza la configuración del propietario
 */
export async function PUT(request: NextRequest) {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
  const prisma = await getPrisma();
  try {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
    const ownerId = request.headers.get('x-owner-id');
    if (!ownerId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      nombreCompleto,
      telefono,
      direccion,
      notificarPagos,
      notificarOcupacion,
      notificarMantenimiento,
      notificarVencimientos,
      idioma,
      zona,
      currentPassword,
      newPassword,
    } = body;

    // If password change is requested, verify current password
    if (newPassword) {
      const owner = await prisma.owner.findUnique({
        where: { id: ownerId },
      });

      if (!owner) {
        return NextResponse.json(
          { error: 'Propietario no encontrado' },
          { status: 404 }
        );
      }

      const isValidPassword = await bcrypt.compare(currentPassword, owner.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.owner.update({
        where: { id: ownerId },
        data: {
          password: hashedPassword,
          nombreCompleto,
          telefono,
          direccion,
          notificarPagos,
          notificarOcupacion,
          notificarMantenimiento,
          notificarVencimientos,
          idioma,
          zona,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Configuración y contraseña actualizadas',
      });
    }

    // Update only settings (no password change)
    await prisma.owner.update({
      where: { id: ownerId },
      data: {
        nombreCompleto,
        telefono,
        direccion,
        notificarPagos,
        notificarOcupacion,
        notificarMantenimiento,
        notificarVencimientos,
        idioma,
        zona,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada',
    });
  } catch (error: any) {
    logger.error('Error al actualizar configuración del propietario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}