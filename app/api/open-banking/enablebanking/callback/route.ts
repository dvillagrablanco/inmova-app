import { NextRequest, NextResponse } from 'next/server';
import { findSociedadByIban } from '@/lib/banking-unified-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * CRÍTICO: Usar URL pública para redirects.
 * Next.js detrás de Nginx usa request.url = http://localhost:3000 (URL interna).
 * Si se usa request.url como base, el usuario es redirigido a localhost:3000
 * en su propio navegador (su máquina local), no al servidor.
 */
function getRedirectBase(): string {
  const appUrl = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://inmovaapp.com'
  ).replace(/\/$/, '');
  return `${appUrl}/finanzas/bancaria-grupo`;
}

/**
 * GET /api/open-banking/enablebanking/callback
 *
 * Enable Banking redirige aquí tras la autorización PSD2.
 *
 * Parámetros recibidos:
 *   code  — authorization code UUID
 *   state — estado original ("bankinter_vidaro", "bbva_vidaro", etc.)
 *   error — si el usuario cancela o hay error
 *
 * Flujo VERIFICADO con la API real:
 *   1. POST /sessions {code} → session con:
 *        uid           — session_id para futuras llamadas
 *        accounts      — array de UIDs de cuentas autorizadas
 *        accounts_data — array con datos completos incluyendo account_id.iban
 *        aspsp.name    — nombre del banco
 *   2. Leer IBANs de sessionData.accounts_data[].account_id.iban
 *   3. Mapear cada IBAN a su sociedad del Grupo Vidaro
 *   4. Crear una BankConnection por sociedad detectada
 *   5. Guardar session_id como accessToken y accounts_data como refreshToken
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const redirectBase = getRedirectBase();

  // ── Errores del banco ─────────────────────────────────────────────
  const errorParam = params.get('error') || params.get('error_description');
  if (errorParam) {
    logger.warn(`[EB Callback] Error del banco: ${errorParam}`);
    return NextResponse.redirect(
      `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(errorParam)}`
    );
  }

  const code = params.get('code');
  const stateParam = params.get('state') || '';

  if (!code) {
    logger.warn('[EB Callback] Sin code en la URL');
    return NextResponse.redirect(`${redirectBase}?provider=enablebanking&error=missing_code`);
  }

  logger.info(`[EB Callback] code=${code.substring(0, 8)}... state=${stateParam}`);

  try {
    // ── Generar JWT para Enable Banking API ───────────────────────────
    const jwtLib = await import('jsonwebtoken');
    const privateKey = (process.env.ENABLE_BANKING_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const appId = process.env.ENABLE_BANKING_APP_ID || '';
    const nowTs = Math.floor(Date.now() / 1000);

    const apiToken = jwtLib.sign(
      { iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: nowTs, exp: nowTs + 3600 },
      privateKey,
      { algorithm: 'RS256', header: { alg: 'RS256', kid: appId } } as any
    );

    // ── PASO 1: Intercambiar code por sesión ──────────────────────────
    // POST /sessions devuelve: uid, accounts (UIDs), accounts_data (con IBANs), aspsp
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
      const errMsg = (errData as any).message || `HTTP ${sessionRes.status}`;
      logger.error(`[EB Callback] POST /sessions falló: ${errMsg}`);
      return NextResponse.redirect(
        `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(errMsg)}`
      );
    }

    const sessionData = await sessionRes.json();
    logger.info(
      `[EB Callback] Sesión: uid=${sessionData.uid} bank=${sessionData.aspsp?.name} accounts=${sessionData.accounts?.length}`
    );

    const sessionId: string = sessionData.uid || '';
    const accountUids: string[] = Array.isArray(sessionData.accounts) ? sessionData.accounts : [];
    // accounts_data contiene IBANs completos — los guardamos para sync
    const accountsData: any[] = Array.isArray(sessionData.accounts_data)
      ? sessionData.accounts_data
      : [];
    const bankName: string = sessionData.aspsp?.name || 'Enable Banking';

    if (!sessionId) {
      logger.error(
        `[EB Callback] Sin uid en respuesta. Keys: ${Object.keys(sessionData).join(', ')}`
      );
      return NextResponse.redirect(`${redirectBase}?provider=enablebanking&error=no_session_uid`);
    }

    // ── PASO 2: Mapear IBANs a sociedades del Grupo Vidaro ────────────
    // accounts_data[].account_id.iban contiene los IBANs reales
    const prisma = getPrismaClient();
    const companyToAccounts: Map<
      string,
      {
        companyId: string;
        companyName: string;
        ibans: string[];
        uids: string[];
      }
    > = new Map();

    for (const accData of accountsData) {
      const iban = (accData.account_id?.iban || '').replace(/\s/g, '').toUpperCase();
      const uid = accData.uid || '';

      if (!iban) continue;

      const match = await findSociedadByIban(iban);
      if (match) {
        const existing = companyToAccounts.get(match.companyId);
        if (existing) {
          existing.ibans.push(iban);
          existing.uids.push(uid);
        } else {
          companyToAccounts.set(match.companyId, {
            companyId: match.companyId,
            companyName: match.companyName,
            ibans: [iban],
            uids: [uid],
          });
        }
        logger.info(
          `[EB Callback] IBAN ${iban} → ${match.companyName} (uid=${uid.substring(0, 8)})`
        );
      } else {
        logger.info(`[EB Callback] IBAN ${iban} no reconocido en Grupo Vidaro`);
      }
    }

    // ── Fallback: si no hay IBANs mapeados, usar Vidaro ───────────────
    if (companyToAccounts.size === 0) {
      const vidaro = await prisma.company.findFirst({
        where: {
          OR: [
            { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
            { nombre: { contains: 'Rovida', mode: 'insensitive' } },
          ],
          activo: true,
        },
        select: { id: true, nombre: true },
      });
      if (vidaro) {
        companyToAccounts.set(vidaro.id, {
          companyId: vidaro.id,
          companyName: vidaro.nombre,
          ibans: [],
          uids: accountUids,
        });
        logger.warn(`[EB Callback] Fallback a ${vidaro.nombre}`);
      }
    }

    // ── PASO 3: Crear/actualizar BankConnection por sociedad ──────────
    let connectionsCreated = 0;

    for (const [cId, data] of companyToAccounts.entries()) {
      const nombreBanco = `${bankName} (${data.uids.length || accountUids.length} cuentas)`;
      const uniqueItemId = `eb_${sessionId.substring(0, 20)}_${cId}`;

      // Serializar accounts_data para el sync (incluye IBANs y UIDs)
      const accountsDataForCompany = accountsData.filter(
        (acc) => data.uids.includes(acc.uid || '') || data.uids.length === 0
      );
      const refreshTokenValue = JSON.stringify(
        accountsDataForCompany.length > 0 ? accountsDataForCompany : accountsData
      );

      const existingConn = await prisma.bankConnection.findFirst({
        where: { companyId: cId, proveedor: 'enablebanking', accessToken: sessionId },
        select: { id: true },
      });

      if (existingConn) {
        await prisma.bankConnection.update({
          where: { id: existingConn.id },
          data: {
            estado: 'conectado',
            nombreBanco,
            ultimaSync: new Date(),
            refreshToken: refreshTokenValue,
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
              refreshToken: refreshTokenValue,
              nombreBanco,
              ultimaSync: new Date(),
            },
          });
        } else {
          await prisma.bankConnection.create({
            data: {
              companyId: cId,
              userId: null,
              proveedor: 'enablebanking',
              provider: 'enablebanking',
              proveedorItemId: uniqueItemId,
              accessToken: sessionId,
              refreshToken: refreshTokenValue,
              nombreBanco,
              estado: 'conectado',
              ultimaSync: new Date(),
            },
          });
          connectionsCreated++;
        }
      }

      logger.info(
        `[EB Callback] ${data.companyName}: IBANs=[${data.ibans.join(', ')}] session=${sessionId.substring(0, 20)}`
      );
    }

    // ── PASO 4: Limpiar pendientes ────────────────────────────────────
    // Usar 'desconectado' (enum válido) para marcar los intentos anteriores
    await prisma.bankConnection
      .updateMany({
        where: {
          proveedor: 'enablebanking',
          estado: 'renovacion_requerida',
          NOT: { accessToken: sessionId },
        },
        data: { estado: 'desconectado' },
      })
      .catch((e: any) => logger.warn(`[EB Callback] Cleanup error (no crítico): ${e.message}`));

    // ── PASO 5: Sync inmediato de transacciones ──────────────────────
    // Aprovechamos que la sesión acaba de crearse y está activa
    let txSynced = 0;
    try {
      const { syncEnableBankingTransactions } = await import('@/lib/enablebanking-service');
      for (const [cId] of companyToAccounts.entries()) {
        const syncResult = await syncEnableBankingTransactions(cId);
        txSynced += syncResult.newTransactions;
      }
      logger.info(`[EB Callback] Sync automático: ${txSynced} nuevas transacciones`);
    } catch (syncErr: any) {
      logger.warn(`[EB Callback] Sync automático error (no crítico): ${syncErr.message}`);
    }

    const totalAccounts = accountUids.length;
    const totalSociedades = companyToAccounts.size;

    logger.info(
      `[EB Callback] ÉXITO: ${bankName} — ${totalAccounts} cuentas, ${totalSociedades} sociedades, session=${sessionId.substring(0, 20)}`
    );

    return NextResponse.redirect(
      `${redirectBase}?provider=enablebanking&success=bank_connected&bank=${encodeURIComponent(bankName)}&accounts=${totalAccounts}&sociedades=${totalSociedades}&tx=${txSynced}`
    );
  } catch (error: any) {
    logger.error('[EB Callback Error]:', error);
    return NextResponse.redirect(
      `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(error.message || 'unknown')}`
    );
  }
}
