export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema de validación para crear asignación
const createAsignacionSchema = z.object({
  trabajadorId: z.string().min(1, 'Trabajador requerido'),
  contratoId: z.string().min(1, 'Contrato/Obra requerido'),
  fechaInicio: z.string().datetime(),
  fechaFin: z.string().datetime().optional(),
  notas: z.string().optional(),
});

/**
 * GET /api/ewoorker/asignaciones
 * Lista las asignaciones de trabajadores a obras
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
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

    // Construir filtro
    const where: any = {
      trabajador: {
        perfilEmpresaId: perfil.id,
      },
    };

    if (estado && estado !== 'all') {
      where.estado = estado;
    }

    // Obtener asignaciones con datos relacionados
    const asignaciones = await prisma.ewoorkerAsignacionTrabajador.findMany({
      where,
      include: {
        trabajador: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            especialidad: true,
            fotoUrl: true,
            rating: true,
          },
        },
        contrato: {
          select: {
            id: true,
            obraId: true,
            precioFinal: true,
            estado: true,
            obra: {
              select: {
                id: true,
                titulo: true,
                direccion: true,
                municipio: true,
                provincia: true,
                perfilConstructor: {
                  select: {
                    nombreEmpresa: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ estado: 'asc' }, { fechaInicio: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.ewoorkerAsignacionTrabajador.count({ where });

    // Calcular estadísticas
    const stats = await prisma.ewoorkerAsignacionTrabajador.groupBy({
      by: ['estado'],
      where: {
        trabajador: {
          perfilEmpresaId: perfil.id,
        },
      },
      _count: true,
    });

    const statsMap = stats.reduce(
      (acc, s) => {
        acc[s.estado] = s._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Formatear asignaciones para frontend
    const formattedAsignaciones = asignaciones.map((a) => {
      const diasTotales = a.fechaFin
        ? Math.ceil(
            (new Date(a.fechaFin).getTime() - new Date(a.fechaInicio).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;
      const diasTrabajados = Math.ceil(
        (Date.now() - new Date(a.fechaInicio).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: a.id,
        trabajador: {
          id: a.trabajador.id,
          nombre: `${a.trabajador.nombre} ${a.trabajador.apellidos || ''}`.trim(),
          especialidad: a.trabajador.especialidad,
          avatar: a.trabajador.fotoUrl,
          rating: a.trabajador.rating || 0,
        },
        obra: {
          id: a.contrato.obra?.id || a.contrato.id,
          nombre: a.contrato.obra?.titulo || 'Obra sin nombre',
          empresa: a.contrato.obra?.perfilConstructor?.nombreEmpresa || 'Empresa',
          direccion: a.contrato.obra
            ? `${a.contrato.obra.direccion}, ${a.contrato.obra.municipio}`
            : '',
        },
        fechaInicio: a.fechaInicio,
        fechaFin: a.fechaFin,
        estado: a.estado,
        tarifaDiaria: a.contrato.precioFinal ? Number(a.contrato.precioFinal) / diasTotales : 0,
        diasTrabajados: Math.max(0, Math.min(diasTrabajados, diasTotales)),
        diasTotales: diasTotales,
        valoracion: a.valoracion,
        notas: a.notas,
      };
    });

    return NextResponse.json({
      asignaciones: formattedAsignaciones,
      stats: {
        totalAsignaciones: total,
        activas: statsMap['en_curso'] || 0,
        completadas: statsMap['completado'] || 0,
        pendientes: statsMap['asignado'] || 0,
        canceladas: statsMap['cancelado'] || 0,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[EWOORKER_ASIGNACIONES_GET]', error);
    return NextResponse.json({ error: 'Error al obtener asignaciones' }, { status: 500 });
  }
}

/**
 * POST /api/ewoorker/asignaciones
 * Crea una nueva asignación de trabajador a obra
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createAsignacionSchema.parse(body);

    // Verificar que el trabajador pertenece a la empresa del usuario
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

    // Verificar trabajador
    const trabajador = await prisma.ewoorkerTrabajador.findUnique({
      where: { id: validated.trabajadorId },
    });

    if (!trabajador || trabajador.perfilEmpresaId !== perfil.id) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado o no pertenece a tu empresa' },
        { status: 400 }
      );
    }

    // Crear asignación
    const asignacion = await prisma.ewoorkerAsignacionTrabajador.create({
      data: {
        trabajadorId: validated.trabajadorId,
        contratoId: validated.contratoId,
        fechaInicio: new Date(validated.fechaInicio),
        fechaFin: validated.fechaFin ? new Date(validated.fechaFin) : null,
        estado: 'asignado',
        notas: validated.notas,
      },
      include: {
        trabajador: true,
        contrato: {
          include: {
            obra: true,
          },
        },
      },
    });

    return NextResponse.json({ asignacion }, { status: 201 });
  } catch (error: any) {
    console.error('[EWOORKER_ASIGNACIONES_POST]', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error al crear asignación' }, { status: 500 });
  }
}
