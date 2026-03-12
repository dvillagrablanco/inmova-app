import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { BANK_ENTITIES } from '@/lib/family-office/banking-integrations';
import { resolveFamilyOfficeScope } from '@/lib/family-office-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

function normalizeEntityName(value: string | null | undefined): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getConfiguredEntity(account: {
  entidad: string;
  apiConfig?: Record<string, unknown> | null;
}) {
  const normalizedEntity = normalizeEntityName(account.entidad);
  const apiConfig = (account.apiConfig as Record<string, unknown> | null) || null;
  const apiEntityId = typeof apiConfig?.entityId === 'string' ? apiConfig.entityId : null;
  const nordigenName =
    typeof apiConfig?.nordigenName === 'string'
      ? normalizeEntityName(apiConfig.nordigenName)
      : null;

  return BANK_ENTITIES.find((entity) => {
    const normalizedCatalogName = normalizeEntityName(entity.name);

    return (
      apiEntityId === entity.id ||
      normalizedEntity === normalizedCatalogName ||
      normalizedEntity.includes(normalizedCatalogName) ||
      normalizedCatalogName.includes(normalizedEntity) ||
      (!!nordigenName &&
        (nordigenName === normalizedCatalogName || nordigenName.includes(normalizedCatalogName)))
    );
  });
}

/**
 * GET /api/family-office/bank-status
 * Estado de todas las conexiones bancarias del family office.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveFamilyOfficeScope(request, {
      id: session.user.id,
      role: session.user.role,
      companyId: session.user.companyId,
    });

    // Cuentas conectadas (todo el grupo)
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: { in: scope.groupCompanyIds }, activa: true },
      select: {
        id: true,
        entidad: true,
        tipoEntidad: true,
        numeroCuenta: true,
        alias: true,
        divisa: true,
        saldoActual: true,
        valorMercado: true,
        conexionTipo: true,
        ultimaSync: true,
        apiConfig: true,
        _count: { select: { positions: true, transactions: true } },
      },
    });

    const connectedAccountsByEntityId = new Map<string, typeof accounts>();
    const dynamicEntityMap = new Map<
      string,
      {
        id: string;
        name: string;
        country: string;
        type: string;
        integrationLevel: string;
        capabilities: string[];
        notes: string;
        connected: boolean;
        accounts: Array<{
          id: string;
          alias: string | null;
          saldo: number;
          valorMercado: number;
          posiciones: number;
          movimientos: number;
          ultimaSync: string | null;
        }>;
      }
    >();

    for (const account of accounts) {
      const configuredEntity = getConfiguredEntity(account);
      const mappedAccount = {
        id: account.id,
        alias: account.alias,
        saldo: account.saldoActual,
        valorMercado: account.valorMercado,
        posiciones: account._count.positions,
        movimientos: account._count.transactions,
        ultimaSync: account.ultimaSync ? account.ultimaSync.toISOString() : null,
      };

      if (configuredEntity) {
        const existing = connectedAccountsByEntityId.get(configuredEntity.id) || [];
        existing.push(account);
        connectedAccountsByEntityId.set(configuredEntity.id, existing);
        continue;
      }

      const dynamicKey = normalizeEntityName(account.alias || account.entidad || account.id);
      const existingDynamic = dynamicEntityMap.get(dynamicKey) || {
        id: `dynamic:${dynamicKey}`,
        name: account.entidad || account.alias || 'Entidad manual',
        country: account.divisa === 'CHF' ? 'CH' : 'N/A',
        type: account.tipoEntidad || 'otro_financiero',
        integrationLevel: account.conexionTipo || 'manual',
        capabilities: [
          'saldos',
          ...(account._count.transactions > 0 ? ['movimientos'] : []),
          ...(account._count.positions > 0 ? ['posiciones'] : []),
        ],
        notes: 'Entidad detectada desde cuentas financieras reales.',
        connected: true,
        accounts: [],
      };

      existingDynamic.accounts.push(mappedAccount);
      dynamicEntityMap.set(dynamicKey, existingDynamic);
    }

    // Mapear entidades disponibles con estado de conexión
    const configuredEntities = BANK_ENTITIES.map((entity) => {
      const connectedAccounts = connectedAccountsByEntityId.get(entity.id) || [];
      return {
        ...entity,
        connected: connectedAccounts.length > 0,
        accounts: connectedAccounts.map((a) => ({
          id: a.id,
          alias: a.alias,
          saldo: a.saldoActual,
          valorMercado: a.valorMercado,
          posiciones: a._count.positions,
          movimientos: a._count.transactions,
          ultimaSync: a.ultimaSync ? a.ultimaSync.toISOString() : null,
        })),
      };
    });

    const dynamicEntities = Array.from(dynamicEntityMap.values());
    const entidades = [...configuredEntities, ...dynamicEntities].sort((a, b) => {
      if (a.connected !== b.connected) {
        return a.connected ? -1 : 1;
      }

      return a.name.localeCompare(b.name, 'es');
    });

    const totalSaldo = accounts.reduce((s, a) => s + a.saldoActual, 0);
    const totalValor = accounts.reduce((s, a) => s + a.valorMercado, 0);

    return NextResponse.json({
      success: true,
      resumen: {
        entidadesConectadas: entidades.filter((e) => e.connected).length,
        entidadesTotales: entidades.length,
        cuentasTotales: accounts.length,
        saldoTotal: Math.round(totalSaldo * 100) / 100,
        valorMercadoTotal: Math.round(totalValor * 100) / 100,
      },
      entidades,
    });
  } catch (error: any) {
    logger.error('[Bank Status]:', error);
    return NextResponse.json({ error: 'Error obteniendo estado bancario' }, { status: 500 });
  }
}
