/**
 * API para gestionar una llamada específica de Retell AI
 * 
 * GET /api/admin/calls/[id] - Obtener detalle de la llamada
 * PATCH /api/admin/calls/[id] - Actualizar llamada (añadir notas, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const call = await prisma.retellCall.findUnique({
      where: { id: params.id },
      include: {
        lead: {
          include: {
            actividades: {
              orderBy: { fecha: 'desc' },
              take: 5,
            },
            appointments: {
              orderBy: { fechaInicio: 'desc' },
              take: 3,
            },
          },
        },
        appointment: true,
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Llamada no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: call,
    });
  } catch (error: any) {
    console.error('[Admin Call GET Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo llamada' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const call = await prisma.retellCall.findUnique({
      where: { id: params.id },
    });

    if (!call) {
      return NextResponse.json({ error: 'Llamada no encontrada' }, { status: 404 });
    }

    // Campos actualizables
    const updateData: Record<string, unknown> = {};

    if (body.resumen !== undefined) updateData.resumen = body.resumen;
    if (body.sentimiento !== undefined) updateData.sentimiento = body.sentimiento;
    if (body.resultado !== undefined) updateData.resultado = body.resultado;
    if (body.leadId !== undefined) updateData.leadId = body.leadId;

    const updated = await prisma.retellCall.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('[Admin Call PATCH Error]:', error);
    return NextResponse.json({ error: 'Error actualizando llamada' }, { status: 500 });
  }
}
