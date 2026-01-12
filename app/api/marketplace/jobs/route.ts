import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/marketplace/jobs - Obtener trabajos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const providerId = searchParams.get('providerId');

    const jobs = await prisma.serviceJob.findMany({
      where: {
        companyId: session?.user?.companyId,
        ...(estado && { estado: estado as any }),
        ...(providerId && { providerId }),
      },
      include: {
        provider: true,
        building: true,
        unit: true,
        quote: true,
        reviews: true,
      },
      orderBy: { fechaInicio: 'desc' },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Error al obtener trabajos' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/jobs - Crear trabajo
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      providerId,
      quoteId,
      buildingId,
      unitId,
      titulo,
      descripcion,
      fechaInicio,
      montoTotal,
      garantiaMeses,
      notasTrabajo,
    } = body;

    const job = await prisma.serviceJob.create({
      data: {
        companyId: session?.user?.companyId,
        providerId,
        quoteId: quoteId || null,
        buildingId: buildingId || null,
        unitId: unitId || null,
        titulo,
        descripcion,
        fechaInicio: new Date(fechaInicio),
        montoTotal: parseFloat(montoTotal),
        garantiaMeses: garantiaMeses || null,
        notasTrabajo: notasTrabajo || null,
      },
      include: {
        provider: true,
        building: true,
        unit: true,
        quote: true,
      },
    });

    // Si viene de una cotización, actualizar su estado
    if (quoteId) {
      await prisma.serviceQuote.update({
        where: { id: quoteId },
        data: { estado: 'aceptada' },
      });
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    logger.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Error al crear trabajo' },
      { status: 500 }
    );
  }
}
