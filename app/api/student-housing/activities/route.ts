/**
 * API: Student Housing Activities
 * GET /api/student-housing/activities - Lista actividades
 * POST /api/student-housing/activities - Crear actividad
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { StudentHousingService } from '@/lib/services/student-housing-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createActivitySchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().optional(),
  categoria: z.enum(['social', 'academico', 'deportivo', 'cultural', 'otro']),
  fecha: z.string(),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  ubicacion: z.string().optional(),
  capacidad: z.number().optional(),
  organizador: z.string().optional(),
  precio: z.number().optional(),
  requiereInscripcion: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    const { searchParams } = new URL(request.url);
    const filters = {
      categoria: searchParams.get('categoria') || undefined,
      estado: searchParams.get('estado') || undefined,
    };

    const activities = await StudentHousingService.getActivities(session.user.companyId, filters);

    return NextResponse.json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    console.error('[Student Housing Activities GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo actividades', message: error.message },
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
    const validated = createActivitySchema.parse(body);

    const activity = await StudentHousingService.createActivity({
      ...validated,
      companyId: session.user.companyId
    });

    return NextResponse.json({
      success: true,
      data: activity,
      message: 'Actividad creada correctamente'
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[Student Housing Activities POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando actividad', message: error.message },
      { status: 500 }
    );
  }
}
