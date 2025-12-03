import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/bi/reports - Obtener reportes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activo = searchParams.get('activo');

    const reports = await prisma.biReport.findMany({
      where: {
        companyId: session.user.companyId,
        ...(activo && { activo: activo === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    logger.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}

// POST /api/bi/reports - Crear reporte
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      nombre,
      descripcion,
      tipo,
      frecuencia,
      filtros,
      columnas,
      emailDestinatarios,
    } = body;

    const report = await prisma.biReport.create({
      data: {
        companyId: session.user.companyId,
        nombre,
        descripcion: descripcion || null,
        tipo,
        frecuencia,
        filtros,
        columnas,
        emailDestinatarios: emailDestinatarios || [],
        creadoPor: session.user.email || '',
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    logger.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Error al crear reporte' },
      { status: 500 }
    );
  }
}
