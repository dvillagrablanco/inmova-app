import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';

function verifyToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as { tenantId: string };
  } catch (error) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = payload.tenantId;
    const data = await request.json();

    // Buscar la unidad del inquilino
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        units: true,
      },
    });

    if (!tenant || tenant.units.length === 0) {
      return NextResponse.json({ error: 'No se encontró unidad asociada' }, { status: 400 });
    }

    const unitId = tenant.units[0].id;

    // Crear solicitud de mantenimiento
    const maintenanceRequest = await db.maintenanceRequest.create({
      data: {
        unitId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        prioridad: data.prioridad || 'media',
        estado: 'pendiente',
      },
    });

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    logger.error('Error al crear solicitud de mantenimiento:', error);
    return NextResponse.json({ error: 'Error al crear solicitud' }, { status: 500 });
  }
}
