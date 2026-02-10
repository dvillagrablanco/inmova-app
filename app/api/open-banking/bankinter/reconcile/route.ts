import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBankinterService, isBankinterConfigured } from '@/lib/bankinter-integration-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/open-banking/bankinter/reconcile
 * 
 * Concilia pagos pendientes con transacciones bancarias de Bankinter
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    if (!isBankinterConfigured()) {
      return NextResponse.json(
        {
          error: 'Integración con Bankinter no configurada'
        },
        { status: 503 }
      );
    }

    const { mesesAtras } = await request.json();

    const bankinterService = getBankinterService();
    // Conciliar pagos
    const resultado = await bankinterService.conciliarPagosBankinter(
      session.user.companyId,
      mesesAtras || 1
    );

    logger.info(
      `🔄 Pagos conciliados: ${resultado.conciliados}/${resultado.total}`
    );

    return NextResponse.json({
      success: true,
      conciliados: resultado.conciliados,
      total: resultado.total,
      message: `${resultado.conciliados} de ${resultado.total} pagos conciliados automáticamente`
    });
  } catch (error: any) {
    logger.error('Error conciliando pagos:', error);
    return NextResponse.json(
      {
        error: 'Error al conciliar pagos',
        details: error.message
      },
      { status: 500 }
    );
  }
}
