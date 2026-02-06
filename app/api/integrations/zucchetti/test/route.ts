/**
 * API Route: Test de conexión con Zucchetti
 *
 * POST /api/integrations/zucchetti/test
 * Verifica que la conexión con Zucchetti funciona correctamente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { getZucchettiTokens, refreshZucchettiToken } from '../callback/route';
import {
  getZucchettiAuthMode,
  isAltaiConfigured,
  testAltaiConnection,
} from '@/lib/zucchetti-altai-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ZUCCHETTI_API_URL = process.env.ZUCCHETTI_API_URL || 'https://api.zucchetti.it/v1';

// ═══════════════════════════════════════════════════════════════
// POST - Test de conexión
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const authMode = getZucchettiAuthMode();

    // Verificar si la integración está habilitada
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        zucchettiEnabled: true,
        zucchettiAccessToken: true,
        zucchettiCompanyId: true,
      },
    });

    if (authMode === 'altai') {
      if (!isAltaiConfigured()) {
        return NextResponse.json({
          success: false,
          connected: false,
          message: 'Altai no está configurado. Configura las credenciales del servidor.',
          tests: {
            configured: false,
            authenticated: false,
            apiReachable: false,
            canReadData: false,
          },
          authMode,
        });
      }

      const altaiTest = await testAltaiConnection(companyId);
      const tests = {
        configured: true,
        authenticated: altaiTest.authenticated,
        apiReachable: altaiTest.apiReachable,
        canReadData: altaiTest.canReadData,
      };

      await prisma.company.update({
        where: { id: companyId },
        data: {
          zucchettiSyncErrors: tests.authenticated ? 0 : company?.zucchettiCompanyId ? 1 : 0,
        },
      });

      return NextResponse.json({
        success: tests.configured && tests.authenticated,
        connected: tests.authenticated,
        message: tests.authenticated
          ? 'Conexión con Altai verificada correctamente'
          : 'No se pudo autenticar con Altai',
        tests,
        errorDetails: altaiTest.errorDetails,
        zucchettiCompanyId: company?.zucchettiCompanyId || null,
        authMode,
      });
    }

    if (!company?.zucchettiEnabled || !company.zucchettiAccessToken) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: 'Zucchetti no está conectado. Por favor, autoriza la integración primero.',
        tests: {
          configured: false,
          authenticated: false,
          apiReachable: false,
          canReadData: false,
        },
      });
    }

    // Intentar refrescar el token si es necesario
    const tokenRefreshed = await refreshZucchettiToken(companyId);

    // Obtener tokens actualizados
    const tokens = await getZucchettiTokens(companyId);

    if (!tokens) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: 'No se pudieron obtener los tokens de Zucchetti',
        tests: {
          configured: true,
          authenticated: false,
          apiReachable: false,
          canReadData: false,
        },
      });
    }

    // Tests de conexión
    const tests = {
      configured: true,
      authenticated: false,
      apiReachable: false,
      canReadData: false,
    };

    let errorDetails: string | null = null;

    // Test 1: Verificar que el API responde
    try {
      const healthResponse = await fetch(`${ZUCCHETTI_API_URL}/health`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      tests.apiReachable = healthResponse.ok || healthResponse.status === 401;

      if (!tests.apiReachable) {
        errorDetails = `API no responde: ${healthResponse.status}`;
      }
    } catch (healthError: any) {
      // Puede que no haya endpoint /health, intentar con el endpoint de usuario
      tests.apiReachable = true; // Asumimos que está disponible y probamos auth
    }

    // Test 2: Verificar autenticación
    try {
      const authResponse = await fetch(`${ZUCCHETTI_API_URL}/user/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      tests.authenticated = authResponse.ok;

      if (!tests.authenticated && authResponse.status === 401) {
        errorDetails = 'Token de acceso inválido o expirado';
      }
    } catch (authError: any) {
      // Intentar otro endpoint de verificación
      try {
        const altResponse = await fetch(`${ZUCCHETTI_API_URL}/company/info`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });

        tests.authenticated = altResponse.ok;
      } catch {
        tests.authenticated = false;
        errorDetails = `Error de autenticación: ${authError.message}`;
      }
    }

    // Test 3: Verificar que podemos leer datos (plan de cuentas)
    if (tests.authenticated) {
      try {
        const dataResponse = await fetch(`${ZUCCHETTI_API_URL}/chart-of-accounts`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });

        tests.canReadData = dataResponse.ok;

        if (!tests.canReadData) {
          // Intentar con clientes
          const customersResponse = await fetch(`${ZUCCHETTI_API_URL}/customers?limit=1`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(10000),
          });

          tests.canReadData = customersResponse.ok;
        }
      } catch (dataError: any) {
        tests.canReadData = false;
      }
    }

    // Actualizar última comprobación
    await prisma.company.update({
      where: { id: companyId },
      data: {
        zucchettiSyncErrors: tests.authenticated ? 0 : company.zucchettiCompanyId ? 1 : 0,
      },
    });

    // Determinar resultado global
    const allTestsPassed = tests.configured && tests.authenticated;
    const partialSuccess = tests.configured && tests.apiReachable;

    logger.info(`[Zucchetti Test] Tests para empresa ${companyId}:`, tests);

    return NextResponse.json({
      success: allTestsPassed,
      connected: tests.authenticated,
      message: allTestsPassed
        ? 'Conexión con Zucchetti verificada correctamente'
        : partialSuccess
          ? 'Conexión parcial - Algunos tests fallaron'
          : 'No se pudo conectar con Zucchetti',
      tests,
      tokenRefreshed,
      errorDetails,
      zucchettiCompanyId: company.zucchettiCompanyId,
      apiUrl: ZUCCHETTI_API_URL,
      authMode,
    });
  } catch (error: any) {
    logger.error('[Zucchetti Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        connected: false,
        message: 'Error ejecutando tests',
        error: error.message,
        tests: {
          configured: false,
          authenticated: false,
          apiReachable: false,
          canReadData: false,
        },
      },
      { status: 500 }
    );
  }
}
