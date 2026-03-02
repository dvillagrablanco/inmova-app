export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSuggestions } from '@/lib/smart-suggestions-service';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/smart-suggestions
 * Lista sugerencias para la empresa del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area') || undefined;
    const prioridad = searchParams.get('prioridad') || undefined;
    const estado = searchParams.get('estado') || 'pendiente';
    const limit = parseInt(searchParams.get('limit') || '20');

    const suggestions = await getSuggestions(session.user.companyId, {
      area,
      prioridad,
      estado,
      limit,
    });

    return NextResponse.json({ suggestions, total: suggestions.length });
  } catch (error: unknown) {
    console.error('[Smart Suggestions API]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * PUT /api/smart-suggestions
 * Actualizar estado de una sugerencia
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id, estado, notas } = await request.json();
    if (!id || !estado) {
      return NextResponse.json({ error: 'id y estado requeridos' }, { status: 400 });
    }

    const prisma = await getPrisma();

    const suggestion = await prisma.smartSuggestion.update({
      where: { id },
      data: {
        estado,
        resueltoPor: session.user.id,
        fechaResolucion: ['completada', 'descartada'].includes(estado) ? new Date() : undefined,
        notasResolucion: notas || undefined,
      },
    });

    return NextResponse.json({ success: true, suggestion });
  } catch (error: unknown) {
    console.error('[Smart Suggestions PUT]:', error);
    return NextResponse.json({ error: 'Error actualizando' }, { status: 500 });
  }
}
