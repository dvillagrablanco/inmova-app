/**
 * API de Servicios para el Portal del Proveedor
 * 
 * GET - Lista los servicios del proveedor autenticado
 * POST - Crea un nuevo servicio para el proveedor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedProvider } from '@/lib/provider-auth';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para crear/actualizar servicio
const servicioSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(200),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  precio: z.number().min(0).optional().nullable(),
  tipoPrecio: z.enum(['fijo', 'hora', 'presupuesto']).default('fijo'),
  activo: z.boolean().default(true),
});

// GET /api/portal-proveedor/servicios - Listar servicios del proveedor
export async function GET(req: NextRequest) {
  try {
    const provider = await getAuthenticatedProvider();

    if (!provider) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    const activo = searchParams.get('activo');
    const search = searchParams.get('search');

    // Construir filtros
    const where: any = {
      providerId: provider.id,
    };

    if (categoria && categoria !== 'all') {
      where.categoria = { equals: categoria, mode: 'insensitive' };
    }

    if (activo !== null && activo !== undefined) {
      where.activo = activo === 'true';
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const servicios = await prisma.marketplaceService.findMany({
      where,
      include: {
        _count: {
          select: {
            reservas: true,
          },
        },
      },
      orderBy: [
        { destacado: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transformar al formato esperado por el frontend
    const serviciosFormateados = servicios.map((servicio) => ({
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      categoria: servicio.categoria,
      precio: servicio.precio || 0,
      tipoPrecio: servicio.tipoPrecio,
      activo: servicio.activo,
      destacado: servicio.destacado,
      reservas: servicio._count.reservas,
      valoracion: servicio.rating || 0,
      totalReviews: servicio.totalReviews,
      createdAt: servicio.createdAt,
      updatedAt: servicio.updatedAt,
    }));

    return NextResponse.json(serviciosFormateados);
  } catch (error) {
    logger.error('Error al obtener servicios del proveedor:', error);
    return NextResponse.json(
      { error: 'Error al obtener servicios' },
      { status: 500 }
    );
  }
}

// POST /api/portal-proveedor/servicios - Crear nuevo servicio
export async function POST(req: NextRequest) {
  try {
    const provider = await getAuthenticatedProvider();

    if (!provider) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validar datos con Zod
    const validationResult = servicioSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Crear el servicio
    const servicio = await prisma.marketplaceService.create({
      data: {
        companyId: provider.companyId,
        providerId: provider.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria,
        precio: data.precio || null,
        tipoPrecio: data.tipoPrecio,
        activo: data.activo,
        disponible: data.activo,
        destacado: false,
        totalReviews: 0,
      },
    });

    logger.info(`Servicio creado por proveedor: ${servicio.id}`, {
      providerId: provider.id,
      servicioId: servicio.id,
    });

    return NextResponse.json({
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      categoria: servicio.categoria,
      precio: servicio.precio || 0,
      tipoPrecio: servicio.tipoPrecio,
      activo: servicio.activo,
      destacado: servicio.destacado,
      reservas: 0,
      valoracion: 0,
      totalReviews: 0,
      createdAt: servicio.createdAt,
      updatedAt: servicio.updatedAt,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error al crear servicio:', error);
    return NextResponse.json(
      { error: 'Error al crear servicio' },
      { status: 500 }
    );
  }
}
