/**
 * API Route: Error Detail
 * 
 * Endpoints para gestionar un error específico.
 * 
 * GET /api/errors/[id] - Obtener detalle de un error
 * PATCH /api/errors/[id] - Actualizar estado de un error
 * POST /api/errors/[id]/suggest - Obtener sugerencia de IA para corrección
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { updateErrorStatus, ErrorStatus } from '@/lib/error-tracker';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Roles permitidos
const ALLOWED_ROLES = ['super_admin', 'administrador'];

// GET - Obtener detalle de error
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    const error = await prisma.errorLog.findUnique({
      where: { id: params.id },
    });
    
    if (!error) {
      return NextResponse.json({ error: 'Error no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: error });
  } catch (error: any) {
    console.error('[API Error Detail] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch error' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de error
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    const body = await request.json();
    const { status, resolution } = body;
    
    if (!status || !['new', 'investigating', 'resolved', 'ignored'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }
    
    const success = await updateErrorStatus(
      params.id,
      status as ErrorStatus,
      resolution,
      session.user.email || session.user.id
    );
    
    if (!success) {
      return NextResponse.json(
        { error: 'No se pudo actualizar el error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Error actualizado' });
  } catch (error: any) {
    console.error('[API Error Update] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update error' },
      { status: 500 }
    );
  }
}
