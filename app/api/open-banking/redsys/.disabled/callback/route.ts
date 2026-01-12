/**
 * API Endpoint: Callback OAuth de Redsys PSD2
 * 
 * Este endpoint maneja el callback después de que el usuario autoriza
 * el acceso en su banco a través de Redsys PSD2.
 * 
 * Método: GET
 * Query params: code, state
 * 
 * @author INMOVA Development Team
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { exchangeCodeForToken } from '@/lib/redsys-psd2-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Importar el storage de PKCE del endpoint authorize
import { pkceStorage } from '../authorize/route';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Verificar si hubo un error en la autorización
    if (error) {
      logger.error('Error en autorización OAuth:', error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/open-banking?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || 'Error desconocido')}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/open-banking?error=missing_parameters', request.url)
      );
    }

    // Recuperar el code_verifier y validar el state
    const pkceData = pkceStorage.get(state);
    if (!pkceData) {
      return NextResponse.redirect(
        new URL('/open-banking?error=invalid_state', request.url)
      );
    }

    // Eliminar el state usado (prevenir reutilización)
    pkceStorage.delete(state);

    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/login?callbackUrl=/open-banking', request.url)
      );
    }

    // Verificar que el userId coincida
    if (session.user.id !== pkceData.userId) {
      return NextResponse.redirect(
        new URL('/open-banking?error=user_mismatch', request.url)
      );
    }

    // Intercambiar el código por un access token
    const tokenResponse = await exchangeCodeForToken(code, pkceData.verifier);

    // Guardar el token en la base de datos
    await prisma.bankConnection.create({
      data: {
        userId: session.user.id,
        provider: 'redsys',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || '',
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        scope: tokenResponse.scope,
        status: 'active',
      },
    });

    // Redirigir a la página de open banking con éxito
    return NextResponse.redirect(
      new URL('/open-banking?success=true', request.url)
    );
  } catch (error: any) {
    logger.error('Error en callback OAuth:', error);
    return NextResponse.redirect(
      new URL(
        `/open-banking?error=token_exchange_failed&error_description=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }
}
