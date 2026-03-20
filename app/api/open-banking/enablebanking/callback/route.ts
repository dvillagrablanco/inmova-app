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
 *   code  — authorization code UUID (e.g. "309a7ec9-4d33-4d44-84e7-794a5913c80f")
 *   state — estado original (string simple como "bankinter_vidaro")
 *   error — si el usuario cancela o hay error en el banco
 *
 * Flujo CORRECTO (confirmado por análisis de la API):
 *   1. POST /sessions {code} → session object con:
 *        uid         — session_id para futuras llamadas
 *        accounts    — array de UIDs de cuentas autorizadas
 *        aspsp.name  — nombre del banco
 *   2. Guardar session uid + account UIDs en BankConnection
 *   3. Para saldos/transacciones: GET /accounts/{uid}/balances?session_id={uid}
 *   4. NO llamar GET /accounts — ese endpoint devuelve 404 sin contexto
 *
 * IMPORTANTE: Los IBANs NO están disponibles directamente en la respuesta.
 * Los accounts_data contienen identification_hash (opaco). Se asigna al
 * Grupo Vidaro (Vidaro holding) y el sync posterior distingue por transacciones.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const redirectBase = '/finanzas/bancaria-grupo';

  // ── Errores del banco ───────────────────────────────────────────
  const errorParam = params.get('error') || params.get('error_description');
  if (errorParam) {
    logger.warn(`[EB Callback] Error del banco: ${errorParam}`);
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(errorParam)}`,
        request.url
      )
    );
  }

  const code = params.get('code');
  const stateParam = params.get('state') || '';

  if (!code) {
    logger.warn('[EB Callback] Sin code en la URL');
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=enablebanking&error=missing_code`, request.url)
    );
  }

  logger.info(`[EB Callback] code=${code.substring(0, 8)}... state=${stateParam}`);

  try {
    // ── Generar JWT para autenticar con Enable Banking ──────────────
    const jwtLib = await import('jsonwebtoken');
    const privateKey = (process.env.ENABLE_BANKING_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const appId = process.env.ENABLE_BANKING_APP_ID || '';
    const nowTs = Math.floor(Date.now() / 1000);

    const apiToken = jwtLib.sign(
      { iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: nowTs, exp: nowTs + 3600 },
      privateKey,
      { algorithm: 'RS256', header: { alg: 'RS256', kid: appId } } as any
    );

    // ── PASO 1: Intercambiar code por sesión ────────────────────────
    // POST /sessions devuelve: { uid, accounts: [uid1, uid2...], aspsp: {name}, ... }
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
      logger.error(`[EB Callback] POST /sessions falló: ${sessionRes.status} — ${errMsg}`);
      return NextResponse.redirect(
        new URL(
          `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(errMsg)}`,
          request.url
        )
      );
    }

    const sessionData = await sessionRes.json();
    logger.info(`[EB Callback] Sesión creada: ${JSON.stringify(sessionData).substring(0, 300)}`);

    // Extraer datos de la sesión
    const sessionId: string = sessionData.uid || sessionData.session_id || sessionData.id || '';
    // Los account UIDs vienen directamente en la respuesta del POST
    const accountUids: string[] = Array.isArray(sessionData.accounts) ? sessionData.accounts : [];
    const bankName: string = sessionData.aspsp?.name || 'Enable Banking';

    if (!sessionId) {
      logger.error(`[EB Callback] Sin uid en respuesta. Keys: ${Object.keys(sessionData)}`);
      return NextResponse.redirect(
        new URL(`${redirectBase}?provider=enablebanking&error=no_session_uid`, request.url)
      );
    }

    logger.info(
      `[EB Callback] SessionId=${sessionId} | ${bankName} | ${accountUids.length} cuentas`
    );

    // ── PASO 2: Intentar obtener IBANs para mapear a sociedades ──────
    // Enable Banking restringe acceso a IBANs, pero intentamos con balances
    const prisma = getPrismaClient();
    const ibanToCompany: Map<string, { companyId: string; companyName: string; ibans: string[] }> =
      new Map();

    for (const accountUid of accountUids) {
      try {
        // Intentar obtener detalle de la cuenta con session_id
        const detailRes = await fetch(
          `https://api.enablebanking.com/accounts/${accountUid}?session_id=${encodeURIComponent(sessionId)}`,
          { headers: { Accept: 'application/json', Authorization: `Bearer ${apiToken}` } }
        );

        if (detailRes.ok) {
          const accDetail = await detailRes.json();
          const iban = (accDetail.account_id?.iban || accDetail.identification?.iban || '').replace(
            /\s/g,
            ''
          );

          if (iban) {
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
              logger.info(`[EB Callback] IBAN ${iban} → ${match.companyName}`);
            }
          }
        }
      } catch {
        // IBAN no disponible — usar fallback al Grupo Vidaro
      }
    }

    // ── PASO 3: Fallback — asignar al Grupo Vidaro ──────────────────
    // Si no podemos obtener IBANs, asignamos al holding Vidaro.
    // Durante el sync posterior se pueden mapear por transacciones.
    if (ibanToCompany.size === 0) {
      // Buscar Vidaro como holding
      let fallbackCompany = await prisma.company.findFirst({
        where: { nombre: { contains: 'Vidaro', mode: 'insensitive' }, activo: true },
        select: { id: true, nombre: true },
      });

      // Si no hay Vidaro, buscar cualquier empresa del grupo
      if (!fallbackCompany) {
        fallbackCompany = await prisma.company.findFirst({
          where: {
            OR: [
              { nombre: { contains: 'Rovida', mode: 'insensitive' } },
              { nombre: { contains: 'Viroda', mode: 'insensitive' } },
            ],
            activo: true,
          },
          select: { id: true, nombre: true },
        });
      }

      if (fallbackCompany) {
        ibanToCompany.set(fallbackCompany.id, {
          companyId: fallbackCompany.id,
          companyName: fallbackCompany.nombre,
          ibans: [],
        });
        logger.info(`[EB Callback] Fallback a ${fallbackCompany.nombre} (sin IBANs detectados)`);
      }
    }

    // ── PASO 4: Crear/actualizar BankConnection ─────────────────────
    let connectionsCreated = 0;

    for (const [cId, data] of ibanToCompany.entries()) {
      // Nombre descriptivo: banco + número de cuentas
      const nombreBanco = `${bankName} (${accountUids.length} cuentas)`;
      // ID único por sociedad + sesión
      const uniqueItemId = `eb_${sessionId.substring(0, 20)}_${cId}`;

      // Verificar si ya existe conexión con esta sesión
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
            // Guardar UIDs de cuentas en refreshToken para el sync posterior
            refreshToken: JSON.stringify(accountUids),
          },
        });
        logger.info(
          `[EB Callback] Actualizada conexión ${existingConn.id} para ${data.companyName}`
        );
      } else {
        // Buscar si existe por proveedorItemId
        const existsByItemId = await prisma.bankConnection
          .findFirst({ where: { proveedorItemId: uniqueItemId }, select: { id: true } })
          .catch(() => null);

        if (existsByItemId) {
          await prisma.bankConnection.update({
            where: { id: existsByItemId.id },
            data: {
              estado: 'conectado',
              accessToken: sessionId,
              refreshToken: JSON.stringify(accountUids),
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
              // session_id para autenticar futuras llamadas
              accessToken: sessionId,
              // UIDs de cuentas serializados para el sync
              refreshToken: JSON.stringify(accountUids),
              nombreBanco,
              estado: 'conectado',
              ultimaSync: new Date(),
            },
          });
          connectionsCreated++;
        }
      }

      logger.info(
        `[EB Callback] ${data.companyName}: ${accountUids.length} cuentas, session=${sessionId.substring(0, 20)}`
      );
    }

    // ── PASO 5: Limpiar pendientes ──────────────────────────────────
    await prisma.bankConnection
      .updateMany({
        where: {
          proveedor: 'enablebanking',
          estado: { in: ['renovacion_requerida', 'completado_grupo', 'completado'] },
          accessToken: { not: sessionId }, // no borrar la que acabamos de crear
        },
        data: { estado: 'completado' },
      })
      .catch(() => null);

    const totalAccounts = accountUids.length;
    const totalSociedades = ibanToCompany.size;

    logger.info(
      `[EB Callback] ÉXITO: ${bankName} — ${totalAccounts} cuentas en ${totalSociedades} sociedades, ` +
        `session=${sessionId.substring(0, 20)}`
    );

    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=enablebanking&success=bank_connected` +
          `&bank=${encodeURIComponent(bankName)}` +
          `&accounts=${totalAccounts}` +
          `&sociedades=${totalSociedades}`,
        request.url
      )
    );
  } catch (error: any) {
    logger.error('[EB Callback Error]:', error);
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(error.message || 'unknown')}`,
        request.url
      )
    );
  }
}
