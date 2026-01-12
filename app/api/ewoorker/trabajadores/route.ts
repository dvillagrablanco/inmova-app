export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validación para crear trabajador
const createTrabajadorSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  apellidos: z.string().optional(),
  especialidad: z.string().min(1, 'Especialidad requerida'),
  especialidadesSecundarias: z.array(z.string()).optional().default([]),
  experienciaAnios: z.number().int().min(0).optional(),
  descripcion: z.string().optional(),
  fotoUrl: z.string().url().optional().nullable(),
  tarifaHora: z.number().positive().optional(),
  tarifaDia: z.number().positive().optional(),
  tienePRL: z.boolean().optional().default(false),
  fechaCaducidadPRL: z.string().datetime().optional().nullable(),
  tieneReconocimientoMedico: z.boolean().optional().default(false),
  fechaReconocimientoMedico: z.string().datetime().optional().nullable(),
  certificacionesAdicionales: z.array(z.string()).optional().default([]),
  disponible: z.boolean().optional().default(true),
  disponibleDesde: z.string().datetime().optional().nullable(),
  disponibleHasta: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/ewoorker/trabajadores
 * Lista los trabajadores de la empresa del usuario autenticado
 * O busca trabajadores disponibles para subcontratar
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modo = searchParams.get('modo') || 'mis-trabajadores'; // 'mis-trabajadores' | 'buscar'
    const especialidad = searchParams.get('especialidad');
    const disponible = searchParams.get('disponible');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener perfil ewoorker del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId },
    });

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil ewoorker no encontrado' }, { status: 404 });
    }

    if (modo === 'mis-trabajadores') {
      // Listar trabajadores de MI empresa
      const trabajadores = await prisma.ewoorkerTrabajador.findMany({
        where: {
          perfilEmpresaId: perfil.id,
          activo: true,
        },
        orderBy: [{ disponible: 'desc' }, { nombre: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.ewoorkerTrabajador.count({
        where: {
          perfilEmpresaId: perfil.id,
          activo: true,
        },
      });

      return NextResponse.json({
        trabajadores,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } else {
      // Buscar trabajadores DISPONIBLES de OTRAS empresas para subcontratar
      const where: any = {
        disponible: true,
        activo: true,
        verificado: true,
        perfilEmpresaId: { not: perfil.id }, // No incluir los propios
        perfilEmpresa: {
          verificado: true,
          disponible: true,
        },
      };

      if (especialidad) {
        where.OR = [
          { especialidad: { contains: especialidad, mode: 'insensitive' } },
          { especialidadesSecundarias: { has: especialidad } },
        ];
      }

      if (disponible === 'ahora') {
        where.disponibleDesde = { lte: new Date() };
        where.OR = [{ disponibleHasta: null }, { disponibleHasta: { gte: new Date() } }];
      }

      const trabajadores = await prisma.ewoorkerTrabajador.findMany({
        where,
        include: {
          perfilEmpresa: {
            select: {
              id: true,
              nombreEmpresa: true,
              verificado: true,
              valoracionMedia: true,
              zonasOperacion: true,
            },
          },
        },
        orderBy: [{ rating: 'desc' }, { trabajosCompletados: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.ewoorkerTrabajador.count({ where });

      return NextResponse.json({
        trabajadores,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }
  } catch (error: any) {
    console.error('[EWOORKER_TRABAJADORES_GET]', error);
    return NextResponse.json({ error: 'Error al obtener trabajadores' }, { status: 500 });
  }
}

/**
 * POST /api/ewoorker/trabajadores
 * Crea un nuevo trabajador en la empresa del usuario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTrabajadorSchema.parse(body);

    // Obtener perfil ewoorker del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId },
    });

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil ewoorker no encontrado' }, { status: 404 });
    }

    // Verificar límite de trabajadores según plan
    const trabajadoresActuales = await prisma.ewoorkerTrabajador.count({
      where: { perfilEmpresaId: perfil.id, activo: true },
    });

    const limitesPorPlan: Record<string, number> = {
      OBRERO_FREE: 5,
      CAPATAZ_PRO: 25,
      CONSTRUCTOR_ENTERPRISE: 999,
    };

    const limite = limitesPorPlan[perfil.planActual] || 5;
    if (trabajadoresActuales >= limite) {
      return NextResponse.json(
        { error: `Límite de trabajadores alcanzado (${limite}). Actualiza tu plan.` },
        { status: 400 }
      );
    }

    // Crear trabajador
    const trabajador = await prisma.ewoorkerTrabajador.create({
      data: {
        perfilEmpresaId: perfil.id,
        nombre: validated.nombre,
        apellidos: validated.apellidos,
        especialidad: validated.especialidad,
        especialidadesSecundarias: validated.especialidadesSecundarias,
        experienciaAnios: validated.experienciaAnios,
        descripcion: validated.descripcion,
        fotoUrl: validated.fotoUrl,
        tarifaHora: validated.tarifaHora,
        tarifaDia: validated.tarifaDia,
        tienePRL: validated.tienePRL,
        fechaCaducidadPRL: validated.fechaCaducidadPRL
          ? new Date(validated.fechaCaducidadPRL)
          : null,
        tieneReconocimientoMedico: validated.tieneReconocimientoMedico,
        fechaReconocimientoMedico: validated.fechaReconocimientoMedico
          ? new Date(validated.fechaReconocimientoMedico)
          : null,
        certificacionesAdicionales: validated.certificacionesAdicionales,
        disponible: validated.disponible,
        disponibleDesde: validated.disponibleDesde ? new Date(validated.disponibleDesde) : null,
        disponibleHasta: validated.disponibleHasta ? new Date(validated.disponibleHasta) : null,
      },
    });

    // Actualizar contador de trabajadores en el perfil
    await prisma.ewoorkerPerfilEmpresa.update({
      where: { id: perfil.id },
      data: { numeroTrabajadores: { increment: 1 } },
    });

    return NextResponse.json({ trabajador }, { status: 201 });
  } catch (error: any) {
    console.error('[EWOORKER_TRABAJADORES_POST]', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error al crear trabajador' }, { status: 500 });
  }
}
