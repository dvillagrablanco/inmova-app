import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/partners/referrals — List referrals for authenticated partner
 * POST /api/partners/referrals — Register a new referral
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const partnerCode = searchParams.get('code');
    const partnerId = searchParams.get('partnerId');

    if (!partnerId && !partnerCode) {
      return NextResponse.json({ error: 'partnerId or code required' }, { status: 400 });
    }

    const partner = partnerId
      ? await prisma.partner.findUnique({ where: { id: partnerId }, select: { id: true, nombre: true } })
      : await prisma.partner.findFirst({ where: { cif: partnerCode! }, select: { id: true, nombre: true } });

    if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

    const referrals = await prisma.lead.findMany({
      where: { fuente: 'partner_referral', origenDetalle: partner.id },
      select: { id: true, nombre: true, email: true, estado: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const stats = {
      total: referrals.length,
      converted: referrals.filter(r => r.estado === 'convertido' || r.estado === 'cliente' || r.estado === 'ganado').length,
      pending: referrals.filter(r => r.estado === 'nuevo' || r.estado === 'contactado' || r.estado === 'calificado').length,
      conversionRate: referrals.length > 0
        ? Math.round(referrals.filter(r => r.estado === 'convertido' || r.estado === 'cliente' || r.estado === 'ganado').length / referrals.length * 100)
        : 0,
    };

    return NextResponse.json({ success: true, referrals, stats, partner: partner.nombre });
  } catch (error: any) {
    logger.error('[Partner Referrals GET]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const body = await request.json();
    const { partnerCode, nombre, email, telefono, empresa, mensaje } = body;

    if (!partnerCode || !nombre || !email) {
      return NextResponse.json({ error: 'partnerCode, nombre y email requeridos' }, { status: 400 });
    }

    // Find partner by code (CIF) or by referral slug
    const partner = await prisma.partner.findFirst({
      where: { OR: [{ cif: partnerCode }, { dominioPersonalizado: partnerCode }] },
      select: { id: true, nombre: true, comisionPorcentaje: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Código de partner no válido' }, { status: 404 });
    }

    // Check duplicate
    const existing = await prisma.lead.findFirst({
      where: { email, fuente: 'partner_referral', origenDetalle: partner.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'Este referido ya está registrado' }, { status: 409 });
    }

    // Find company for the lead (use partner's linked company or first available)
    const partnerFull = await prisma.partner.findUnique({
      where: { id: partner.id },
      select: { email: true },
    });
    const user = partnerFull?.email
      ? await prisma.user.findFirst({ where: { email: partnerFull.email }, select: { companyId: true } })
      : null;
    const companyId = user?.companyId || (await prisma.company.findFirst({ where: { esEmpresaPrueba: false }, select: { id: true } }))?.id;

    if (!companyId) {
      return NextResponse.json({ error: 'No se pudo asignar empresa' }, { status: 500 });
    }

    // Create lead as referral
    const lead = await prisma.lead.create({
      data: {
        companyId,
        nombre,
        email,
        telefono: telefono || null,
        empresa: empresa || null,
        fuente: 'partner_referral',
        origenDetalle: partner.id,
        notas: `Referido por ${partner.nombre}. ${mensaje || ''}`.trim(),
        estado: 'nuevo',
        urgencia: 'media',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Referido registrado. Partner: ${partner.nombre}`,
      leadId: lead.id,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[Partner Referrals POST]:', error);
    return NextResponse.json({ error: 'Error registrando referido' }, { status: 500 });
  }
}
