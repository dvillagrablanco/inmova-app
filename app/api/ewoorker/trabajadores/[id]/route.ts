export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
// Schema de validación para actualizar trabajador
const updateTrabajadorSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellidos: z.string().optional(),
  especialidad: z.string().optional(),
  especialidadesSecundarias: z.array(z.string()).optional(),
  experienciaAnios: z.number().int().min(0).optional(),
  descripcion: z.string().optional(),
  fotoUrl: z.string().url().optional().nullable(),
  tarifaHora: z.number().positive().optional().nullable(),
  tarifaDia: z.number().positive().optional().nullable(),
  tienePRL: z.boolean().optional(),
  fechaCaducidadPRL: z.string().datetime().optional().nullable(),
  tieneReconocimientoMedico: z.boolean().optional(),
  fechaReconocimientoMedico: z.string().datetime().optional().nullable(),
  certificacionesAdicionales: z.array(z.string()).optional(),
  activo: z.boolean().optional(),
});

/**
 * GET /api/ewoorker/trabajadores/[id]
 * Obtiene un trabajador específico
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const trabajador = await prisma.ewoorkerTrabajador.findUnique({
      where: { id: params.id },
      include: {
        perfilEmpresa: {
          select: {
            id: true,
            verificado: true,
            valoracionMedia: true,
            zonasOperacion: true,
            companyId: true,
            company: {
              select: {
                nombre: true,
              },
            },
          },
        },
        asignaciones: {
          where: { estado: { not: 'cancelado' } },
          orderBy: { fechaInicio: 'desc' },
          take: 5,
          include: {
            contrato: {
              select: {
                id: true,
                numeroContrato: true,
                estado: true,
                constructor: false,
                obra: {
                  select: {
                    titulo: true,
                    municipio: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!trabajador) {
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 });
    }

    // Verificar si el usuario tiene acceso (es de su empresa o está disponible para subcontratar)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    const esMiTrabajador = trabajador.perfilEmpresa.companyId === user?.companyId;
    const esPublico =
      trabajador.disponible && trabajador.activo && trabajador.perfilEmpresa.verificado;

    if (!esMiTrabajador && !esPublico) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { company, ...perfilEmpresaBase } = trabajador.perfilEmpresa;
    const trabajadorFormateado = {
      ...trabajador,
      perfilEmpresa: {
        ...perfilEmpresaBase,
        nombreEmpresa: company?.nombre || 'Sin nombre',
      },
    };

    return NextResponse.json({
      trabajador: trabajadorFormateado,
      esMiTrabajador,
    });
  } catch (error: any) {
    logger.error('[EWOORKER_TRABAJADOR_GET]', error);
    return NextResponse.json({ error: 'Error al obtener trabajador' }, { status: 500 });
  }
}

/**
 * PUT /api/ewoorker/trabajadores/[id]
 * Actualiza un trabajador
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateTrabajadorSchema.parse(body);

    // Obtener trabajador actual
    const trabajadorActual = await prisma.ewoorkerTrabajador.findUnique({
      where: { id: params.id },
      include: {
        perfilEmpresa: {
          select: { companyId: true },
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
        { error: 'No tienes permiso para editar este trabajador' },
        { status: 403 }
      );
    }

    // Actualizar
    const trabajador = await prisma.ewoorkerTrabajador.update({
      where: { id: params.id },
      data: {
        ...validated,
        fechaCaducidadPRL: validated.fechaCaducidadPRL
          ? new Date(validated.fechaCaducidadPRL)
          : undefined,
        fechaReconocimientoMedico: validated.fechaReconocimientoMedico
          ? new Date(validated.fechaReconocimientoMedico)
          : undefined,
      },
    });

    return NextResponse.json({ trabajador });
  } catch (error: any) {
    logger.error('[EWOORKER_TRABAJADOR_PUT]', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error al actualizar trabajador' }, { status: 500 });
  }
}

/**
 * DELETE /api/ewoorker/trabajadores/[id]
 * Desactiva un trabajador (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener trabajador actual
    const trabajadorActual = await prisma.ewoorkerTrabajador.findUnique({
      where: { id: params.id },
      include: {
        perfilEmpresa: {
          select: { id: true, companyId: true },
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
        { error: 'No tienes permiso para eliminar este trabajador' },
        { status: 403 }
      );
    }

    // Verificar que no tenga asignaciones activas
    const asignacionesActivas = await prisma.ewoorkerAsignacionTrabajador.count({
      where: {
        trabajadorId: params.id,
        estado: { in: ['asignado', 'en_curso'] },
      },
    });

    if (asignacionesActivas > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un trabajador con asignaciones activas' },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.ewoorkerTrabajador.update({
      where: { id: params.id },
      data: {
        activo: false,
        disponible: false,
      },
    });

    // Actualizar contador de trabajadores en el perfil
    await prisma.ewoorkerPerfilEmpresa.update({
      where: { id: trabajadorActual.perfilEmpresa.id },
      data: { numeroTrabajadores: { decrement: 1 } },
    });

    return NextResponse.json({ success: true, message: 'Trabajador eliminado' });
  } catch (error: any) {
    logger.error('[EWOORKER_TRABAJADOR_DELETE]', error);
    return NextResponse.json({ error: 'Error al eliminar trabajador' }, { status: 500 });
  }
}
