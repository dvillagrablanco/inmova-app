import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { checkIntelligentAlerts } from '@/lib/bi-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/bi/alerts - Obtener alertas
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activa = searchParams.get('activa');

    const alerts = await prisma.biAlert.findMany({
      where: {
        companyId: session?.user?.companyId,
        ...(activa && { activa: activa === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}

// POST /api/bi/alerts - Crear alerta
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Si es una petición para verificar alertas automáticas
    if (body.action === 'check') {
      const triggeredAlerts = await checkIntelligentAlerts(session?.user?.companyId);
      return NextResponse.json(triggeredAlerts);
    }

    // Crear alerta manual
    const {
      nombre,
      descripcion,
      metrica,
      condicion,
      umbral,
      severidad,
      emailNotificar,
      destinatarios,
    } = body;

    const alert = await prisma.biAlert.create({
      data: {
        companyId: session?.user?.companyId,
        nombre,
        descripcion,
        metrica,
        condicion,
        umbral: parseFloat(umbral),
        severidad: severidad || 'warning',
        emailNotificar: emailNotificar !== false,
        destinatarios: destinatarios || [],
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    logger.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Error al crear alerta' },
      { status: 500 }
    );
  }
}
