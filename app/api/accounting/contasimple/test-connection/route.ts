import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getContaSimpleService,
  isContaSimpleConfigured,
} from '@/lib/contasimple-integration-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounting/contasimple/test-connection
 * Prueba la conexión con ContaSimple y obtiene un token de acceso
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que esté configurado
    if (!isContaSimpleConfigured()) {
      return NextResponse.json(
        {
          error: 'ContaSimple no está configurado',
          message:
            'Por favor configura las variables de entorno CONTASIMPLE_AUTH_KEY y CONTASIMPLE_API_URL',
        },
        { status: 400 }
      );
    }

    // Intentar autenticarse
    const contaSimpleService = getContaSimpleService();
    const tokens = await contaSimpleService.authenticate();

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con ContaSimple',
      data: {
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        authenticated: true,
      },
    });
  } catch (error: any) {
    logger.error('Error al probar conexión con ContaSimple:', error);
    return NextResponse.json(
      {
        error: 'Error al conectar con ContaSimple',
        message: error.message || 'Error desconocido',
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}
