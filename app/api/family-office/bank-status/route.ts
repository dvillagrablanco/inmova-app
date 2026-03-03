import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { BANK_ENTITIES } from '@/lib/family-office/banking-integrations';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/bank-status
 * Estado de todas las conexiones bancarias del family office.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryCompanyId = searchParams.get('companyId');
    const companyId = (session.user.role === 'super_admin' && queryCompanyId)
      ? queryCompanyId
      : session.user.companyId;

    // Group scope
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { childCompanies: { select: { id: true } } },
    });
    const groupIds = company
      ? [company.id, ...company.childCompanies.map((c: any) => c.id)]
      : [companyId];

    // Cuentas conectadas (todo el grupo)
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: { in: groupIds }, activa: true },
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
        _count: { select: { positions: true, transactions: true } },
      },
    });

    // Mapear entidades disponibles con estado de conexión
    const entidades = BANK_ENTITIES.map((entity) => {
      const connectedAccounts = accounts.filter(
        (a) => a.entidad.toLowerCase().includes(entity.name.toLowerCase().split(' ')[0])
      );
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
          ultimaSync: a.ultimaSync,
        })),
      };
    });

    const totalSaldo = accounts.reduce((s, a) => s + a.saldoActual, 0);
    const totalValor = accounts.reduce((s, a) => s + a.valorMercado, 0);

    return NextResponse.json({
      success: true,
      resumen: {
        entidadesConectadas: entidades.filter((e) => e.connected).length,
        entidadesTotales: BANK_ENTITIES.length,
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
