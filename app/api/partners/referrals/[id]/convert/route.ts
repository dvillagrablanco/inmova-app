import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/partners/referrals/[id]/convert
 * Mark a referral as converted and generate commission
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      select: { id: true, source: true, sourceDetail: true, estado: true, companyId: true, nombre: true },
    });

    if (!lead || lead.source !== 'partner_referral') {
      return NextResponse.json({ error: 'Referido no encontrado' }, { status: 404 });
    }

    if (lead.estado === 'convertido' || lead.estado === 'cliente') {
      return NextResponse.json({ error: 'Ya está convertido' }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: lead.sourceDetail! },
      select: { id: true, nombre: true, comisionPorcentaje: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const montoBruto = body.montoBruto || 0; // Monthly subscription amount

    // Update lead status
    await prisma.lead.update({
      where: { id: lead.id },
      data: { estado: 'convertido' },
    });

    // Generate commission if amount provided
    let commission = null;
    if (montoBruto > 0) {
      const periodo = new Date().toISOString().substring(0, 7); // YYYY-MM
      commission = await prisma.commission.create({
        data: {
          partnerId: partner.id,
          companyId: lead.companyId,
          periodo,
          montoBruto,
          porcentaje: partner.comisionPorcentaje,
          montoComision: montoBruto * (partner.comisionPorcentaje / 100),
          estado: 'pendiente',
          concepto: `Referido convertido: ${lead.nombre}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Referido convertido. Comisión: ${commission ? commission.montoComision.toFixed(2) + '€' : 'sin importe'}`,
      commission,
    });
  } catch (error: any) {
    logger.error('[Referral Convert]:', error);
    return NextResponse.json({ error: 'Error convirtiendo referido' }, { status: 500 });
  }
}
