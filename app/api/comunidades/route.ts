import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import type { Prisma } from '@/types/prisma-types';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

// Schema de validación para crear comunidad
const createComunidadSchema = z.object({
  buildingId: z.string().min(1, 'Edificio requerido'),
  nombreComunidad: z.string().min(1, 'Nombre requerido'),
  cif: z.string().optional(),
  direccion: z.string().min(1, 'Dirección requerida'),
  codigoPostal: z.string().optional(),
  ciudad: z.string().optional(),
  provincia: z.string().optional(),
  honorariosFijos: z.number().optional(),
  honorariosPorcentaje: z.number().optional(),
});

// GET - Listar comunidades
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const activa = searchParams.get('activa');

    const sessionUser = session.user as { companyId?: string | null };
    const companyId = sessionUser.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    // Construir filtros
    const where: Prisma.CommunityManagementWhereInput = { companyId };
    
    if (search) {
      where.OR = [
        { nombreComunidad: { contains: search, mode: 'insensitive' } },
        { direccion: { contains: search, mode: 'insensitive' } },
        { ciudad: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (activa !== null && activa !== undefined) {
      where.activa = activa === 'true';
    }

    // Obtener comunidades con estadísticas
    const [comunidades, total] = await Promise.all([
      prisma.communityManagement.findMany({
        where,
        include: {
          building: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              units: {
                select: { id: true },
              },
            },
          },
          facturas: {
            where: { estado: { in: ['emitida', 'vencida'] } },
            select: { id: true, totalFactura: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityManagement.count({ where }),
    ]);

    // Obtener estadísticas adicionales
    const stats = await prisma.communityManagement.aggregate({
      where: { companyId },
      _count: { id: true },
    });

    const activas = await prisma.communityManagement.count({
      where: { companyId, activa: true },
    });

    // Formatear respuesta
    const formattedComunidades = comunidades.map((c) => ({
      id: c.id,
      nombreComunidad: c.nombreComunidad,
      cif: c.cif,
      direccion: c.direccion,
      codigoPostal: c.codigoPostal,
      ciudad: c.ciudad,
      provincia: c.provincia,
      activa: c.activa,
      fechaInicio: c.fechaInicio,
      honorariosFijos: c.honorariosFijos,
      honorariosPorcentaje: c.honorariosPorcentaje,
      building: c.building
        ? {
            id: c.building.id,
            name: c.building.nombre,
            address: c.building.direccion,
          }
        : null,
      totalUnidades: c.building?.units?.length || 0,
      facturasPendientes: c.facturas?.length || 0,
      importePendiente: c.facturas?.reduce((sum, f) => sum + f.totalFactura, 0) || 0,
    }));

    return NextResponse.json({
      comunidades: formattedComunidades,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: stats._count.id,
        activas,
        inactivas: stats._count.id - activas,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Comunidades GET Error]:', { message });
    return NextResponse.json(
      { error: 'Error obteniendo comunidades', details: message },
      { status: 500 }
    );
  }
}

// POST - Crear comunidad
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sessionUser = session.user as { companyId?: string | null };
    const companyId = sessionUser.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await request.json();
    const validated = createComunidadSchema.parse(body);

    // Verificar que el edificio existe y pertenece a la empresa
    const building = await prisma.building.findFirst({
      where: {
        id: validated.buildingId,
        companyId,
      },
    });

    if (!building) {
      return NextResponse.json(
        { error: 'Edificio no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Verificar que no existe ya una comunidad para este edificio
    const existing = await prisma.communityManagement.findUnique({
      where: { buildingId: validated.buildingId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una comunidad asociada a este edificio' },
        { status: 400 }
      );
    }

    // Crear la comunidad
    const comunidad = await prisma.communityManagement.create({
      data: {
        companyId,
        buildingId: validated.buildingId,
        nombreComunidad: validated.nombreComunidad,
        cif: validated.cif,
        direccion: validated.direccion,
        codigoPostal: validated.codigoPostal,
        ciudad: validated.ciudad,
        provincia: validated.provincia,
        honorariosFijos: validated.honorariosFijos,
        honorariosPorcentaje: validated.honorariosPorcentaje,
        activa: true,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        comunidad: {
          ...comunidad,
          building: comunidad.building
            ? {
                id: comunidad.building.id,
                name: comunidad.building.nombre,
                address: comunidad.building.direccion,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Comunidades POST Error]:', { message });
    return NextResponse.json(
      { error: 'Error creando comunidad', details: message },
      { status: 500 }
    );
  }
}
