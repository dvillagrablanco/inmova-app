export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Información del Representante de Ventas actual
 * GET: Obtener datos del representante logueado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Formatear respuesta como representante de ventas
    const salesRepData = {
      id: user.id,
      nombreCompleto: user.name,
      email: user.email,
      telefono: null, // Campo no disponible en esquema actual
      foto: null, // Campo no disponible en esquema actual
      empresa: user.company?.nombre,
      rol: user.role,
      fechaAlta: user.createdAt,
      // Datos adicionales de ventas (si existiera el modelo)
      zona: null,
      objetivo: null,
      comisionBase: null,
    };

    return NextResponse.json(salesRepData);
  } catch (error) {
    logger.error('Error fetching sales representative:', error);
    return NextResponse.json({ error: 'Error al obtener representante' }, { status: 500 });
  }
}
