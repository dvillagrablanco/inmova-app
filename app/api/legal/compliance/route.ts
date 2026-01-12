import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');

    const where: any = {
      companyId: user.companyId,
    };

    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const alerts = await prisma.complianceAlert.findMany({
      where,
      orderBy: [
        { completada: 'asc' },
        { fechaLimite: 'asc' },
      ],
    });

    return NextResponse.json(alerts);
  } catch (error) {
    logger.error('Error fetching compliance alerts:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas de cumplimiento' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();

    const alert = await prisma.complianceAlert.create({
      data: {
        companyId: user.companyId,
        tipo: body.tipo,
        titulo: body.titulo,
        descripcion: body.descripcion,
        fechaLimite: new Date(body.fechaLimite),
        estado: body.estado || 'pendiente',
        prioridad: body.prioridad || 'media',
        entityId: body.entityId,
        entityType: body.entityType,
        accionRequerida: body.accionRequerida,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    logger.error('Error creating compliance alert:', error);
    return NextResponse.json(
      { error: 'Error al crear alerta de cumplimiento' },
      { status: 500 }
    );
  }
}
