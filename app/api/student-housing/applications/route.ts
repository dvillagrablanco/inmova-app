/**
 * API: Student Housing Applications
 * GET /api/student-housing/applications - Lista aplicaciones
 * POST /api/student-housing/applications - Crear aplicación
 * PATCH /api/student-housing/applications - Actualizar estado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { StudentHousingService } from '@/lib/services/student-housing-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createApplicationSchema = z.object({
  solicitanteNombre: z.string().min(1),
  solicitanteEmail: z.string().email(),
  solicitanteTelefono: z.string().optional(),
  universidad: z.string().optional(),
  carrera: z.string().optional(),
  curso: z.number().optional(),
  tipoHabitacion: z.string().optional(),
  fechaDeseada: z.string().optional(),
  notas: z.string().optional()
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
      estado: searchParams.get('estado') || undefined,
    };

    const applications = await StudentHousingService.getApplications(session.user.companyId, filters);

    return NextResponse.json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    console.error('[Student Housing Applications GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo aplicaciones', message: error.message },
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
    const validated = createApplicationSchema.parse(body);

    const application = await StudentHousingService.createApplication({
      ...validated,
      companyId: session.user.companyId
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Aplicación creada correctamente'
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[Student Housing Applications POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando aplicación', message: error.message },
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
    const { id, estado } = z.object({
      id: z.string(),
      estado: z.string()
    }).parse(body);

    await StudentHousingService.updateApplicationStatus(id, estado);

    return NextResponse.json({
      success: true,
      message: 'Estado de aplicación actualizado'
    });
  } catch (error: any) {
    console.error('[Student Housing Applications PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando aplicación', message: error.message },
      { status: 500 }
    );
  }
}
