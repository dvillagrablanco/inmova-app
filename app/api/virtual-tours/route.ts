export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Gestión de Tours Virtuales de Propiedades (360°, VR, AR)
 * GET: Obtener tours virtuales
 * POST: Crear nuevo tour virtual
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

// Schema de validación para crear tour
const createTourSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(['360', 'video', 'ar', 'vr']),
  unitId: z.string().optional(),
  buildingId: z.string().optional(),
  urlPrincipal: z.string().url('URL debe ser válida'),
  urlThumbnail: z.string().url().optional(),
  embedCode: z.string().optional(),
  escenas: z.array(z.any()).optional(),
  hotspots: z.array(z.any()).optional(),
  plataforma: z.string().optional(),
  publico: z.boolean().default(false),
});

// GET: Obtener tours virtuales
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');
    const unitId = searchParams.get('unitId');
    const buildingId = searchParams.get('buildingId');

    // Construir filtros
    const where: any = {
      companyId: session.user.companyId,
    };

    if (tipo && tipo !== 'all') {
      where.tipo = tipo;
    }

    if (estado) {
      where.estado = estado;
    }

    if (unitId) {
      where.unitId = unitId;
    }

    if (buildingId) {
      where.buildingId = buildingId;
    }

    // Obtener tours
    const tours = await prisma.virtualTour.findMany({
      where,
      include: {
        unit: {
          select: {
            id: true,
            numero: true,
            buildingId: true,
          },
        },
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular analytics generales
    const totalViews = tours.reduce((sum, t) => sum + t.vistas, 0);
    const avgDuration =
      tours.length > 0
        ? tours.reduce((sum, t) => sum + (t.tiempoPromedio || 0), 0) /
          tours.filter((t) => t.tiempoPromedio).length
        : 0;

    // Transformar datos al formato esperado por el frontend
    const formattedTours = tours.map((tour) => ({
      id: tour.id,
      propertyId: tour.unitId || tour.buildingId || '',
      propertyName: tour.unit?.numero
        ? `Unidad ${tour.unit.numero}`
        : tour.building?.nombre || tour.titulo,
      type: tour.tipo as '360' | 'video' | 'ar' | 'vr',
      status: tour.estado as 'draft' | 'published' | 'archived',
      createdAt: tour.createdAt.toISOString().split('T')[0],
      views: tour.vistas,
      avgDuration: tour.tiempoPromedio || 0,
      conversionRate:
        tour.vistas > 0 ? Math.round((tour.compartido / tour.vistas) * 100 * 10) / 10 : 0,
      thumbnail: tour.urlThumbnail || '/images/tours/default.jpg',
      url: tour.urlPrincipal,
      features: tour.escenas ? [`${(tour.escenas as any[]).length} Escenas`] : [],
      titulo: tour.titulo,
      descripcion: tour.descripcion,
    }));

    // Analytics resumen
    const analytics = {
      totalViews,
      avgEngagement: tours.length > 0 ? Math.round((avgDuration / 60) * 100) / 100 : 0,
      totalConversions: tours.reduce((sum, t) => sum + t.compartido, 0),
      avgConversionRate:
        tours.length > 0
          ? Math.round(
              (tours.reduce(
                (sum, t) => sum + (t.vistas > 0 ? (t.compartido / t.vistas) * 100 : 0),
                0
              ) /
                tours.length) *
                10
            ) / 10
          : 0,
      viewsBySource: [
        { source: 'Portal Inmobiliario', views: Math.round(totalViews * 0.45) },
        { source: 'Web Propia', views: Math.round(totalViews * 0.25) },
        { source: 'Redes Sociales', views: Math.round(totalViews * 0.2) },
        { source: 'Email Marketing', views: Math.round(totalViews * 0.1) },
      ],
      viewsOverTime: generateViewsTimeline(tours),
      topProperties: formattedTours
        .filter((t) => t.status === 'published')
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
        .map((t) => ({
          name: t.propertyName,
          views: t.views,
          conversions: Math.round((t.views * t.conversionRate) / 100),
        })),
    };

    return NextResponse.json({
      tours: formattedTours,
      analytics,
      total: tours.length,
    });
  } catch (error) {
    logger.error('Error fetching virtual tours:', error);
    return NextResponse.json({ error: 'Error al obtener tours virtuales' }, { status: 500 });
  }
}

// POST: Crear nuevo tour virtual
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTourSchema.parse(body);

    const tour = await prisma.virtualTour.create({
      data: {
        companyId: session.user.companyId,
        titulo: validatedData.titulo,
        descripcion: validatedData.descripcion,
        tipo: validatedData.tipo,
        unitId: validatedData.unitId || null,
        buildingId: validatedData.buildingId || null,
        urlPrincipal: validatedData.urlPrincipal,
        urlThumbnail: validatedData.urlThumbnail,
        embedCode: validatedData.embedCode,
        escenas: validatedData.escenas || [],
        hotspots: validatedData.hotspots || [],
        plataforma: validatedData.plataforma,
        publico: validatedData.publico,
        estado: 'borrador',
        creadoPor: session.user.id,
      },
      include: {
        unit: {
          select: { id: true, numero: true },
        },
        building: {
          select: { id: true, nombre: true },
        },
      },
    });

    logger.info('Tour virtual creado:', { tourId: tour.id, userId: session.user.id });

    return NextResponse.json(tour, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error creating virtual tour:', error);
    return NextResponse.json({ error: 'Error al crear tour virtual' }, { status: 500 });
  }
}

// Helper: Generar timeline de vistas
function generateViewsTimeline(tours: any[]) {
  const now = new Date();
  const timeline = [];

  for (let i = 7; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

    // Simular distribución basada en tours existentes
    const baseViews = tours.reduce((sum, t) => sum + t.vistas, 0) / 8;
    const variance = Math.random() * 0.4 - 0.2; // ±20%

    timeline.push({
      date: dateStr,
      views: Math.round(baseViews * (1 + variance)),
    });
  }

  return timeline;
}
