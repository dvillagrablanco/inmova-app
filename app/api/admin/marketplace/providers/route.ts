import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const providerSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  categoria: z.string().min(1),
  descripcion: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const providers = await prisma.provider.findMany({
      where: { companyId },
      include: {
        marketplaceServices: {
          select: { id: true, activo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const providerIds = providers.map((provider) => provider.id);

    const [reviews, services, bookings] = await Promise.all([
      prisma.providerReview.groupBy({
        by: ['providerId'],
        where: { companyId, providerId: { in: providerIds } },
        _avg: { puntuacion: true },
        _count: { _all: true },
      }),
      prisma.marketplaceService.findMany({
        where: { companyId, providerId: { in: providerIds } },
        select: { providerId: true, activo: true },
      }),
      prisma.marketplaceBooking.findMany({
        where: { companyId, service: { providerId: { in: providerIds } } },
        select: {
          estado: true,
          precioTotal: true,
          comision: true,
          service: { select: { providerId: true } },
        },
      }),
    ]);

    const reviewMap = new Map(
      reviews.map((review) => [
        review.providerId,
        { rating: review._avg.puntuacion || 0, totalReviews: review._count._all },
      ])
    );

    const serviceCountMap = new Map<string, { total: number; active: number }>();
    services.forEach((service) => {
      if (!service.providerId) return;
      const current = serviceCountMap.get(service.providerId) || { total: 0, active: 0 };
      current.total += 1;
      if (service.activo) current.active += 1;
      serviceCountMap.set(service.providerId, current);
    });

    const bookingMap = new Map<string, { completed: number; ingresos: number }>();
    bookings.forEach((booking) => {
      const providerId = booking.service.providerId;
      if (!providerId) return;
      const current = bookingMap.get(providerId) || { completed: 0, ingresos: 0 };
      if (booking.estado === 'completada') {
        current.completed += 1;
        current.ingresos += booking.precioTotal || 0;
      }
      bookingMap.set(providerId, current);
    });

    const formattedProviders = providers.map((provider) => {
      const review = reviewMap.get(provider.id) || { rating: provider.rating || 0, totalReviews: 0 };
      const servicesCount = serviceCountMap.get(provider.id) || { total: 0, active: 0 };
      const bookingsInfo = bookingMap.get(provider.id) || { completed: 0, ingresos: 0 };

      return {
        id: provider.id,
        nombre: provider.nombre,
        email: provider.email || '',
        telefono: provider.telefono,
        tipo: provider.tipo,
        estado: provider.estado,
        verificado: review.totalReviews > 0,
        rating: review.rating,
        totalReviews: review.totalReviews,
        serviciosActivos: servicesCount.active,
        reservasCompletadas: bookingsInfo.completed,
        ingresosTotales: bookingsInfo.ingresos,
        fechaRegistro: provider.createdAt.toISOString(),
        website: provider.website || null,
        direccion: provider.direccion || null,
        descripcion: provider.descripcion || null,
      };
    });

    return NextResponse.json({
      success: true,
      providers: formattedProviders,
    });
  } catch (error) {
    logger.error('[API Error] Marketplace providers:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = providerSchema.parse(body);

    const newProvider = await prisma.provider.create({
      data: {
        companyId: session.user.companyId,
        nombre: validated.nombre,
        email: validated.email,
        telefono: validated.telefono || '',
        tipo: validated.categoria,
        website: validated.website || null,
        descripcion: validated.descripcion || null,
        estado: 'pending',
        activo: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newProvider.id,
        nombre: newProvider.nombre,
        email: newProvider.email || '',
        telefono: newProvider.telefono,
        tipo: newProvider.tipo,
        estado: newProvider.estado,
        rating: newProvider.rating || 0,
        totalReviews: 0,
        serviciosActivos: 0,
        reservasCompletadas: 0,
        ingresosTotales: 0,
        fechaRegistro: newProvider.createdAt.toISOString(),
        website: newProvider.website || null,
        direccion: newProvider.direccion || null,
        descripcion: newProvider.descripcion || null,
      },
      message: 'Proveedor creado correctamente. Pendiente de aprobación.',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[API Error] Create marketplace provider:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
