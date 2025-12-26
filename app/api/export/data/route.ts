import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { exportData } from '@/lib/backup-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { model, format = 'json', filters, startDate, endDate } = await req.json();
    const companyId = (session.user as any).companyId;

    if (!model) {
      return NextResponse.json({ error: 'Modelo requerido' }, { status: 400 });
    }

    const result = await exportData({
      companyId,
      model,
      format,
      filters,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    if (format === 'csv' && typeof result === 'string') {
      return new NextResponse(result, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${model}_export.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos', details: error.message },
      { status: 500 }
    );
  }
}
