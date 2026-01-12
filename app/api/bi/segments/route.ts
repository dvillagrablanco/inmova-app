import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { segmentTenantsByBehavior } from '@/lib/bi-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/bi/segments - Obtener segmentos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const segments = await prisma.tenantSegment.findMany({
      where: {
        companyId: session?.user?.companyId,
        activo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(segments);
  } catch (error) {
    logger.error('Error fetching segments:', error);
    return NextResponse.json(
      { error: 'Error al obtener segmentos' },
      { status: 500 }
    );
  }
}

// POST /api/bi/segments - Crear/Actualizar segmento
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Si es una petición para generar segmentos automáticos
    if (body.action === 'generate') {
      const behaviorSegments = await segmentTenantsByBehavior(
        session?.user?.companyId
      );

      // Crear o actualizar segmentos
      const segments: any[] = [];
      for (const [segmentName, tenants] of Object.entries(behaviorSegments)) {
        const tenantIds = (tenants as any[]).map(t => t.id);
        const avgMetrics = {
          onTimeRate:
            (tenants as any[]).reduce((sum, t) => sum + t.onTimeRate, 0) /
            (tenants as any[]).length || 0,
          lateRate:
            (tenants as any[]).reduce((sum, t) => sum + t.lateRate, 0) /
            (tenants as any[]).length || 0,
        };

        const segment = await prisma.tenantSegment.upsert({
          where: {
            id: `${session?.user?.companyId}-${segmentName}`,
          },
          create: {
            id: `${session?.user?.companyId}-${segmentName}`,
            companyId: session?.user?.companyId,
            nombre: segmentName.charAt(0).toUpperCase() + segmentName.slice(1),
            descripcion: `Inquilinos con comportamiento ${segmentName}`,
            criterios: { type: 'behavior', segment: segmentName },
            tenantIds,
            metricasPromedio: avgMetrics,
            totalInquilinos: tenantIds.length,
          },
          update: {
            tenantIds,
            metricasPromedio: avgMetrics,
            totalInquilinos: tenantIds.length,
            ultimaActualizacion: new Date(),
          },
        });

        segments.push(segment);
      }

      return NextResponse.json(segments);
    }

    // Crear segmento manual
    const { nombre, descripcion, criterios, tenantIds } = body;

    const segment = await prisma.tenantSegment.create({
      data: {
        companyId: session?.user?.companyId,
        nombre,
        descripcion: descripcion || null,
        criterios,
        tenantIds: tenantIds || [],
        totalInquilinos: (tenantIds || []).length,
      },
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    logger.error('Error creating segment:', error);
    return NextResponse.json(
      { error: 'Error al crear segmento' },
      { status: 500 }
    );
  }
}
