import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateSystemHealthReport } from '@/lib/proactive-detection-service';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const report = await generateSystemHealthReport(companyId);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating system health report:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte de salud del sistema' },
      { status: 500 }
    );
  }
}
