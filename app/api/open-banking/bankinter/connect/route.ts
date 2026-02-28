import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBankinterService, isBankinterConfigured } from '@/lib/bankinter-integration-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/bankinter/connect
 * 
 * Inicia la conexión con Bankinter mediante Open Banking PSD2
 * Retorna una URL de autenticación a la que redirigir al usuario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!isBankinterConfigured()) {
      return NextResponse.json(
        {
          error: 'Integración con Bankinter no configurada',
          message: 'Contacte con el administrador para configurar las credenciales de Bankinter/Redsys'
        },
        { status: 503 }
      );
    }

    // Obtener IP del usuario
    const forwarded = request.headers.get('x-forwarded-for');
    const psuIpAddress = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    const bankinterService = getBankinterService();
    // Iniciar conexión
    const result = await bankinterService.conectarCuentaBankinter(
      session.user.companyId,
      session.user.id,
      psuIpAddress
    );

    logger.info(`🏦 Conexión Bankinter iniciada para company ${session.user.companyId}`);

    return NextResponse.json({
      success: true,
      consentId: result.consentId,
      authUrl: result.authUrl,
      message: 'Redirigir al usuario a authUrl para autenticar con Bankinter Móvil'
    });
  } catch (error: any) {
    logger.error('Error conectando con Bankinter:', error);
    return NextResponse.json(
      {
        error: 'Error al iniciar conexión con Bankinter',
        details: error.message
      },
      { status: 500 }
    );
  }
}
