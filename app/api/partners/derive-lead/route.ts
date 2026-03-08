import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/partners/derive-lead
 * Partner A derives a lead to Partner B (different region/specialty)
 * Commission is shared between both partners
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { leadId, fromPartnerId, toPartnerId, comisionCompartida } = await request.json();

    if (!leadId || !fromPartnerId || !toPartnerId) {
      return NextResponse.json({ error: 'leadId, fromPartnerId, toPartnerId required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, nombre: true, sourceDetail: true } });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const toPartner = await prisma.partner.findUnique({ where: { id: toPartnerId }, select: { id: true, nombre: true, contactoEmail: true } });
    if (!toPartner) return NextResponse.json({ error: 'Target partner not found' }, { status: 404 });

    // Update lead with derivation info
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        notas: `Derivado de partner ${fromPartnerId} a ${toPartner.nombre}. Comisión compartida: ${comisionCompartida || 50}%`,
        sourceDetail: toPartnerId, // Now belongs to target partner
      },
    });

    // Notify target partner
    try {
      const { sendEmail } = await import('@/lib/email-service');
      await sendEmail({
        to: toPartner.contactoEmail || '',
        subject: 'Nuevo lead derivado',
        html: `<h3>Has recibido un lead derivado</h3><p>Lead: ${lead.nombre}</p><p>Accede a tu panel para ver los detalles.</p>`,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Lead derivado a ${toPartner.nombre}`,
      comisionSplit: { from: 100 - (comisionCompartida || 50), to: comisionCompartida || 50 },
    });
  } catch (error: any) {
    logger.error('[Derive Lead]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
