export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET - Obtener reglas de pricing dinámico
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    
    const where: any = {};
    
    if (listingId) {
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
      
      where.listingId = listingId;
    } else {
      // Obtener todas las reglas de listings de la empresa
      where.listing = { companyId: user.companyId };
    }
    
    const rules = await prisma.sTRDynamicPricingRule.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            titulo: true,
          }
        }
      },
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
    });
    
    return NextResponse.json(rules);
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST - Crear nueva regla de pricing dinámico
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const data = await request.json();
    
    const { listingId, ...ruleData } = data;
    
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
    
    const rule = await prisma.sTRDynamicPricingRule.create({
      data: {
        listingId,
        nombre: ruleData.nombre,
        descripcion: ruleData.descripcion,
        prioridad: ruleData.prioridad || 0,
        condiciones: ruleData.condiciones || {},
        accionTipo: ruleData.accionTipo,
        accionValor: ruleData.accionValor,
        aplicarCanales: ruleData.aplicarCanales || [],
        diasSemana: ruleData.diasSemana || [],
        fechaInicio: ruleData.fechaInicio ? new Date(ruleData.fechaInicio) : null,
        fechaFin: ruleData.fechaFin ? new Date(ruleData.fechaFin) : null,
        activo: ruleData.activo ?? true,
      },
    });
    
    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
