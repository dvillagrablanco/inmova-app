/**
 * API de Documentos para Portal del Inquilino
 * Retorna solo los documentos asociados al inquilino autenticado
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar el inquilino por email
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Obtener todos los documentos asociados al inquilino
    const documents = await prisma.document.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: { fechaSubida: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    logger.error('Error obteniendo documentos:', error);
    return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 });
  }
}
