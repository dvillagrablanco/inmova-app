/**
 * API: Workspace Spaces
 * GET /api/workspace/spaces - Lista espacios
 * POST /api/workspace/spaces - Crear espacio
 * PATCH /api/workspace/spaces - Actualizar estado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSpaceSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['hot_desk', 'dedicated_desk', 'private_office', 'meeting_room']),
  capacidad: z.number().optional(),
  precio: z.number().optional(),
  precioUnidad: z.enum(['hora', 'dia', 'mes']).optional(),
  amenities: z.array(z.string()).optional(),
  superficie: z.number().optional(),
  descripcion: z.string().optional(),
  buildingId: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      tipo: searchParams.get('tipo') || undefined,
      estado: searchParams.get('estado') || undefined,
    };

    const spaces = await WorkspaceService.getSpaces(session.user.companyId, filters);

    return NextResponse.json({
      success: true,
      data: spaces
    });
  } catch (error: any) {
    console.error('[Workspace Spaces GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo espacios', message: error.message },
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
    const validated = createSpaceSchema.parse(body);

    const space = await WorkspaceService.createSpace({
      ...validated,
      companyId: session.user.companyId
    });

    return NextResponse.json({
      success: true,
      data: space,
      message: 'Espacio creado correctamente'
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[Workspace Spaces POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando espacio', message: error.message },
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

    await WorkspaceService.updateSpaceStatus(id, estado);

    return NextResponse.json({
      success: true,
      message: 'Estado actualizado'
    });
  } catch (error: any) {
    console.error('[Workspace Spaces PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando espacio', message: error.message },
      { status: 500 }
    );
  }
}
