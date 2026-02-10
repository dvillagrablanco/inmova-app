import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
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
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const providers = await prisma.provider.findMany({
      include: {
        marketplaceServices: {
          select: { id: true, categoria: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const services = await prisma.marketplaceService.findMany({
      select: { id: true, providerId: true },
    });

    const bookingCounts = await prisma.marketplaceBooking.groupBy({
      by: ['serviceId'],
      _count: { _all: true },
    });

    const bookingsByService = new Map(
      bookingCounts.map((count) => [count.serviceId, count._count._all])
    );

    const providerServiceStats = new Map<
      string,
      { serviciosCount: number; transaccionesTotal: number; categorias: Set<string> }
    >();

    services.forEach((service) => {
      if (!service.providerId) return;
      const stats = providerServiceStats.get(service.providerId) || {
        serviciosCount: 0,
        transaccionesTotal: 0,
        categorias: new Set<string>(),
      };
      stats.serviciosCount += 1;
      stats.transaccionesTotal += bookingsByService.get(service.id) || 0;
      providerServiceStats.set(service.providerId, stats);
    });

    const formatted = providers.map((provider) => {
      const stats = providerServiceStats.get(provider.id);
      const categorias = provider.marketplaceServices.map((service) => service.categoria);
      const categoria = categorias[0] || provider.tipo || 'General';
      const estado = !provider.activo
        ? 'suspended'
        : stats && stats.serviciosCount > 0
          ? 'active'
          : 'pending';

      return {
        id: provider.id,
        nombre: provider.nombre,
        email: provider.email || '',
        telefono: provider.telefono,
        website: null,
        direccion: provider.direccion || null,
        descripcion: provider.notas || null,
        categoria,
        serviciosCount: stats?.serviciosCount || 0,
        rating: provider.rating || 0,
        transaccionesTotal: stats?.transaccionesTotal || 0,
        estado,
        createdAt: provider.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      providers: formatted,
    });
  } catch (error: unknown) {
    logger.error('[API Error] Marketplace providers:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const validated = providerSchema.parse(body);

    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
    }

    const provider = await prisma.provider.create({
      data: {
        companyId,
        nombre: validated.nombre,
        email: validated.email,
        telefono: validated.telefono || '',
        tipo: validated.categoria,
        notas: validated.descripcion || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: provider.id,
        nombre: provider.nombre,
        email: provider.email || '',
        telefono: provider.telefono,
        website: null,
        direccion: provider.direccion || null,
        descripcion: provider.notas || null,
        categoria: provider.tipo,
        serviciosCount: 0,
        rating: provider.rating || 0,
        transaccionesTotal: 0,
        estado: provider.activo ? 'active' : 'suspended',
        createdAt: provider.createdAt.toISOString(),
      },
      message: 'Proveedor creado correctamente. Pendiente de aprobación.',
    }, { status: 201 });
  } catch (error: unknown) {
    logger.error('[API Error] Create marketplace provider:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
