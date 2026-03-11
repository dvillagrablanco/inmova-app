import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/v1/leads
 * Public API for partners to create leads from their websites.
 * Requires API key (x-api-key header) or partner code.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const apiKey = request.headers.get('x-api-key');
    const body = await request.json();
    const { partnerCode, nombre, email, telefono, empresa, fuente, notas } = body;

    if (!nombre || !email) {
      return NextResponse.json({ error: 'nombre and email required' }, { status: 400 });
    }

    // Authenticate via API key or partner code
    let companyId: string | null = null;
    let partnerId: string | null = null;
    let source = fuente || 'api_v1';

    if (apiKey) {
      // Find API key
      const key = await prisma.apiKey
        .findFirst({
          where: { key: apiKey, status: 'ACTIVE' },
          select: { companyId: true },
        })
        .catch(() => null);
      if (key) companyId = key.companyId;
    }

    if (partnerCode) {
      const partner = await prisma.partner.findFirst({
        where: { OR: [{ cif: partnerCode }, { dominioPersonalizado: partnerCode }], activo: true },
        select: { id: true, email: true },
      });
      if (partner) {
        partnerId = partner.id;
        source = 'partner_referral';
        // Get company from partner
        const user = await prisma.user.findFirst({
          where: { email: partner.email },
          select: { companyId: true },
        });
        if (user?.companyId) companyId = user.companyId;
      }
    }

    if (!companyId) {
      companyId =
        (
          await prisma.company.findFirst({
            where: { esEmpresaPrueba: false },
            select: { id: true },
          })
        )?.id || null;
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const lead = await prisma.lead.create({
      data: {
        companyId,
        nombre,
        email,
        telefono: telefono || null,
        empresa: empresa || null,
        fuente: source,
        origenDetalle: partnerId,
        notas: notas || null,
        estado: 'nuevo',
      },
    });

    return NextResponse.json(
      {
        success: true,
        leadId: lead.id,
        message: 'Lead created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('[V1 Leads]:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET /api/v1/leads — List leads (requires API key)
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'x-api-key header required' }, { status: 401 });
    }

    const key = await prisma.apiKey
      .findFirst({
        where: { key: apiKey, status: 'ACTIVE' },
        select: { companyId: true },
      })
      .catch(() => null);

    if (!key) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const leads = await prisma.lead.findMany({
      where: { companyId: key.companyId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        empresa: true,
        estado: true,
        fuente: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.lead.count({ where: { companyId: key.companyId } });

    return NextResponse.json({ success: true, data: leads, total, limit, offset });
  } catch (error: any) {
    logger.error('[V1 Leads GET]:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
