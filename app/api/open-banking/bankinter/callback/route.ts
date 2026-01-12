import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { bankinterService } from '@/lib/bankinter-integration-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/bankinter/callback
 * 
 * Callback después de la autenticación con Bankinter
 * El usuario es redirigido aquí después de autenticarse con Bankinter Móvil
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const consentId = searchParams.get('consentId');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Si hubo un error en la autenticación
    if (error) {
      logger.error(`Error en callback de Bankinter: ${error}`);
      return NextResponse.redirect(
        new URL('/open-banking?error=' + encodeURIComponent(error), request.url)
      );
    }

    if (!consentId) {
      return NextResponse.json(
        { error: 'consentId requerido' },
        { status: 400 }
      );
    }

    // Buscar la conexión con este consentId
    const connection = await prisma.bankConnection.findFirst({
      where: { consentId }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar el estado del consentimiento
    try {
      const consentStatus = await bankinterService.getConsentStatus(consentId);

      if (consentStatus === 'valid') {
        // Actualizar estado de la conexión
        await prisma.bankConnection.update({
          where: { id: connection.id },
          data: {
            estado: 'conectado'
          }
        });

        logger.info(`✅ Conexión Bankinter autorizada: ${consentId}`);

        // Redirigir al dashboard con éxito
        return NextResponse.redirect(
          new URL('/open-banking?success=true', request.url)
        );
      } else {
        // Consentimiento no válido
        await prisma.bankConnection.update({
          where: { id: connection.id },
          data: {
            estado: 'error',
            errorDetalle: `Consentimiento en estado: ${consentStatus}`
          }
        });

        return NextResponse.redirect(
          new URL('/open-banking?error=consent_invalid', request.url)
        );
      }
    } catch (error: any) {
      logger.error('Error verificando consentimiento:', error);
      return NextResponse.redirect(
        new URL('/open-banking?error=verification_failed', request.url)
      );
    }
  } catch (error: any) {
    logger.error('Error en callback de Bankinter:', error);
    return NextResponse.redirect(
      new URL('/open-banking?error=callback_error', request.url)
    );
  }
}
