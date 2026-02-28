import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/ai/predictive-maintenance
 * Analiza historial de incidencias por edificio y detecta patrones:
 * - Averías recurrentes (mismo tipo, mismo edificio)
 * - Edificios con más incidencias de lo normal
 * - Predicción de próximas averías basada en frecuencia
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const companyId = scope.activeCompanyId;
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    // Obtener incidencias de los últimos 6 meses
    const incidents = await prisma.maintenanceRequest.findMany({
      where: {
        unit: { building: { companyId } },
        fechaSolicitud: { gte: sixMonthsAgo },
      },
      include: {
        unit: {
          select: {
            numero: true,
            building: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });

    // Agrupar por edificio
    const byBuilding: Record<string, {
      nombre: string;
      total: number;
      porCategoria: Record<string, number>;
      incidencias: any[];
    }> = {};

    for (const inc of incidents) {
      const edificio = inc.unit?.building?.nombre || 'Sin edificio';
      if (!byBuilding[edificio]) {
        byBuilding[edificio] = { nombre: edificio, total: 0, porCategoria: {}, incidencias: [] };
      }
      byBuilding[edificio].total++;

      const cat = (inc.titulo || '').toLowerCase();
      let categoria = 'otros';
      if (cat.includes('fuga') || cat.includes('agua') || cat.includes('tubería') || cat.includes('fontaner')) {
        categoria = 'fontanería';
      } else if (cat.includes('electric') || cat.includes('luz') || cat.includes('enchufe') || cat.includes('cuadro')) {
        categoria = 'electricidad';
      } else if (cat.includes('caldera') || cat.includes('calefac') || cat.includes('aire') || cat.includes('clima')) {
        categoria = 'climatización';
      } else if (cat.includes('ascensor') || cat.includes('elevador')) {
        categoria = 'ascensor';
      } else if (cat.includes('bomba') || cat.includes('motor') || cat.includes('presión')) {
        categoria = 'bombas/motores';
      } else if (cat.includes('cerradura') || cat.includes('puerta') || cat.includes('ventana')) {
        categoria = 'cerrajería';
      } else if (cat.includes('humedad') || cat.includes('gotera') || cat.includes('filtración')) {
        categoria = 'humedades';
      }

      byBuilding[edificio].porCategoria[categoria] = (byBuilding[edificio].porCategoria[categoria] || 0) + 1;
      byBuilding[edificio].incidencias.push({
        titulo: inc.titulo,
        categoria,
        fecha: inc.fechaSolicitud,
        estado: inc.estado,
        prioridad: inc.prioridad,
      });
    }

    // Generar alertas predictivas
    const alertas: Array<{
      edificio: string;
      categoria: string;
      incidenciasEnPeriodo: number;
      frecuenciaMedia: string;
      prediccion: string;
      prioridad: 'alta' | 'media' | 'baja';
      accion: string;
      costeEstimado?: string;
    }> = [];

    for (const [edificio, data] of Object.entries(byBuilding)) {
      for (const [categoria, count] of Object.entries(data.porCategoria)) {
        if (count >= 3) {
          // Patrón recurrente detectado
          const frecuencia = Math.round(180 / count);

          let costeEstimado = '';
          let accion = '';

          switch (categoria) {
            case 'fontanería':
              costeEstimado = count >= 5 ? '€2.000-5.000 (sustitución tramo)' : '€500-1.500 (reparación)';
              accion = 'Inspección completa de tuberías. Posible sustitución de tramo afectado.';
              break;
            case 'electricidad':
              costeEstimado = '€1.000-3.000 (revisión cuadro)';
              accion = 'Revisión del cuadro eléctrico y cableado. Verificar normativa ITC.';
              break;
            case 'climatización':
              costeEstimado = '€1.500-4.000 (sustitución caldera/split)';
              accion = 'Revisión general del sistema de climatización. Posible sustitución.';
              break;
            case 'bombas/motores':
              costeEstimado = '€2.500-5.000 (sustitución bomba)';
              accion = 'Sustitución preventiva de bomba. Revisión motor y presostato.';
              break;
            case 'ascensor':
              costeEstimado = '€3.000-8.000 (revisión mayor)';
              accion = 'Solicitar revisión extraordinaria a empresa mantenedora.';
              break;
            case 'humedades':
              costeEstimado = '€2.000-10.000 (impermeabilización)';
              accion = 'Diagnóstico de origen de humedades. Impermeabilización si es estructural.';
              break;
            default:
              accion = 'Revisar historial e identificar causa raíz.';
          }

          alertas.push({
            edificio,
            categoria,
            incidenciasEnPeriodo: count,
            frecuenciaMedia: `1 cada ${frecuencia} días`,
            prediccion: `Probable nueva incidencia de ${categoria} en los próximos ${frecuencia} días`,
            prioridad: count >= 5 ? 'alta' : count >= 3 ? 'media' : 'baja',
            accion,
            costeEstimado,
          });
        }
      }
    }

    alertas.sort((a, b) => {
      const p: Record<string, number> = { alta: 0, media: 1, baja: 2 };
      return p[a.prioridad] - p[b.prioridad];
    });

    return NextResponse.json({
      success: true,
      resumen: {
        totalIncidencias6Meses: incidents.length,
        edificiosAnalizados: Object.keys(byBuilding).length,
        patronesDetectados: alertas.length,
        alertasAltas: alertas.filter((a) => a.prioridad === 'alta').length,
      },
      alertas,
      porEdificio: Object.values(byBuilding).map((b) => ({
        edificio: b.nombre,
        total: b.total,
        porCategoria: b.porCategoria,
      })).sort((a, b) => b.total - a.total),
    });
  } catch (error: any) {
    logger.error('[Predictive Maintenance]:', error);
    return NextResponse.json({ error: 'Error en mantenimiento predictivo' }, { status: 500 });
  }
}
