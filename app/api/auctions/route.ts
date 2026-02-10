/**
 * API Endpoint: Sistema de Subastas de Propiedades
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createAuctionSchema = z.object({
  unitId: z.string().optional(),
  buildingId: z.string().optional(),
  titulo: z.string().min(5),
  descripcion: z.string(),
  precioInicial: z.number().min(0),
  precioReserva: z.number().min(0).optional(),
  incrementoMinimo: z.number().min(0).default(1000),
  fechaInicio: z.string(),
  fechaFin: z.string(),
  depositoRequerido: z.number().min(0).optional(),
  tipo: z.enum(['venta', 'alquiler']).default('venta'),
  imagenes: z.array(z.string()).default([]),
  documentos: z.array(z.string()).default([]),
});

// Almacenamiento temporal en memoria (en producción sería BD)
let auctionsStore: any[] = [];
const ALLOW_IN_MEMORY = process.env.NODE_ENV !== 'production';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!ALLOW_IN_MEMORY) {
      return NextResponse.json(
        { error: 'Subastas no disponibles en producción' },
        { status: 501 }
      );
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');

    // Filtrar subastas por compañía
    let auctions = auctionsStore.filter(a => a.companyId === companyId);

    // Filtrar por estado
    if (estado) {
      auctions = auctions.filter(a => a.estado === estado);
    }

    // Actualizar estados basado en fechas
    const now = new Date();
    auctions = auctions.map(auction => {
      const fechaInicio = new Date(auction.fechaInicio);
      const fechaFin = new Date(auction.fechaFin);
      
      let estado = auction.estado;
      if (estado !== 'cancelada' && estado !== 'finalizada') {
        if (now < fechaInicio) {
          estado = 'programada';
        } else if (now >= fechaInicio && now <= fechaFin) {
          estado = 'activa';
        } else if (now > fechaFin) {
          estado = 'finalizada';
        }
      }
      
      return { ...auction, estado };
    });

    // Stats
    const stats = {
      total: auctions.length,
      activas: auctions.filter(a => a.estado === 'activa').length,
      programadas: auctions.filter(a => a.estado === 'programada').length,
      finalizadas: auctions.filter(a => a.estado === 'finalizada').length,
      valorTotal: auctions.filter(a => a.estado === 'activa').reduce((sum, a) => sum + (a.pujaActual || a.precioInicial), 0),
    };

    return NextResponse.json({
      success: true,
      data: auctions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching auctions:', error);
    return NextResponse.json({ error: 'Error al obtener subastas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!ALLOW_IN_MEMORY) {
      return NextResponse.json(
        { error: 'Subastas no disponibles en producción' },
        { status: 501 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createAuctionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;

    // Crear subasta
    const auction = {
      id: `auction-${Date.now()}`,
      companyId,
      ...data,
      pujaActual: data.precioInicial,
      numeroPujas: 0,
      participantes: [],
      estado: 'programada',
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    auctionsStore.push(auction);

    logger.info('Auction created', { auctionId: auction.id, companyId });

    return NextResponse.json({
      success: true,
      data: auction,
      message: 'Subasta creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating auction:', error);
    return NextResponse.json({ error: 'Error al crear subasta' }, { status: 500 });
  }
}
