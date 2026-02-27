import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

type EscaladoLevel = 'recordatorio' | 'aviso_formal' | 'requerimiento' | 'derivacion_legal';

interface DelinquencyAlert {
  paymentId: string;
  inquilino: string;
  email: string | null;
  telefono: string | null;
  edificio: string;
  unidad: string;
  importe: number;
  fechaVencimiento: Date;
  diasRetraso: number;
  nivel: EscaladoLevel;
  accionSugerida: string;
}

/**
 * GET /api/payments/delinquency-alerts
 * Alertas de morosidad con escalado automático por días de retraso:
 * - 5 días: recordatorio amable (email)
 * - 15 días: aviso formal (email + SMS)
 * - 30 días: carta requerimiento (PDF)
 * - 60 días: derivación a abogado
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

    const companyFilter =
      scope.scopeCompanyIds.length > 1
        ? { in: scope.scopeCompanyIds }
        : scope.activeCompanyId;

    const today = new Date();

    // Pagos vencidos no pagados
    const overdue = await prisma.payment.findMany({
      where: {
        contract: { unit: { building: { companyId: companyFilter } } },
        estado: { in: ['pendiente', 'atrasado'] },
        fechaVencimiento: { lt: today },
      },
      include: {
        contract: {
          include: {
            tenant: { select: { nombreCompleto: true, email: true, telefono: true } },
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    const alerts: DelinquencyAlert[] = overdue.map((p) => {
      const diasRetraso = differenceInDays(today, p.fechaVencimiento);

      let nivel: EscaladoLevel;
      let accionSugerida: string;

      if (diasRetraso >= 60) {
        nivel = 'derivacion_legal';
        accionSugerida = 'Derivar a abogado para reclamación judicial. Preparar burofax.';
      } else if (diasRetraso >= 30) {
        nivel = 'requerimiento';
        accionSugerida = 'Enviar carta de requerimiento formal con plazo de 10 días.';
      } else if (diasRetraso >= 15) {
        nivel = 'aviso_formal';
        accionSugerida = 'Enviar aviso formal por email y SMS. Contactar por teléfono.';
      } else {
        nivel = 'recordatorio';
        accionSugerida = 'Enviar recordatorio amable por email.';
      }

      return {
        paymentId: p.id,
        inquilino: p.contract?.tenant?.nombreCompleto || 'Sin nombre',
        email: p.contract?.tenant?.email || null,
        telefono: p.contract?.tenant?.telefono || null,
        edificio: p.contract?.unit?.building?.nombre || 'Sin edificio',
        unidad: p.contract?.unit?.numero || '-',
        importe: p.monto,
        fechaVencimiento: p.fechaVencimiento,
        diasRetraso,
        nivel,
        accionSugerida,
      };
    });

    // Resumen por nivel
    const resumen = {
      total: alerts.length,
      importeTotal: alerts.reduce((s, a) => s + a.importe, 0),
      porNivel: {
        recordatorio: alerts.filter((a) => a.nivel === 'recordatorio'),
        aviso_formal: alerts.filter((a) => a.nivel === 'aviso_formal'),
        requerimiento: alerts.filter((a) => a.nivel === 'requerimiento'),
        derivacion_legal: alerts.filter((a) => a.nivel === 'derivacion_legal'),
      },
      counts: {
        recordatorio: alerts.filter((a) => a.nivel === 'recordatorio').length,
        aviso_formal: alerts.filter((a) => a.nivel === 'aviso_formal').length,
        requerimiento: alerts.filter((a) => a.nivel === 'requerimiento').length,
        derivacion_legal: alerts.filter((a) => a.nivel === 'derivacion_legal').length,
      },
    };

    return NextResponse.json({ success: true, resumen, alerts });
  } catch (error: any) {
    logger.error('[Delinquency Alerts]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error generando alertas de morosidad' }, { status: 500 });
  }
}
