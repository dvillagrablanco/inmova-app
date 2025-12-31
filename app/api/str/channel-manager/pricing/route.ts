export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';

// GET - Obtener pricing dinámico por canal
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    
    if (!listingId) {
      return NextResponse.json({ error: 'listingId requerido' }, { status: 400 });
    }
    
    // Verificar que el listing pertenece a la empresa
    const listing = await prisma.sTRListing.findFirst({
      where: {
        id: listingId,
        companyId: user.companyId,
      },
      select: {
        id: true,
        titulo: true,
        precioPorNoche: true,
        precioSemana: true,
        precioMes: true,
      }
    });
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing no encontrado' }, { status: 404 });
    }
    
    // Obtener pricing por canal
    const channelPricing = await prisma.sTRChannelPricing.findMany({
      where: { listingId },
    });
    
    // Obtener reglas de pricing dinámico
    const dynamicRules = await prisma.sTRDynamicPricingRule.findMany({
      where: { listingId },
      orderBy: { prioridad: 'desc' },
    });
    
    // Obtener pricing por temporada
    const seasonPricing = await prisma.sTRSeasonPricing.findMany({
      where: { listingId, activo: true },
      orderBy: { fechaInicio: 'asc' },
    });
    
    return NextResponse.json({
      listing,
      channelPricing,
      dynamicRules,
      seasonPricing,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST - Crear/actualizar pricing por canal
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    
    const { listingId, canal, ...pricingData } = data;
    
    // Verificar que el listing pertenece a la empresa
    const listing = await prisma.sTRListing.findFirst({
      where: {
        id: listingId,
        companyId: user.companyId,
      },
    });
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing no encontrado' }, { status: 404 });
    }
    
    // Upsert del pricing por canal
    const channelPricing = await prisma.sTRChannelPricing.upsert({
      where: {
        listingId_canal: {
          listingId,
          canal,
        }
      },
      update: pricingData,
      create: {
        listingId,
        canal,
        ...pricingData,
      },
    });
    
    return NextResponse.json(channelPricing, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
