export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { z } from 'zod';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = session.user.companyId;

    const [strategy, listingStats] = await Promise.all([
      prisma.pricingStrategy.findFirst({
        where: { companyId, nombre: 'STR_DEFAULT' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sTRListing.aggregate({
        where: { companyId },
        _min: { precioPorNoche: true },
        _max: { precioPorNoche: true },
      }),
    ]);

    const restricciones =
      strategy?.restricciones && typeof strategy.restricciones === 'object'
        ? (strategy.restricciones as Record<string, unknown>)
        : {};

    const minPrice =
      typeof restricciones.minPrice === 'number'
        ? restricciones.minPrice
        : listingStats._min.precioPorNoche ?? 0;

    const maxPrice =
      typeof restricciones.maxPrice === 'number'
        ? restricciones.maxPrice
        : listingStats._max.precioPorNoche ?? 0;

    return NextResponse.json({
      autoPricingEnabled: strategy?.ajusteAutomatico ?? false,
      minPrice,
      maxPrice,
      strategy: strategy?.tipo || null,
    });
  } catch (error) {
    logger.error('Error fetching pricing settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const schema = z.object({
      autoPricingEnabled: z.boolean().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      strategy: z.string().optional(),
    });

    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const companyId = session.user.companyId;
    const existing = await prisma.pricingStrategy.findFirst({
      where: { companyId, nombre: 'STR_DEFAULT' },
      orderBy: { createdAt: 'desc' },
    });

    const restricciones = {
      minPrice: parsed.data.minPrice,
      maxPrice: parsed.data.maxPrice,
    };

    if (existing) {
      await prisma.pricingStrategy.update({
        where: { id: existing.id },
        data: {
          ajusteAutomatico: parsed.data.autoPricingEnabled ?? existing.ajusteAutomatico,
          tipo: parsed.data.strategy ?? existing.tipo,
          restricciones,
        },
      });
    } else {
      await prisma.pricingStrategy.create({
        data: {
          companyId,
          nombre: 'STR_DEFAULT',
          descripcion: 'Configuración de pricing STR',
          tipo: parsed.data.strategy ?? 'balanced',
          ajusteAutomatico: parsed.data.autoPricingEnabled ?? false,
          limitePorcentaje: 0,
          frecuencia: 'semanal',
          reglas: {},
          restricciones,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Configuración actualizada' 
    });
  } catch (error) {
    logger.error('Error updating pricing settings:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
