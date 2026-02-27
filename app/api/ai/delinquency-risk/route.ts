import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/ai/delinquency-risk
 * Scoring de riesgo de morosidad 0-100 por inquilino.
 * Usa TenantBehavior + historial de pagos para calcular score.
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

    // Obtener inquilinos con contratos activos
    const tenants = await prisma.tenant.findMany({
      where: { companyId },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        contracts: {
          where: { estado: 'activo' },
          select: {
            id: true,
            rentaMensual: true,
            fechaInicio: true,
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        },
      },
    });

    const riskScores = [];

    for (const tenant of tenants) {
      if (tenant.contracts.length === 0) continue;

      // Historial de pagos del inquilino
      const payments = await prisma.payment.findMany({
        where: {
          contract: { tenantId: tenant.id },
        },
        select: {
          estado: true,
          fechaVencimiento: true,
          fechaPago: true,
          monto: true,
        },
        orderBy: { fechaVencimiento: 'desc' },
        take: 24, // Últimos 24 meses
      });

      const totalPagos = payments.length;
      if (totalPagos === 0) continue;

      const pagados = payments.filter((p) => p.estado === 'pagado');
      const pendientes = payments.filter((p) => p.estado === 'pendiente');
      const atrasados = payments.filter((p) => p.estado === 'atrasado');

      // Calcular métricas
      const pctPagadosATiempo = totalPagos > 0 ? (pagados.length / totalPagos) * 100 : 50;
      const pctAtrasados = totalPagos > 0 ? (atrasados.length / totalPagos) * 100 : 0;

      // Retrasos medios (días entre vencimiento y pago)
      let diasRetrasoMedio = 0;
      const pagadosConRetraso = pagados.filter((p) => p.fechaPago && p.fechaVencimiento);
      if (pagadosConRetraso.length > 0) {
        const totalDias = pagadosConRetraso.reduce((s, p) => {
          const diff = (new Date(p.fechaPago!).getTime() - new Date(p.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24);
          return s + Math.max(0, diff);
        }, 0);
        diasRetrasoMedio = totalDias / pagadosConRetraso.length;
      }

      // Score de riesgo (0 = sin riesgo, 100 = máximo riesgo)
      let riskScore = 0;

      // Factor 1: % de pagos atrasados (peso 40%)
      riskScore += (pctAtrasados / 100) * 40;

      // Factor 2: Pagos pendientes actuales (peso 30%)
      riskScore += Math.min(pendientes.length * 10, 30);

      // Factor 3: Retraso medio en días (peso 20%)
      riskScore += Math.min(diasRetrasoMedio * 2, 20);

      // Factor 4: Tendencia reciente - últimos 3 meses (peso 10%)
      const recientes = payments.slice(0, 3);
      const recientesAtrasados = recientes.filter((p) => p.estado === 'atrasado' || p.estado === 'pendiente').length;
      riskScore += (recientesAtrasados / 3) * 10;

      riskScore = Math.round(Math.min(riskScore, 100));

      const riskLevel = riskScore >= 70 ? 'alto' : riskScore >= 40 ? 'medio' : 'bajo';
      const contract = tenant.contracts[0];

      riskScores.push({
        tenantId: tenant.id,
        inquilino: tenant.nombreCompleto,
        email: tenant.email,
        edificio: contract?.unit?.building?.nombre || 'Sin edificio',
        unidad: contract?.unit?.numero || '-',
        rentaMensual: contract?.rentaMensual || 0,
        riskScore,
        riskLevel,
        metricas: {
          totalPagos,
          pagadosATiempo: pagados.length,
          atrasados: atrasados.length,
          pendientesActuales: pendientes.length,
          diasRetrasoMedio: Math.round(diasRetrasoMedio * 10) / 10,
          pctPagadosATiempo: Math.round(pctPagadosATiempo * 10) / 10,
        },
        accionSugerida:
          riskScore >= 70
            ? 'Contactar inmediatamente. Considerar garantía adicional o no renovar contrato.'
            : riskScore >= 40
              ? 'Monitorizar. Enviar recordatorios anticipados. Revisar fianza.'
              : 'Sin acción necesaria.',
      });
    }

    // Ordenar por riesgo (mayor primero)
    riskScores.sort((a, b) => b.riskScore - a.riskScore);

    return NextResponse.json({
      success: true,
      resumen: {
        total: riskScores.length,
        alto: riskScores.filter((r) => r.riskLevel === 'alto').length,
        medio: riskScores.filter((r) => r.riskLevel === 'medio').length,
        bajo: riskScores.filter((r) => r.riskLevel === 'bajo').length,
        rentaEnRiesgo: riskScores
          .filter((r) => r.riskLevel === 'alto')
          .reduce((s, r) => s + r.rentaMensual, 0),
      },
      inquilinos: riskScores,
    });
  } catch (error: any) {
    logger.error('[Delinquency Risk]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error calculando riesgo de morosidad' }, { status: 500 });
  }
}
