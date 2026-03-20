import { NextRequest, NextResponse } from 'next/server';
import { listAccountsForCustomer } from '@/lib/enablebanking-service';
import { findSociedadByIban } from '@/lib/banking-unified-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/enablebanking/callback
 *
 * Enable Banking redirige aquí tras la autorización PSD2 en el banco.
 *
 * Parámetros que envía Enable Banking:
 *   - auth_token: token de acceso directo (NO requiere intercambio de code)
 *   - state: el state que enviamos (contiene companyId y userId)
 *   - error: si hubo error en el banco
 *   - error_description: descripción del error
 *
 * Nota: Enable Banking envía auth_token DIRECTAMENTE, no un code de autorización.
 * El auth_token se usa tal cual para acceder a /accounts, /balances, /transactions.
 *
 * Lógica:
 *   1. Extraer auth_token del query param
 *   2. Obtener cuentas accesibles con ese token
 *   3. Para cada cuenta con IBAN del Grupo Vidaro, crear BankConnection
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const redirectBase = '/finanzas/bancaria-grupo';

  // Enable Banking puede enviar error
  const errorParam = params.get('error') || params.get('error_description');
  if (errorParam) {
    logger.warn(`[EnableBanking Callback] Error: ${errorParam}`);
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(errorParam)}`,
        request.url
      )
    );
  }

  // Enable Banking envía auth_token directamente (no code)
  const authToken = params.get('auth_token');
  const stateParam = params.get('state') || '';

  if (!authToken) {
    logger.warn('[EnableBanking Callback] Sin auth_token');
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=enablebanking&error=missing_auth_token`, request.url)
    );
  }

  // Decodificar state (contiene companyId y userId del usuario que inició la auth)
  let companyId = '';
  let userId = '';
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    companyId = decoded.companyId || '';
    userId = decoded.userId || '';
  } catch {
    // state puede ser un string simple (e.g. "bankinter_vidaro")
    logger.info(`[EnableBanking Callback] State no JSON: ${stateParam}`);
  }

  try {
    const prisma = getPrismaClient();

    // 1. Listar cuentas accesibles con este auth_token
    // Enable Banking API: GET /accounts?auth_token=TOKEN
    const { default: ebService } = await import('@/lib/enablebanking-service');

    // Llamar directamente a la API con el auth_token
    const { ebRequest } = await import('@/lib/enablebanking-service')
      .then(async (m) => {
        // Hack: usar el mismo patrón que la función interna
        return { ebRequest: null };
      })
      .catch(() => ({ ebRequest: null }));

    // Obtener cuentas vía API directa con el auth_token
    const jwt = await import('jsonwebtoken');
    const now = Math.floor(Date.now() / 1000);
    const privateKey = (process.env.ENABLE_BANKING_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const appId = process.env.ENABLE_BANKING_APP_ID || '';

    const apiToken = jwt.sign(
      { iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: now, exp: now + 3600 },
      privateKey,
      { algorithm: 'RS256', header: { alg: 'RS256', kid: appId } } as any
    );

    // Obtener cuentas asociadas a este auth_token
    const accountsRes = await fetch(
      `https://api.enablebanking.com/accounts?auth_token=${encodeURIComponent(authToken)}`,
      { headers: { Accept: 'application/json', Authorization: `Bearer ${apiToken}` } }
    );

    let accounts: any[] = [];
    let bankName = 'Enable Banking';

    if (accountsRes.ok) {
      const accountsData = await accountsRes.json();
      accounts = Array.isArray(accountsData) ? accountsData : accountsData.accounts || [];
      logger.info(`[EnableBanking Callback] ${accounts.length} cuentas encontradas`);
    } else {
      const errData = await accountsRes.json().catch(() => ({}));
      logger.warn(
        `[EnableBanking Callback] Error obteniendo cuentas: ${accountsRes.status} ${JSON.stringify(errData)}`
      );
    }

    // 2. Mapear IBANs a sociedades del Grupo Vidaro
    const ibanToCompany: Map<string, { companyId: string; companyName: string; ibans: string[] }> =
      new Map();

    for (const acc of accounts) {
      const iban = (acc.account_id?.iban || acc.identification?.iban || acc.iban || '').replace(
        /\s/g,
        ''
      );
      if (!iban) continue;

      // Intentar detectar el banco del primer IBAN
      if (!bankName || bankName === 'Enable Banking') {
        if (
          iban.startsWith('ES56') ||
          iban.startsWith('ES88') ||
          iban.startsWith('ES53012802505')
        ) {
          bankName = 'Bankinter';
        } else if (
          iban.startsWith('ES23018') ||
          iban.startsWith('ES53018') ||
          iban.startsWith('ES45018')
        ) {
          bankName = 'BBVA';
        }
      }

      const match = await findSociedadByIban(iban);
      if (match) {
        const existing = ibanToCompany.get(match.companyId);
        if (existing) {
          existing.ibans.push(iban);
        } else {
          ibanToCompany.set(match.companyId, {
            companyId: match.companyId,
            companyName: match.companyName,
            ibans: [iban],
          });
        }
      } else {
        logger.info(`[EnableBanking Callback] IBAN no reconocido en Grupo Vidaro: ${iban}`);
      }
    }

    // Si no se detectaron IBANs del grupo pero tenemos companyId del state, usar ese
    if (ibanToCompany.size === 0 && companyId) {
      ibanToCompany.set(companyId, {
        companyId,
        companyName: companyId,
        ibans: accounts.map((a) => a.account_id?.iban || '').filter(Boolean),
      });
    }

    // 3. Crear/actualizar BankConnection por sociedad
    let connectionsCreated = 0;

    for (const [cId, data] of ibanToCompany.entries()) {
      const uniqueItemId = `eb_${authToken.substring(0, 20)}_${cId}`;

      // Buscar conexión existente
      const existingConn = await prisma.bankConnection.findFirst({
        where: { companyId: cId, proveedor: 'enablebanking', accessToken: authToken },
        select: { id: true },
      });

      if (existingConn) {
        await prisma.bankConnection.update({
          where: { id: existingConn.id },
          data: {
            estado: 'conectado',
            nombreBanco: `${bankName} (${data.ibans.length} cuentas)`,
            ultimaSync: new Date(),
          },
        });
      } else {
        // Verificar unicidad de proveedorItemId
        const existsByItemId = await prisma.bankConnection
          .findFirst({ where: { proveedorItemId: uniqueItemId }, select: { id: true } })
          .catch(() => null);

        if (existsByItemId) {
          await prisma.bankConnection.update({
            where: { id: existsByItemId.id },
            data: {
              estado: 'conectado',
              accessToken: authToken,
              nombreBanco: `${bankName} (${data.ibans.length} cuentas)`,
              ultimaSync: new Date(),
            },
          });
        } else {
          await prisma.bankConnection.create({
            data: {
              companyId: cId,
              userId: userId || '',
              proveedor: 'enablebanking',
              provider: 'enablebanking',
              proveedorItemId: uniqueItemId,
              accessToken: authToken,
              nombreBanco: `${bankName} (${data.ibans.length} cuentas)`,
              estado: 'conectado',
              ultimaSync: new Date(),
            },
          });
          connectionsCreated++;
        }
      }

      logger.info(`[EnableBanking Callback] ${data.companyName}: ${data.ibans.join(', ')}`);
    }

    // 4. Marcar conexión pendiente como completada (si había una)
    if (companyId) {
      await prisma.bankConnection
        .updateMany({
          where: { companyId, proveedor: 'enablebanking', estado: 'renovacion_requerida' },
          data: { estado: 'completado_grupo' },
        })
        .catch(() => null);
    }

    const totalSociedades = ibanToCompany.size;
    logger.info(
      `[EnableBanking Callback] OK: ${bankName} — ${totalSociedades} sociedades, ${accounts.length} cuentas`
    );

    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=enablebanking&success=bank_connected` +
          `&bank=${encodeURIComponent(bankName)}` +
          `&accounts=${accounts.length}` +
          `&sociedades=${totalSociedades}`,
        request.url
      )
    );
  } catch (error: any) {
    logger.error('[EnableBanking Callback Error]:', error);
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=enablebanking&error=callback_failed`, request.url)
    );
  }
}
