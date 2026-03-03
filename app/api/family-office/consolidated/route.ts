import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return NextResponse.json({
    companies: ['Vidaro Inversiones SL', 'Rovida SLU', 'Viroda SL', 'VIBLA SCR'],
    banks: [
      { name: 'Bankinter', method: 'PSD2 (Nordigen)', status: 'pending_authorization' },
      { name: 'CaixaBank', method: 'PSD2 (Nordigen)', status: 'pending_authorization' },
      { name: 'Inversis', method: 'SWIFT MT940/MT535', status: 'ready_for_import' },
      { name: 'Banca March', method: 'SWIFT MT940/MT535', status: 'ready_for_import' },
      { name: 'CACEIS', method: 'SWIFT MT535', status: 'ready_for_import' },
      { name: 'Pictet', method: 'PDF mensual', status: 'ready_for_import' },
    ],
    importEndpoints: {
      journal: 'POST /api/family-office/import/journal',
      analyticsMapping: 'POST /api/family-office/import/analytics-mapping',
      swift: 'POST /api/family-office/import/swift',
      pictetPdf: 'POST /api/family-office/import/pictet-pdf',
    },
    costCenterCategories: {
      DIR: 'Gastos directos del inmueble',
      CDI: 'Administración imputada al inmueble',
      'DF-GEN': 'Dirección financiera general',
      'DI-COGE': 'Dirección general',
    },
    auxiliar1Rule:
      'Si el campo Auxiliar1 del asiento contable tiene valor, este override la asignación por defecto del mapeo analítico',
  });
}
