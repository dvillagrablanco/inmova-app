/**
 * API Endpoint: Obtener Transacciones Bancarias via Redsys PSD2
 * 
 * Este endpoint obtiene las transacciones de una cuenta bancaria específica
 * a través de la API de Redsys PSD2.
 * 
 * Método: GET
 * Query params: aspsp, connectionId, accountId, dateFrom, dateTo
 * 
 * @author INMOVA Development Team
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

import { getTransactions } from '@/lib/redsys-psd2-service';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth-options';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const aspsp = searchParams.get('aspsp');
    const connectionId = searchParams.get('connectionId');
    const accountId = searchParams.get('accountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!aspsp || !connectionId || !accountId) {
      return NextResponse.json(
        { error: 'Parámetros aspsp, connectionId y accountId son requeridos' },
        { status: 400 }
      );
    }

    // Obtener la conexión bancaria y el consentimiento activo
    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
        status: 'active',
      },
      include: {
        consents: {
          where: {
            status: 'valid',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexión bancaria no encontrada o inactiva' },
        { status: 404 }
      );
    }

    if (!connection.consents || connection.consents.length === 0) {
      return NextResponse.json(
        { error: 'No hay consentimiento válido' },
        { status: 400 }
      );
    }

    const consent = connection.consents[0];

    // Obtener transacciones
    const transactions = await getTransactions(
      aspsp,
      accountId,
      consent.consentId,
      connection.accessToken,
      dateFrom || undefined,
      dateTo || undefined
    );

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error: any) {
    logger.error('Error obteniendo transacciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener transacciones' },
      { status: 500 }
    );
  }
}
