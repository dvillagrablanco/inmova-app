/**
 * API de Marketplace de Servicios
 * GET: Listar servicios disponibles
 * POST: Crear solicitud de servicio
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Listar servicios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener servicios del marketplace
    const services = await prisma.marketplaceService.findMany({
      where: {
        activo: true,
        ...(category && { categoria: category }),
        ...(search && {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        provider: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            tipo: true,
            rating: true,
          },
        },
      },
      orderBy: [{ destacado: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    // Obtener categorías disponibles
    const categories = await prisma.marketplaceService.findMany({
      where: { activo: true },
      select: { categoria: true },
      distinct: ['categoria'],
    });

    // Obtener reviews promedio por servicio
    const servicesWithRating = await Promise.all(
      services.map(async (service) => {
        const bookings = await prisma.marketplaceBooking.findMany({
          where: {
            serviceId: service.id,
            rating: { not: null },
          },
          select: { rating: true },
        });

        const avgRating =
          bookings.length > 0
            ? bookings.reduce((sum, b) => sum + (b.rating || 0), 0) / bookings.length
            : 0;

        return {
          ...service,
          avgRating,
          reviewCount: bookings.length,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        services: servicesWithRating,
        categories: categories.map((c) => c.categoria),
      },
    });
  } catch (error: unknown) {
    logger.error('[Marketplace Services GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo servicios' },
      { status: 500 }
    );
  }
}

const bookingSchema = z.object({
  serviceId: z.string().min(1),
  unitId: z.string().optional(),
  fechaSolicitada: z.string().min(1),
  notas: z.string().optional(),
});

// POST: Crear reserva/solicitud de servicio
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const validatedResult = bookingSchema.safeParse(body);
    if (!validatedResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validatedResult.error.errors },
        { status: 400 }
      );
    }
    const validated = validatedResult.data;

    // Verificar que el servicio existe
    const service = await prisma.marketplaceService.findUnique({
      where: { id: validated.serviceId },
      include: { provider: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    // Obtener tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { units: true, company: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    const unitId = validated.unitId || tenant.units[0]?.id;

    if (service.precio == null) {
      return NextResponse.json(
        { error: 'Servicio sin precio configurado' },
        { status: 400 }
      );
    }

    const precioBase = service.precio;
    const comision = (precioBase * (service.comisionPorcentaje || 0)) / 100;
    const precioTotal = precioBase + comision;

    // Crear booking
    const booking = await prisma.marketplaceBooking.create({
      data: {
        serviceId: service.id,
        tenantId,
        unitId,
        companyId: tenant.companyId,
        estado: 'pendiente',
        precioBase,
        comision,
        precioTotal,
        fechaServicio: new Date(validated.fechaSolicitada),
        notasCliente: validated.notas,
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: booking,
      message: '¡Solicitud enviada! El proveedor te contactará pronto.',
    });
  } catch (error: unknown) {
    logger.error('[Marketplace Booking POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando solicitud' },
      { status: 500 }
    );
  }
}
