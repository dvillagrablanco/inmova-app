/**
 * API Endpoint: Iniciar Autorización OAuth con Redsys PSD2
 *
 * Este endpoint inicia el flujo de autorización OAuth 2.0 con un banco específico
 * a través de la plataforma Redsys PSD2.
 *
 * Método: POST
 * Body: { aspsp: string, scope: string }
 *
 * @author INMOVA Development Team
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

import {
  buildAuthorizationUrl,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  SPANISH_BANKS,
  BANK_NAMES,
  type OAuthAuthorizationParams,
} from '@/lib/redsys-psd2-service';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth-options';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Almacenamiento temporal para code_verifier y state
// En producción, esto debería estar en Redis o base de datos
const pkceStorage = new Map<string, { verifier: string; state: string; userId: string }>();

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { aspsp, scope = 'AIS' } = body;

    if (!aspsp) {
      return NextResponse.json(
        { error: 'Parámetro "aspsp" (banco) es requerido' },
        { status: 400 }
      );
    }

    // Validar que el banco sea soportado
    const supportedBanks = Object.values(SPANISH_BANKS);
    if (!supportedBanks.includes(aspsp)) {
      return NextResponse.json(
        {
          error: 'Banco no soportado',
          supportedBanks: Object.entries(BANK_NAMES).map(([id, name]) => ({ id, name })),
        },
        { status: 400 }
      );
    }

    // Generar PKCE y state
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Guardar code_verifier y state para usar en el callback
    pkceStorage.set(state, {
      verifier: codeVerifier,
      state,
      userId: session.user.id,
    });

    // Construir URL de autorización
    const authParams: OAuthAuthorizationParams = {
      aspsp,
      scope: scope as any,
      state,
      codeChallenge,
      codeChallengeMethod: 'S256',
    };

    const authorizationUrl = buildAuthorizationUrl(authParams);

    return NextResponse.json({
      success: true,
      authorizationUrl,
      bank: BANK_NAMES[aspsp] || aspsp,
      scope,
    });
  } catch (error: any) {
    logger.error('Error en authorize:', error);
    return NextResponse.json(
      { error: error.message || 'Error al iniciar autorización' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Listar bancos disponibles
  const banks = Object.entries(BANK_NAMES).map(([id, name]) => ({
    id,
    name,
  }));

  return NextResponse.json({
    success: true,
    banks,
    scopes: ['AIS', 'PIS', 'FCS', 'AIS PIS', 'AIS FCS', 'PIS FCS', 'AIS PIS FCS'],
  });
}

// Exportar el storage para usarlo en el callback
export { pkceStorage };
