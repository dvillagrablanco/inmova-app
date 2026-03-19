import { NextRequest, NextResponse } from 'next/server';
import { listAccounts, getConnection } from '@/lib/saltedge-service';
import { findSociedadByIban } from '@/lib/banking-unified-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/saltedge/callback
 *
 * Salt Edge redirige aquí tras la autorización bancaria.
 *
 * Parámetros de Salt Edge:
 *   - connection_id: ID de la conexión creada
 *   - connection_secret: Secret para acceder a las cuentas
 *   - stage: "success" | "error" | "fetching"
 *
 * Lógica de grupo:
 *   1. Lista todas las cuentas de la conexión
 *   2. Para cada cuenta con IBAN conocido, identifica la sociedad del Grupo Vidaro
 *   3. Crea o actualiza BankConnection en BD para cada sociedad con cuentas
 *   4. Redirige a la UI con el resumen
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const stage = params.get('stage');
  const connectionId = params.get('connection_id');
  const connectionSecret = params.get('connection_secret');
  const companyId = params.get('companyId');
  const userId = params.get('userId');
  const errorMessage = params.get('error');

  const redirectBase = '/finanzas/bancaria-setup';

  if (stage === 'error' || errorMessage) {
    logger.warn(`[SaltEdge Callback] Error: ${errorMessage}`);
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=saltedge&error=${encodeURIComponent(errorMessage || 'auth_failed')}`,
        request.url
      )
    );
  }

  if (stage === 'fetching') {
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=saltedge&status=fetching&connection_id=${connectionId}`,
        request.url
      )
    );
  }

  if (!connectionId || !connectionSecret) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=saltedge&error=missing_params`, request.url)
    );
  }

  try {
    const prisma = getPrismaClient();

    // 1. Obtener detalles de la conexión (nombre del banco)
    const connection = await getConnection(connectionId, connectionSecret);
    const bankName = connection?.providerName || connectionId;
    const providerCode = connection?.providerCode || '';

    logger.info(`[SaltEdge Callback] Conexión ${connectionId} — banco: ${bankName}`);

    // 2. Obtener todas las cuentas de la conexión
    const accounts = await listAccounts(connectionId, connectionSecret);
    logger.info(`[SaltEdge Callback] ${accounts.length} cuentas encontradas`);

    // 3. Recuperar el customer_secret desde la conexión pendiente en BD
    // (lo guardamos en refreshToken al iniciar la sesión)
    const pendingConn = await prisma.bankConnection.findFirst({
      where: {
        proveedor: 'saltedge',
        estado: 'renovacion_requerida',
        proveedorItemId: '',
        ...(companyId ? { companyId } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, refreshToken: true, companyId: true },
    });

    const customerSecret = pendingConn?.refreshToken || connectionSecret;

    // 4. Mapear cuentas a sociedades
    const ibanToCompany: Map<
      string,
      {
        companyId: string;
        companyName: string;
        banco: string;
        alias: string;
        ibans: string[];
      }
    > = new Map();

    for (const account of accounts) {
      const iban = account.extra?.iban || account.iban || '';
      if (!iban) continue;

      const match = await findSociedadByIban(iban);
      if (!match) {
        logger.info(`[SaltEdge Callback] IBAN ${iban} no reconocido para el Grupo Vidaro`);
        continue;
      }

      // Agrupar IBs por companyId
      const existing = ibanToCompany.get(match.companyId);
      if (existing) {
        existing.ibans.push(iban);
      } else {
        ibanToCompany.set(match.companyId, {
          ...match,
          ibans: [iban],
        });
      }
    }

    // Si no se encontró ningún IBAN del grupo, usar la empresa del token de sesión
    if (ibanToCompany.size === 0 && companyId) {
      logger.warn(
        `[SaltEdge Callback] Ningún IBAN reconocido. Asignando conexión a company ${companyId}`
      );
      ibanToCompany.set(companyId, {
        companyId,
        companyName: companyId,
        banco: bankName,
        alias: bankName,
        ibans: accounts.map((a) => a.extra?.iban || a.iban || '').filter(Boolean),
      });
    }

    // 5. Crear/actualizar BankConnection para cada sociedad encontrada
    // proveedorItemId tiene @unique en el schema, así que usamos connectionId_companyId
    // como ID único por empresa, y accessToken para el connectionId real de Salt Edge.
    let connectionsCreated = 0;

    for (const [cId, data] of ibanToCompany.entries()) {
      // ID único por empresa: evita conflicto con @unique de proveedorItemId
      const uniqueItemId = `saltedge_${connectionId}_${cId}`;

      // Buscar conexión existente por accessToken + companyId (puede haber duplicado por unique)
      const existingConn = await prisma.bankConnection.findFirst({
        where: {
          companyId: cId,
          proveedor: 'saltedge',
          accessToken: connectionId,
        },
        select: { id: true },
      });

      if (existingConn) {
        await prisma.bankConnection.update({
          where: { id: existingConn.id },
          data: {
            estado: 'conectado',
            consentId: connectionSecret,
            refreshToken: customerSecret,
            nombreBanco: `${bankName} (${data.ibans.length} cuentas)`,
            ultimaSync: new Date(),
          },
        });
      } else {
        // Verificar si proveedorItemId ya existe (por la restricción @unique)
        const existsByItemId = await prisma.bankConnection
          .findUnique({
            where: { proveedorItemId: uniqueItemId },
            select: { id: true },
          })
          .catch(() => null);

        if (existsByItemId) {
          await prisma.bankConnection.update({
            where: { id: existsByItemId.id },
            data: {
              estado: 'conectado',
              accessToken: connectionId,
              consentId: connectionSecret,
              refreshToken: customerSecret,
              nombreBanco: `${bankName} (${data.ibans.length} cuentas)`,
              ultimaSync: new Date(),
            },
          });
        } else {
          await prisma.bankConnection.create({
            data: {
              companyId: cId,
              userId: userId || '',
              proveedor: 'saltedge',
              provider: 'saltedge',
              // ID único por empresa para respetar @unique
              proveedorItemId: uniqueItemId,
              // accessToken almacena el connectionId real para las llamadas a la API
              accessToken: connectionId,
              consentId: connectionSecret,
              refreshToken: customerSecret,
              nombreBanco: `${bankName} (${data.ibans.length} cuentas)`,
              estado: 'conectado',
              ultimaSync: new Date(),
            },
          });
          connectionsCreated++;
        }
      }

      logger.info(
        `[SaltEdge Callback] ${data.companyName}: ${data.ibans.length} cuentas (${data.ibans.join(', ')})`
      );
    }

    // 6. Marcar conexión pendiente como completada
    if (pendingConn) {
      if (ibanToCompany.size > 0) {
        // Actualizar la pendiente con los datos de la primera sociedad encontrada
        const firstEntry = Array.from(ibanToCompany.values())[0];
        await prisma.bankConnection
          .update({
            where: { id: pendingConn.id },
            data: {
              estado: ibanToCompany.has(pendingConn.companyId)
                ? 'conciliado_en_grupo'
                : 'completado',
              errorDetalle: `Grupo conectado: ${ibanToCompany.size} sociedades, ${accounts.length} cuentas`,
            },
          })
          .catch(() => null);

        // Si la pendiente es de una sociedad que sí tiene cuentas, actualizarla directamente
        if (ibanToCompany.has(pendingConn.companyId)) {
          await prisma.bankConnection
            .update({
              where: { id: pendingConn.id },
              data: {
                estado: 'conectado',
                proveedorItemId: connectionId,
                accessToken: connectionId,
                consentId: connectionSecret,
                refreshToken: customerSecret,
                nombreBanco: `${bankName} (${firstEntry.ibans.length} cuentas)`,
                ultimaSync: new Date(),
              },
            })
            .catch(() => null);
        }
      }
    }

    const totalCuentas = accounts.length;
    const totalSociedades = ibanToCompany.size;

    logger.info(
      `[SaltEdge Callback] OK: ${bankName} — ${totalSociedades} sociedades, ${totalCuentas} cuentas, ${connectionsCreated} nuevas conexiones`
    );

    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=saltedge&success=bank_connected` +
          `&bank=${encodeURIComponent(bankName)}` +
          `&accounts=${totalCuentas}` +
          `&sociedades=${totalSociedades}`,
        request.url
      )
    );
  } catch (error: any) {
    logger.error('[SaltEdge Callback Error]:', error);
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=saltedge&error=callback_failed`, request.url)
    );
  }
}
