import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory storage for demo
let gardenPlots: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const plots = gardenPlots.filter((p) => p.companyId === companyId);

    return NextResponse.json(plots);
  } catch (error) {
    logger.error('[Gardens API] Error fetching plots:', error);
    return NextResponse.json({ error: 'Error al obtener parcelas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    if (!body.gardenId || !body.numero || !body.superficie) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const newPlot = {
      id: `plot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId,
      gardenId: body.gardenId,
      gardenName: body.gardenName || 'Huerto',
      numero: body.numero,
      superficie: parseFloat(body.superficie),
      cultivos: body.cultivos || [],
      inquilino: null,
      inquilinoId: null,
      fechaInicio: null,
      fechaFin: null,
      estado: 'DISPONIBLE',
      ultimoRiego: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    gardenPlots.push(newPlot);

    return NextResponse.json(newPlot, { status: 201 });
  } catch (error) {
    logger.error('[Gardens API] Error creating plot:', error);
    return NextResponse.json({ error: 'Error al crear parcela' }, { status: 500 });
  }
}
