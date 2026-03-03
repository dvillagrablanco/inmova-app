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

  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');
  const month = searchParams.get('month');
  const cuenta = searchParams.get('cuenta');

  return NextResponse.json({
    message:
      'Para consultar centros de coste, primero importe el fichero de mapeo analítico vía POST /api/family-office/import/analytics-mapping',
    filters: { company, month, cuenta },
    availableCategories: ['DIR', 'CDI', 'DF-GEN', 'DI-COGE'],
    description: {
      DIR: 'Gastos directos del inmueble',
      CDI: 'Administración imputada',
      'DF-GEN': 'Dirección financiera general',
      'DI-COGE': 'Dirección general',
    },
  });
}
