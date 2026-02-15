/**
 * API: Student Housing Maintenance
 * GET /api/student-housing/maintenance - Lista solicitudes de mantenimiento
 * POST /api/student-housing/maintenance - Crear solicitud
 * PATCH /api/student-housing/maintenance - Actualizar estado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { StudentHousingService } from '@/lib/services/student-housing-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createMaintenanceSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().optional(),
  categoria: z.enum(['electricidad', 'fontaneria', 'climatizacion', 'mobiliario', 'limpieza', 'otro']),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  unitId: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      estado: searchParams.get('estado') || undefined,
      prioridad: searchParams.get('prioridad') || undefined,
    };

    const requests = await StudentHousingService.getMaintenanceRequests(session.user.companyId, filters);

    return NextResponse.json({
      success: true,
      data: requests
    });
  } catch (error: any) {
    logger.error('[Student Housing Maintenance GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo solicitudes', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createMaintenanceSchema.parse(body);

    const maintenance = await StudentHousingService.createMaintenanceRequest({
      ...validated,
      companyId: session.user.companyId,
      reporterId: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: maintenance,
      message: 'Solicitud de mantenimiento creada'
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Student Housing Maintenance POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando solicitud', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, estado, asignadoA } = z.object({
      id: z.string(),
      estado: z.string(),
      asignadoA: z.string().optional()
    }).parse(body);

    await StudentHousingService.updateMaintenanceStatus(id, estado, asignadoA);

    return NextResponse.json({
      success: true,
      message: 'Estado de solicitud actualizado'
    });
  } catch (error: any) {
    logger.error('[Student Housing Maintenance PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando solicitud', message: error.message },
      { status: 500 }
    );
  }
}
