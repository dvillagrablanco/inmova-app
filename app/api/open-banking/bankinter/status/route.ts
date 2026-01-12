import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { bankinterService, isBankinterConfigured } from '@/lib/bankinter-integration-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/bankinter/status?consentId=xxx
 * 
 * Obtiene el estado de un consentimiento de Bankinter
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!isBankinterConfigured()) {
      return NextResponse.json(
        {
          error: 'Integración con Bankinter no configurada'
        },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const consentId = searchParams.get('consentId');

    if (!consentId) {
      return NextResponse.json(
        { error: 'consentId requerido' },
        { status: 400 }
      );
    }

    // Verificar que el consentimiento pertenece a la compañía del usuario
    const connection = await prisma.bankConnection.findFirst({
      where: {
        consentId,
        companyId: session.user.companyId
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Consentimiento no encontrado o sin acceso' },
        { status: 404 }
      );
    }

    // Obtener estado del consentimiento
    const consentStatus = await bankinterService.getConsentStatus(consentId);

    // Actualizar en base de datos si es necesario
    if (consentStatus !== 'valid' && connection.estado === 'conectado') {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: {
          estado: 'desconectado',
          errorDetalle: `Consentimiento en estado: ${consentStatus}`
        }
      });
    }

    return NextResponse.json({
      success: true,
      consentId,
      status: consentStatus,
      validUntil: connection.consentValidUntil,
      connection: {
        id: connection.id,
        nombreBanco: connection.nombreBanco,
        estado: connection.estado,
        ultimaSync: connection.ultimaSync
      }
    });
  } catch (error: any) {
    logger.error('Error obteniendo estado del consentimiento:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener estado del consentimiento',
        details: error.message
      },
      { status: 500 }
    );
  }
}
