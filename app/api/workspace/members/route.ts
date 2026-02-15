/**
 * API: Workspace Members
 * GET /api/workspace/members - Lista miembros
 * POST /api/workspace/members - Crear miembro
 * PATCH /api/workspace/members - Actualizar estado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createMemberSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().optional(),
  empresa: z.string().optional(),
  cargo: z.string().optional(),
  plan: z.enum(['hot_desk', 'dedicated', 'private_office', 'enterprise']).optional(),
  creditosDisponibles: z.number().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      plan: searchParams.get('plan') || undefined,
      estado: searchParams.get('estado') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const members = await WorkspaceService.getMembers(session.user.companyId, filters);

    return NextResponse.json({
      success: true,
      data: members
    });
  } catch (error: any) {
    logger.error('[Workspace Members GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo miembros', message: error.message },
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
    const validated = createMemberSchema.parse(body);

    const member = await WorkspaceService.createMember({
      ...validated,
      companyId: session.user.companyId
    });

    return NextResponse.json({
      success: true,
      data: member,
      message: 'Miembro creado correctamente'
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Workspace Members POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando miembro', message: error.message },
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

    await WorkspaceService.updateMemberStatus(id, estado);

    return NextResponse.json({
      success: true,
      message: 'Estado de miembro actualizado'
    });
  } catch (error: any) {
    logger.error('[Workspace Members PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando miembro', message: error.message },
      { status: 500 }
    );
  }
}
