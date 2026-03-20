import { NextRequest, NextResponse } from 'next/server';
import { completeAuth, getAccounts } from '@/lib/enablebanking-service';
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
 * Parámetros devueltos por Enable Banking:
 *   - code: authorization code
 *   - state: el state que enviamos (contiene companyId y userId)
 *   - error: si hubo error en el banco
 *
 * Lógica:
 *   1. Intercambiar code por auth_token
 *   2. Obtener cuentas y detectar IBANs del Grupo Vidaro
 *   3. Crear BankConnection para cada sociedad con cuentas
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const stateParam = params.get('state');
  const errorParam = params.get('error');
  const redirectBase = '/finanzas/bancaria-grupo';

  if (errorParam) {
    logger.warn(`[EnableBanking Callback] Error del banco: ${errorParam}`);
    return NextResponse.redirect(
      new URL(
        `${redirectBase}?provider=enablebanking&error=${encodeURIComponent(errorParam)}`,
        request.url
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=enablebanking&error=missing_code`, request.url)
    );
  }

  // Decodificar state
  let companyId = '';
  let userId = '';
  try {
    const decoded = JSON.parse(Buffer.from(stateParam || '', 'base64url').toString());
    companyId = decoded.companyId || '';
    userId = decoded.userId || '';
  } catch {
    logger.warn('[EnableBanking Callback] State inválido');
  }

  try {
    const prisma = getPrismaClient();

    // 1. Intercambiar code por auth_token
    const authResult = await completeAuth({ code, state: stateParam || undefined });
    const authToken = authResult.authToken;
    const bankName = authResult.bank || 'Banco conectado';

    if (!authToken) {
      return NextResponse.redirect(
        new URL(`${redirectBase}?provider=enablebanking&error=no_auth_token`, request.url)
      );
    }

    logger.info(`[EnableBanking Callback] Auth OK: ${bankName}`);

    // 2. Obtener cuentas y detectar IBANs
    const accounts = await getAccounts(authToken);
    logger.info(`[EnableBanking Callback] ${accounts.length} cuentas obtenidas`);

    // 3. Mapear IBANs a sociedades del Grupo Vidaro
    const ibanToCompany: Map<
      string,
      {
        companyId: string;
        companyName: string;
        banco: string;
        ibans: string[];
      }
    > = new Map();

    for (const account of accounts) {
      const iban = account.iban || '';
      if (!iban) continue;

      const match = await findSociedadByIban(iban);
      if (match) {
        const existing = ibanToCompany.get(match.companyId);
        if (existing) {
          existing.ibans.push(iban);
        } else {
          ibanToCompany.set(match.companyId, {
            ...match,
            ibans: [iban],
          });
        }
      } else {
        logger.info(`[EnableBanking Callback] IBAN ${iban} no reconocido`);
      }
    }

    // Si no se encontraron IBANs del grupo, usar la empresa del state
    if (ibanToCompany.size === 0 && companyId) {
      ibanToCompany.set(companyId, {
        companyId,
        companyName: companyId,
        banco: bankName,
        ibans: accounts.map((a) => a.iban || '').filter(Boolean),
      });
    }

    // 4. Crear/actualizar BankConnection por sociedad
    let connectionsCreated = 0;

    for (const [cId, data] of ibanToCompany.entries()) {
      const uniqueItemId = `eb_${authToken.substring(0, 20)}_${cId}`;

      const existing = await prisma.bankConnection.findFirst({
        where: { companyId: cId, proveedor: 'enablebanking', accessToken: authToken },
        select: { id: true },
      });

      if (existing) {
        await prisma.bankConnection.update({
          where: { id: existing.id },
          data: {
            estado: 'conectado',
            nombreBanco: `${bankName} (${data.ibans.length} cuentas)`,
            ultimaSync: new Date(),
          },
        });
      } else {
        // Verificar si proveedorItemId ya existe
        const existsByItemId = await prisma.bankConnection
          .findFirst({
            where: { proveedorItemId: uniqueItemId },
            select: { id: true },
          })
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

      logger.info(
        `[EnableBanking Callback] ${data.companyName}: ${data.ibans.length} cuentas (${data.ibans.join(', ')})`
      );
    }

    // 5. Marcar pendiente como completado
    if (companyId) {
      await prisma.bankConnection
        .updateMany({
          where: {
            companyId,
            proveedor: 'enablebanking',
            estado: 'renovacion_requerida',
          },
          data: { estado: 'completado' },
        })
        .catch(() => null);
    }

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
      new URL(`${redirectBase}?provider=enablebanking&error=callback_failed`, request.url)
    );
  }
}
