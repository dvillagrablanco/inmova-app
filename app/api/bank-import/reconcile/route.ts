import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/bank-import/reconcile
 * 
 * Concilia automáticamente transacciones bancarias importadas (N43 u otras)
 * con pagos pendientes de alquiler/room rental de la sociedad.
 * 
 * Lógica de matching:
 * 1. Busca transacciones de tipo 'ingreso' en estado 'pendiente_revision'
 * 2. Para cada una, busca pagos pendientes que coincidan en:
 *    - Monto (tolerancia 1%)
 *    - Fecha (ventana de ±10 días)
 *    - Opcionalmente: nombre del inquilino en la descripción
 * 3. Si hay match, marca el pago como 'pagado' y la transacción como 'conciliado'
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    // Obtener transacciones pendientes de revisión (ingresos = cobros potenciales)
    const pendingTransactions = await prisma.bankTransaction.findMany({
      where: {
        companyId,
        estado: 'pendiente_revision',
        monto: { gt: 0 }, // Solo ingresos
      },
      orderBy: { fecha: 'desc' },
      take: 500, // Límite por batch
    });

    if (pendingTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        conciliados: 0,
        sugerencias: 0,
        total: 0,
        message: 'No hay transacciones pendientes de conciliar',
      });
    }

    // Obtener pagos pendientes de la empresa
    const pendingPayments = await prisma.payment.findMany({
      where: {
        contract: {
          unit: {
            building: {
              companyId,
            },
          },
        },
        estado: 'pendiente',
      },
      include: {
        contract: {
          include: {
            tenant: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true,
              },
            },
            unit: {
              select: {
                numero: true,
                building: {
                  select: { nombre: true },
                },
              },
            },
          },
        },
      },
    });

    let conciliados = 0;
    let sugerencias = 0;
    const matches: Array<{
      transactionId: string;
      paymentId: string;
      monto: number;
      inquilino: string;
      score: number;
      auto: boolean;
    }> = [];

    // Para cada transacción, buscar matching con pagos
    for (const tx of pendingTransactions) {
      let bestMatch: typeof pendingPayments[0] | null = null;
      let bestScore = 0;

      for (const pago of pendingPayments) {
        // Ya conciliado en esta iteración? Skip
        if (matches.some(m => m.paymentId === pago.id)) continue;

        let score = 0;

        // 1. Matching por monto (peso: 50)
        const montoTolerance = pago.monto * 0.01; // 1% tolerancia
        if (Math.abs(tx.monto - pago.monto) <= montoTolerance) {
          score += 50;
        } else if (Math.abs(tx.monto - pago.monto) <= pago.monto * 0.05) {
          score += 25; // 5% tolerancia = match parcial
        } else {
          continue; // Si el monto no coincide ni de lejos, skip
        }

        // 2. Matching por fecha (peso: 25)
        const txDate = new Date(tx.fecha).getTime();
        const payDate = new Date(pago.fechaVencimiento).getTime();
        const daysDiff = Math.abs(txDate - payDate) / (1000 * 60 * 60 * 24);

        if (daysDiff <= 3) {
          score += 25;
        } else if (daysDiff <= 7) {
          score += 15;
        } else if (daysDiff <= 15) {
          score += 5;
        }

        // 3. Matching por nombre del inquilino en descripción (peso: 25)
        const tenantName = pago.contract.tenant.nombreCompleto?.toLowerCase() || '';
        const txDesc = (tx.descripcion + ' ' + (tx.beneficiario || '')).toLowerCase();

        if (tenantName && txDesc.includes(tenantName)) {
          score += 25;
        } else if (tenantName) {
          // Matching parcial: nombre o apellido
          const parts = tenantName.split(' ').filter(p => p.length > 2);
          const partialMatch = parts.some(part => txDesc.includes(part));
          if (partialMatch) {
            score += 10;
          }
        }

        // 4. Matching por referencia/concepto (peso bonus: +10)
        const periodo = pago.periodo || '';
        if (periodo && tx.descripcion.toLowerCase().includes(periodo.toLowerCase())) {
          score += 10;
        }
        const unitRef = pago.contract.unit?.numero || '';
        if (unitRef && tx.descripcion.includes(unitRef)) {
          score += 5;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = pago;
        }
      }

      if (bestMatch && bestScore >= 70) {
        // Auto-conciliar si score >= 70
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: bestMatch.id },
            data: {
              estado: 'pagado',
              fechaPago: tx.fecha,
              metodoPago: 'transferencia_bancaria',
            },
          }),
          prisma.bankTransaction.update({
            where: { id: tx.id },
            data: {
              estado: 'conciliado',
              paymentId: bestMatch.id,
              matchScore: bestScore,
              conciliadoEn: new Date(),
              conciliadoPor: 'auto_n43',
              notasConciliacion: `Conciliación automática (score: ${bestScore}). Inquilino: ${bestMatch.contract.tenant.nombreCompleto}`,
            },
          }),
        ]);

        matches.push({
          transactionId: tx.id,
          paymentId: bestMatch.id,
          monto: tx.monto,
          inquilino: bestMatch.contract.tenant.nombreCompleto || 'Desconocido',
          score: bestScore,
          auto: true,
        });
        conciliados++;
      } else if (bestMatch && bestScore >= 40) {
        // Sugerencia (no auto-conciliar, pero guardar como sugerencia)
        await prisma.bankTransaction.update({
          where: { id: tx.id },
          data: {
            matchScore: bestScore,
            matchSuggestions: {
              paymentId: bestMatch.id,
              score: bestScore,
              inquilino: bestMatch.contract.tenant.nombreCompleto,
              montoPago: bestMatch.monto,
              fechaPago: bestMatch.fechaVencimiento,
            },
          },
        });

        matches.push({
          transactionId: tx.id,
          paymentId: bestMatch.id,
          monto: tx.monto,
          inquilino: bestMatch.contract.tenant.nombreCompleto || 'Desconocido',
          score: bestScore,
          auto: false,
        });
        sugerencias++;
      }
    }

    logger.info(
      `🔄 Conciliación N43: ${conciliados} auto-conciliados, ${sugerencias} sugerencias, de ${pendingTransactions.length} transacciones`
    );

    return NextResponse.json({
      success: true,
      conciliados,
      sugerencias,
      total: pendingTransactions.length,
      matches,
      message: `${conciliados} pagos conciliados automáticamente${sugerencias > 0 ? `, ${sugerencias} sugerencias pendientes de revisión` : ''}`,
    });
  } catch (error: any) {
    logger.error('Error en conciliación:', error);
    return NextResponse.json(
      { error: 'Error al conciliar', details: error.message },
      { status: 500 }
    );
  }
}
