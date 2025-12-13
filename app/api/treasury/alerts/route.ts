import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  generateFinancialAlerts,
  GenerateFinancialAlertsParams,
} from '@/lib/services/treasury-service-simple';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';


/**
 * @swagger
 * /api/treasury/alerts:
 *   get:
 *     summary: Obtener alertas financieras
 *     tags: [Tesorería]
 *   post:
 *     summary: Generar alertas automáticas
 *     tags: [Tesorería]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const estado = searchParams.get('estado');

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (estado) where.estado = estado;

    const alerts = await prisma.financialAlert.findMany({
      where,
      orderBy: { fechaDeteccion: 'desc' },
    });

    // Agrupar por severidad
    const porSeveridad = {
      critico: alerts.filter((a) => a.severidad === 'critico').length,
      alto: alerts.filter((a) => a.severidad === 'alto').length,
      medio: alerts.filter((a) => a.severidad === 'medio').length,
      bajo: alerts.filter((a) => a.severidad === 'bajo').length,
    };

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        porSeveridad,
        pendientes: alerts.filter((a) => a.estado === 'pendiente').length,
        resueltas: alerts.filter((a) => a.estado === 'resuelto').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === 'generate') {
      // Generar alertas
      const params: GenerateFinancialAlertsParams = {
        companyId: body.companyId,
      };

      const alerts = await generateFinancialAlerts(params);
      return NextResponse.json(alerts, { status: 201 });
    }

    if (body.action === 'resolve') {
      // Resolver alerta
      const alert = await prisma.financialAlert.update({
        where: { id: body.alertId },
        data: {
          estado: 'resuelto',
          fechaResolucion: new Date(),
          accionTomada: body.notas,
        },
      });
      return NextResponse.json(alert);
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar alertas' },
      { status: 500 }
    );
  }
}
