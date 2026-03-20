import { NextRequest, NextResponse } from 'next/server';
import { findSociedadByIban } from '@/lib/banking-unified-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/enablebanking/callback
 *
 * Enable Banking redirige aquí tras la autorización PSD2.
 *
 * Parámetros recibidos:
 *   - code: authorization code para intercambiar por sesión (UUID)
 *   - state: estado original (base64 JSON con companyId/userId, o string simple)
 *   - error: si hubo error en el banco
 *
 * Flujo:
 *   1. Intercambiar code por sesión via POST /sessions
 *   2. El session_id resultante se usa como auth_token para GET /accounts
 *   3. Detectar IBANs del Grupo Vidaro y crear BankConnection
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const redirectBase = '/finanzas/bancaria-grupo';

  const errorParam = params.get('error') || params.get('error_description');
  if (errorParam) {
    logger.warn(`[EnableBanking Callback] Error del banco: ${errorParam}`);
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(errorParam)}`,
        request.url
      )
    );
  }

  const code = params.get('code');
  const authTokenDirect = params.get('auth_token'); // por si acaso viniera directo
  const stateParam = params.get('state') || '';

  if (!code && !authTokenDirect) {
    logger.warn('[EnableBanking Callback] Sin code ni auth_token');
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=enablebanking&error=missing_code`, request.url)
    );
  }

  // Decodificar state (puede ser base64 JSON o string simple)
  let companyId = '';
  let userId = '';
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    companyId = decoded.companyId || '';
    userId = decoded.userId || '';
  } catch {
    // State es un string simple como "bankinter_vidaro" — buscar companyId en BD
    logger.info(`[EnableBanking Callback] State simple: ${stateParam}`);
  }

  try {
    const prisma = getPrismaClient();

    // Generar JWT para autenticar con Enable Banking
    const jwtLib = await import('jsonwebtoken');
    const privateKey = (process.env.ENABLE_BANKING_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const appId = process.env.ENABLE_BANKING_APP_ID || '';
    const nowTs = Math.floor(Date.now() / 1000);
    const apiToken = jwtLib.sign(
      { iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: nowTs, exp: nowTs + 3600 },
      privateKey,
      { algorithm: 'RS256', header: { alg: 'RS256', kid: appId } } as any
    );

    let sessionId = authTokenDirect || '';
    let bankName = 'Enable Banking';

    // 1. Intercambiar code por sesión via POST /sessions
    if (code && !sessionId) {
      const sessionRes = await fetch('https://api.enablebanking.com/sessions', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ code }),
      });

      if (!sessionRes.ok) {
        const errData = await sessionRes.json().catch(() => ({}));
        logger.error(
          `[EnableBanking Callback] Error exchange code: ${sessionRes.status} ${JSON.stringify(errData)}`
        );
        return NextResponse.redirect(
          new URL(
            `${redirectBase}?provider=enablebanking&error=session_failed_${sessionRes.status}`,
            request.url
          )
        );
      }

      const sessionData = await sessionRes.json();
      logger.info(
        `[EnableBanking Callback] Sesión creada: ${JSON.stringify(sessionData).substring(0, 200)}`
      );

      // El session_id o uid es el identificador de la sesión autorizada
      sessionId =
        sessionData.uid ||
        sessionData.session_id ||
        sessionData.id ||
        sessionData.access_token ||
        '';
      bankName = sessionData.aspsp?.name || sessionData.institution?.name || 'Enable Banking';

      if (!sessionId) {
        logger.error(
          `[EnableBanking Callback] Sin session_id en respuesta: ${JSON.stringify(sessionData)}`
        );
        return NextResponse.redirect(
          new URL(`${redirectBase}?provider=enablebanking&error=no_session_id`, request.url)
        );
      }
    }

    // 2. Obtener cuentas con session_id
    const accountsRes = await fetch(
      `https://api.enablebanking.com/accounts?session_id=${encodeURIComponent(sessionId)}`,
      { headers: { Accept: 'application/json', Authorization: `Bearer ${apiToken}` } }
    );

    let accounts: any[] = [];
    if (accountsRes.ok) {
      const d = await accountsRes.json();
      accounts = Array.isArray(d) ? d : d.accounts || [];
      logger.info(`[EnableBanking Callback] ${accounts.length} cuentas con session_id`);
    } else {
      // Fallback: intentar con auth_token
      const accountsRes2 = await fetch(
        `https://api.enablebanking.com/accounts?auth_token=${encodeURIComponent(sessionId)}`,
        { headers: { Accept: 'application/json', Authorization: `Bearer ${apiToken}` } }
      );
      if (accountsRes2.ok) {
        const d2 = await accountsRes2.json();
        accounts = Array.isArray(d2) ? d2 : d2.accounts || [];
        logger.info(`[EnableBanking Callback] ${accounts.length} cuentas con auth_token`);
      } else {
        logger.warn(
          `[EnableBanking Callback] No se pudieron obtener cuentas: ${accountsRes.status}`
        );
      }
    }

    // 3. Mapear IBANs a sociedades del Grupo Vidaro
    const ibanToCompany: Map<string, { companyId: string; companyName: string; ibans: string[] }> =
      new Map();

    for (const acc of accounts) {
      const iban = (acc.account_id?.iban || acc.identification?.iban || acc.iban || '')
        .replace(/\s/g, '')
        .toUpperCase();

      if (!iban) continue;

      // Detectar banco por IBAN
      if (bankName === 'Enable Banking') {
        if (iban.includes('12802505')) bankName = 'Bankinter';
        else if (iban.includes('01820') || iban.includes('01826')) bankName = 'BBVA';
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
      }
    }

    // Si no se detectaron IBANs y tenemos companyId del state, usar ese
    if (ibanToCompany.size === 0) {
      // Buscar el companyId del Grupo Vidaro (la holding)
      const vidaro = await prisma.company.findFirst({
        where: { nombre: { contains: 'Vidaro', mode: 'insensitive' }, activo: true },
        select: { id: true, nombre: true },
      });
      if (vidaro) {
        ibanToCompany.set(vidaro.id, {
          companyId: vidaro.id,
          companyName: vidaro.nombre,
          ibans: accounts.map((a) => a.account_id?.iban || '').filter(Boolean),
        });
        logger.info(`[EnableBanking Callback] Sin IBANs detectados, usando ${vidaro.nombre}`);
      } else if (companyId) {
        ibanToCompany.set(companyId, {
          companyId,
          companyName: stateParam,
          ibans: [],
        });
      }
    }

    // 4. Crear/actualizar BankConnection para cada sociedad
    let connectionsCreated = 0;
    for (const [cId, data] of ibanToCompany.entries()) {
      const uniqueItemId = `eb_${sessionId.substring(0, 20)}_${cId}`;

      const existingConn = await prisma.bankConnection.findFirst({
        where: { companyId: cId, proveedor: 'enablebanking', accessToken: sessionId },
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
        const existsByItemId = await prisma.bankConnection
          .findFirst({ where: { proveedorItemId: uniqueItemId }, select: { id: true } })
          .catch(() => null);

        if (existsByItemId) {
          await prisma.bankConnection.update({
            where: { id: existsByItemId.id },
            data: {
              estado: 'conectado',
              accessToken: sessionId,
              nombreBanco: `${bankName} (${data.ibans.length} cuentas)`,
              ultimaSync: new Date(),
            },
          });
        } else {
          await prisma.bankConnection.create({
            data: {
              companyId: cId,
              userId: userId || null,
              proveedor: 'enablebanking',
              provider: 'enablebanking',
              proveedorItemId: uniqueItemId,
              accessToken: sessionId,
              nombreBanco: `${bankName} (${data.ibans.length} cuentas)`,
              estado: 'conectado',
              ultimaSync: new Date(),
            },
          });
          connectionsCreated++;
        }
      }

      logger.info(
        `[EnableBanking Callback] ${data.companyName}: ${data.ibans.join(', ')} — ${sessionId.substring(0, 20)}`
      );
    }

    // 5. Limpiar conexiones pendientes
    if (companyId) {
      await prisma.bankConnection
        .updateMany({
          where: { companyId, proveedor: 'enablebanking', estado: 'renovacion_requerida' },
          data: { estado: 'completado' },
        })
        .catch(() => null);
    }

    logger.info(
      `[EnableBanking Callback] ÉXITO: ${bankName} — ${ibanToCompany.size} sociedades, ${accounts.length} cuentas`
    );

    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=enablebanking&success=bank_connected` +
          `&bank=${encodeURIComponent(bankName)}` +
          `&accounts=${accounts.length}` +
          `&sociedades=${ibanToCompany.size}`,
        request.url
      )
    );
  } catch (error: any) {
    logger.error('[EnableBanking Callback Error]:', error);
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }
}
