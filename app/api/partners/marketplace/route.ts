import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/partners/marketplace — List services offered by partners
 * POST /api/partners/marketplace — Partner publishes a service
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const partners = await prisma.partner.findMany({
      where: { activo: true, estado: 'ACTIVE' },
      select: {
        id: true, nombre: true, razonSocial: true, tipo: true, logo: true,
        contactoEmail: true, contactoNombre: true, comisionPorcentaje: true,
        config: true, dominioPersonalizado: true,
      },
      orderBy: { nombre: 'asc' },
    });

    // Parse services from config JSON
    const services = partners.flatMap(p => {
      const cfg = (p.config as any) || {};
      const svcs = cfg.servicios || [];
      return svcs.map((s: any) => ({
        id: `${p.id}-${s.id || s.nombre}`,
        partnerId: p.id,
        partnerName: p.nombre,
        partnerLogo: p.logo,
        nombre: s.nombre,
        descripcion: s.descripcion,
        categoria: s.categoria || p.tipo,
        precio: s.precio || null,
        precioDesde: s.precioDesde || null,
        comisionInmova: s.comisionInmova || 10,
      }));
    });

    return NextResponse.json({ success: true, services, partnersCount: partners.length });
  } catch (error: any) {
    logger.error('[Partner Marketplace]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const body = await request.json();
    const { partnerId, servicio } = body;

    if (!partnerId || !servicio?.nombre) {
      return NextResponse.json({ error: 'partnerId y servicio.nombre requeridos' }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({ where: { id: partnerId }, select: { id: true, config: true } });
    if (!partner) return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });

    const cfg = (partner.config as any) || {};
    const servicios = cfg.servicios || [];
    servicios.push({ ...servicio, id: `svc-${Date.now()}`, createdAt: new Date().toISOString() });

    await prisma.partner.update({
      where: { id: partnerId },
      data: { config: { ...cfg, servicios } },
    });

    return NextResponse.json({ success: true, message: 'Servicio publicado' }, { status: 201 });
  } catch (error: any) {
    logger.error('[Partner Marketplace POST]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
