export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validación para cambiar disponibilidad
const disponibilidadSchema = z.object({
  disponible: z.boolean(),
  disponibleDesde: z.string().datetime().optional().nullable(),
  disponibleHasta: z.string().datetime().optional().nullable(),
  motivoNoDisponible: z.string().optional().nullable(),
});

/**
 * PATCH /api/ewoorker/trabajadores/[id]/disponibilidad
 * Cambia la disponibilidad de un trabajador (core del modelo ewoorker)
 *
 * Permite:
 * - Activar disponibilidad cuando hay baja carga de trabajo
 * - Desactivar cuando tienen trabajo
 * - Establecer período de disponibilidad
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = disponibilidadSchema.parse(body);

    // Obtener trabajador actual
    const trabajadorActual = await prisma.ewoorkerTrabajador.findUnique({
      where: { id: params.id },
      include: {
        perfilEmpresa: {
          select: {
            id: true,
            companyId: true,
            verificado: true,
            disponible: true,
          },
        },
      },
    });

    if (!trabajadorActual) {
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 });
    }

    // Verificar propiedad
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    if (trabajadorActual.perfilEmpresa.companyId !== user?.companyId) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar la disponibilidad de este trabajador' },
        { status: 403 }
      );
    }

    // Verificar que la empresa esté verificada para ofrecer trabajadores
    if (validated.disponible && !trabajadorActual.perfilEmpresa.verificado) {
      return NextResponse.json(
        { error: 'La empresa debe estar verificada para ofrecer trabajadores' },
        { status: 400 }
      );
    }

    // Verificar que la empresa no esté suspendida
    if (validated.disponible && !trabajadorActual.perfilEmpresa.disponible) {
      return NextResponse.json(
        { error: 'La empresa está suspendida temporalmente' },
        { status: 400 }
      );
    }

    // Actualizar disponibilidad
    const trabajador = await prisma.ewoorkerTrabajador.update({
      where: { id: params.id },
      data: {
        disponible: validated.disponible,
        disponibleDesde: validated.disponibleDesde
          ? new Date(validated.disponibleDesde)
          : validated.disponible
            ? new Date()
            : null,
        disponibleHasta: validated.disponibleHasta ? new Date(validated.disponibleHasta) : null,
        motivoNoDisponible: validated.disponible ? null : validated.motivoNoDisponible,
      },
    });

    // Registrar el cambio de disponibilidad para métricas
    // (Esto podría ser un evento/log separado si se quiere trackear)

    return NextResponse.json({
      success: true,
      trabajador,
      message: validated.disponible
        ? 'Trabajador ahora disponible para subcontratación'
        : 'Trabajador ya no está disponible',
    });
  } catch (error: any) {
    console.error('[EWOORKER_TRABAJADOR_DISPONIBILIDAD]', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error al cambiar disponibilidad' }, { status: 500 });
  }
}

/**
 * GET /api/ewoorker/trabajadores/[id]/disponibilidad
 * Obtiene el estado de disponibilidad actual
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const trabajador = await prisma.ewoorkerTrabajador.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nombre: true,
        especialidad: true,
        disponible: true,
        disponibleDesde: true,
        disponibleHasta: true,
        motivoNoDisponible: true,
        perfilEmpresa: {
          select: {
            nombreEmpresa: true,
            verificado: true,
            disponible: true,
          },
        },
      },
    });

    if (!trabajador) {
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 });
    }

    // Calcular disponibilidad efectiva
    const ahora = new Date();
    let disponibilidadEfectiva = trabajador.disponible;

    if (trabajador.disponible) {
      if (trabajador.disponibleDesde && new Date(trabajador.disponibleDesde) > ahora) {
        disponibilidadEfectiva = false; // Aún no disponible
      }
      if (trabajador.disponibleHasta && new Date(trabajador.disponibleHasta) < ahora) {
        disponibilidadEfectiva = false; // Ya no disponible
      }
    }

    return NextResponse.json({
      id: trabajador.id,
      nombre: trabajador.nombre,
      especialidad: trabajador.especialidad,
      disponible: trabajador.disponible,
      disponibleEfectivo: disponibilidadEfectiva,
      disponibleDesde: trabajador.disponibleDesde,
      disponibleHasta: trabajador.disponibleHasta,
      motivoNoDisponible: trabajador.motivoNoDisponible,
      empresa: trabajador.perfilEmpresa.nombreEmpresa,
      empresaVerificada: trabajador.perfilEmpresa.verificado,
    });
  } catch (error: any) {
    console.error('[EWOORKER_TRABAJADOR_DISPONIBILIDAD_GET]', error);
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500 });
  }
}
