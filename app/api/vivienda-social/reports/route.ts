import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ViviendaSocialService } from '@/lib/services/vivienda-social-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Generar resumen de informes
    const stats = await ViviendaSocialService.getStats(session.user.companyId);
    const applications = await ViviendaSocialService.getApplications(session.user.companyId);
    
    const report = {
      fechaGeneracion: new Date().toISOString(),
      periodo: new Date().toISOString().substring(0, 7),
      resumen: {
        ...stats,
        totalSolicitudes: applications.length,
        solicitudesAprobadas: applications.filter(a => a.estado === 'aprobada').length,
        solicitudesRechazadas: applications.filter(a => a.estado === 'rechazada').length
      },
      porTipoVivienda: {
        VPO: applications.filter(a => a.tipoVivienda === 'VPO').length,
        VPT: applications.filter(a => a.tipoVivienda === 'VPT').length,
        alquiler_social: applications.filter(a => a.tipoVivienda === 'alquiler_social').length,
        emergencia: applications.filter(a => a.tipoVivienda === 'emergencia').length
      }
    };
    
    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
