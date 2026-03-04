import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import { addYears, addMonths, startOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/contracts/[id]/renew
 * Renueva un contrato extendiendo su duración y generando nuevos pagos.
 * Body: { durationMonths?: number, ipcPct?: number, dryRun?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const contractId = params.id;

    // Get current contract
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        unit: { building: { companyId: scope.activeCompanyId } },
      },
      include: {
        tenant: { select: { nombreCompleto: true } },
        unit: { select: { numero: true, building: { select: { nombre: true } } } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Parse body
    let durationMonths = 12;
    let ipcPct = 0;
    let dryRun = true;
    try {
      const body = await request.json();
      if (body.durationMonths) durationMonths = Math.min(Math.max(body.durationMonths, 1), 60);
      if (typeof body.ipcPct === 'number') ipcPct = body.ipcPct;
      if (typeof body.dryRun === 'boolean') dryRun = body.dryRun;
    } catch {
      // Use defaults
    }

    // Calculate new dates and rent
    const newStart = contract.fechaFin ? new Date(contract.fechaFin) : new Date();
    const newEnd = addMonths(newStart, durationMonths);
    const currentRent = Number(contract.rentaMensual) || 0;
    const newRent = ipcPct > 0 ? Math.round(currentRent * (1 + ipcPct / 100) * 100) / 100 : currentRent;

    const preview = {
      contractId: contract.id,
      inquilino: contract.tenant?.nombreCompleto,
      unidad: `${contract.unit?.building?.nombre} - ${contract.unit?.numero}`,
      fechaInicioNueva: newStart.toISOString(),
      fechaFinNueva: newEnd.toISOString(),
      duracionMeses: durationMonths,
      rentaActual: currentRent,
      ipcAplicado: ipcPct,
      nuevaRenta: newRent,
      incremento: newRent - currentRent,
      pagosAGenerar: durationMonths,
    };

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        preview,
        message: 'Vista previa de renovación. Envía dryRun=false para confirmar.',
      });
    }

    // Execute renewal
    const renewed = await prisma.$transaction(async (tx) => {
      // Update existing contract end date and rent
      const updatedContract = await tx.contract.update({
        where: { id: contractId },
        data: {
          fechaFin: newEnd,
          rentaMensual: newRent,
          estado: 'activo',
        },
      });

      // Generate payments for the new period
      const payments = [];
      for (let i = 0; i < durationMonths; i++) {
        const paymentMonth = addMonths(newStart, i);
        const fechaVencimiento = startOfMonth(addMonths(paymentMonth, 1)); // 1st of next month
        const mesLabel = paymentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const periodo = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

        payments.push({
          contractId: contractId,
          periodo,
          monto: newRent,
          fechaVencimiento,
          estado: 'pendiente' as const,
        });
      }

      const createdPayments = await tx.payment.createMany({ data: payments });

      return { contract: updatedContract, paymentsCreated: createdPayments.count };
    });

    logger.info('[Contract] Renewed', {
      contractId,
      companyId: scope.activeCompanyId,
      durationMonths,
      ipcPct,
      newRent,
      paymentsCreated: renewed.paymentsCreated,
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      preview,
      paymentsCreated: renewed.paymentsCreated,
      message: `Contrato renovado ${durationMonths} meses con ${renewed.paymentsCreated} pagos generados.`,
    });
  } catch (error: any) {
    logger.error('[Contract Renew Error]:', error);
    return NextResponse.json({ error: 'Error al renovar contrato' }, { status: 500 });
  }
}
