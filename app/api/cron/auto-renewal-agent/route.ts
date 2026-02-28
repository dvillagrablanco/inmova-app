import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api-auth-guard';
import logger from '@/lib/logger';
import { addDays, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/cron/auto-renewal-agent
 * Agente IA de auto-renovación: 90 días antes del vencimiento analiza cada contrato:
 * - Historial de pago del inquilino → score
 * - IPC actual → nuevo importe
 * - Renta vs mercado (media edificio)
 * → Decide: renovar con IPC, proponer incremento extra, o no renovar
 * → Genera propuesta automática
 */
export async function GET(request: NextRequest) {
  const cronAuth = requireCronSecret(request);
  if (!cronAuth.authenticated) return cronAuth.response;

  const prisma = await getPrisma();

  try {
    const today = new Date();
    const in90days = addDays(today, 90);
    const in30days = addDays(today, 30);

    const companies = await prisma.company.findMany({
      where: { activo: true, esEmpresaPrueba: false },
      select: { id: true, nombre: true },
    });

    const proposals: Array<{
      company: string;
      inquilino: string;
      edificio: string;
      unidad: string;
      diasHastaVencimiento: number;
      rentaActual: number;
      decision: 'renovar_ipc' | 'renovar_incremento' | 'no_renovar' | 'revisar_manual';
      nuevaRenta: number;
      motivo: string;
      scoreInquilino: number;
    }> = [];

    for (const company of companies) {
      // Contratos que vencen en 30-90 días
      const expiringContracts = await prisma.contract.findMany({
        where: {
          estado: 'activo',
          fechaFin: { gte: in30days, lte: in90days },
          unit: { building: { companyId: company.id } },
        },
        include: {
          tenant: { select: { id: true, nombreCompleto: true } },
          unit: {
            select: {
              id: true,
              numero: true,
              tipo: true,
              rentaMensual: true,
              superficie: true,
              superficieUtil: true,
              building: { select: { nombre: true, id: true } },
            },
          },
        },
      });

      for (const contract of expiringContracts) {
        const diasHasta = differenceInDays(contract.fechaFin, today);
        const tenantId = contract.tenant?.id;

        // 1. Analizar historial de pagos
        let scoreInquilino = 75; // Default
        if (tenantId) {
          const payments = await prisma.payment.findMany({
            where: { contract: { tenantId } },
            select: { estado: true },
            take: 12,
          });
          const total = payments.length;
          if (total > 0) {
            const pagados = payments.filter((p) => p.estado === 'pagado').length;
            const atrasados = payments.filter((p) => p.estado === 'atrasado').length;
            scoreInquilino = Math.round((pagados / total) * 100 - atrasados * 5);
            scoreInquilino = Math.max(0, Math.min(100, scoreInquilino));
          }
        }

        // 2. Calcular media del edificio para comparar renta
        const buildingUnits = await prisma.unit.findMany({
          where: {
            buildingId: contract.unit?.building?.id,
            estado: 'ocupada',
            rentaMensual: { gt: 0 },
            tipo: contract.unit?.tipo,
          },
          select: { rentaMensual: true, superficie: true, superficieUtil: true },
        });

        const mediaEdificio = buildingUnits.length > 0
          ? buildingUnits.reduce((s, u) => s + u.rentaMensual, 0) / buildingUnits.length
          : contract.rentaMensual;

        const pctVsMedia = mediaEdificio > 0
          ? ((contract.rentaMensual - mediaEdificio) / mediaEdificio) * 100
          : 0;

        // 3. Decidir
        const ipcPct = 2.8; // IPC estimado
        const rentaConIPC = Math.round(contract.rentaMensual * (1 + ipcPct / 100) * 100) / 100;

        let decision: typeof proposals[0]['decision'];
        let nuevaRenta: number;
        let motivo: string;

        if (scoreInquilino < 40) {
          decision = 'no_renovar';
          nuevaRenta = contract.rentaMensual;
          motivo = `Score inquilino bajo (${scoreInquilino}/100). Historial de impagos. No renovar.`;
        } else if (pctVsMedia < -15 && scoreInquilino >= 60) {
          // Renta muy por debajo de mercado → incremento extra
          const rentaObjetivo = Math.round(mediaEdificio * 0.95 * 100) / 100;
          decision = 'renovar_incremento';
          nuevaRenta = Math.max(rentaConIPC, rentaObjetivo);
          motivo = `Renta ${Math.abs(Math.round(pctVsMedia))}% bajo media edificio. Proponer ${nuevaRenta}€ (media: ${Math.round(mediaEdificio)}€).`;
        } else if (scoreInquilino >= 60) {
          decision = 'renovar_ipc';
          nuevaRenta = rentaConIPC;
          motivo = `Buen inquilino (score ${scoreInquilino}). Renovar con IPC ${ipcPct}%.`;
        } else {
          decision = 'revisar_manual';
          nuevaRenta = rentaConIPC;
          motivo = `Score medio (${scoreInquilino}). Revisar manualmente antes de renovar.`;
        }

        proposals.push({
          company: company.nombre,
          inquilino: contract.tenant?.nombreCompleto || 'Sin nombre',
          edificio: contract.unit?.building?.nombre || '',
          unidad: contract.unit?.numero || '',
          diasHastaVencimiento: diasHasta,
          rentaActual: contract.rentaMensual,
          decision,
          nuevaRenta,
          motivo,
          scoreInquilino,
        });
      }
    }

    proposals.sort((a, b) => a.diasHastaVencimiento - b.diasHastaVencimiento);

    logger.info(`[Auto-Renewal Agent] ${proposals.length} propuestas generadas`);

    return NextResponse.json({
      success: true,
      resumen: {
        total: proposals.length,
        renovar_ipc: proposals.filter((p) => p.decision === 'renovar_ipc').length,
        renovar_incremento: proposals.filter((p) => p.decision === 'renovar_incremento').length,
        no_renovar: proposals.filter((p) => p.decision === 'no_renovar').length,
        revisar_manual: proposals.filter((p) => p.decision === 'revisar_manual').length,
      },
      propuestas: proposals,
    });
  } catch (error: any) {
    logger.error('[Auto-Renewal Agent]:', error);
    return NextResponse.json({ error: 'Error en agente de renovación' }, { status: 500 });
  }
}
