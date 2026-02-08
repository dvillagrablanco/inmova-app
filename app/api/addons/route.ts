import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/addons
 * Lista los add-ons disponibles
 *
 * Query params:
 * - categoria: filtrar por categoría (usage, feature, premium)
 * - plan: filtrar por plan disponible (STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE)
 * - vertical: filtrar por producto (inmova, ewoorker, all)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const plan = searchParams.get('plan');
    const vertical = searchParams.get('vertical') || 'all'; // inmova, ewoorker, all

    // Lazy load Prisma
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Construir filtros
    const where: any = { activo: true };
    if (categoria) {
      where.categoria = categoria;
    }

    // Filtro por vertical
    if (vertical && vertical !== 'all') {
      where.vertical = vertical;
    }

    // Obtener add-ons
    let addons = await prisma.addOn.findMany({
      where,
      orderBy: [{ destacado: 'desc' }, { orden: 'asc' }],
    });

    // Filtrar por plan si se especifica
    if (plan) {
      addons = addons.filter((addon: any) => {
        const disponiblePara = addon.disponiblePara as string[];
        const incluidoEn = (addon.incluidoEn as string[]) || [];
        return disponiblePara.includes(plan) || incluidoEn.includes(plan);
      });
    }

    // Formatear respuesta
    const formattedAddons = addons.map((addon: any) => ({
      id: addon.id,
      codigo: addon.codigo,
      nombre: addon.nombre,
      descripcion: addon.descripcion,
      categoria: addon.categoria,
      vertical: addon.vertical || 'inmova', // inmova o ewoorker
      precio: {
        mensual: addon.precioMensual,
        anual: addon.precioAnual,
      },
      precioMensual: addon.precioMensual,
      precioAnual: addon.precioAnual,
      unidades: addon.unidades,
      tipoUnidad: addon.tipoUnidad,
      disponiblePara: addon.disponiblePara,
      incluidoEn: addon.incluidoEn,
      destacado: addon.destacado,
      activo: addon.activo,
      orden: addon.orden,
      // Costos y márgenes
      costoUnitario: addon.costoUnitario,
      margenPorcentaje: addon.margenPorcentaje,
      stripe: {
        productId: addon.stripeProductId,
        priceIdMonthly: addon.stripePriceIdMonthly,
        priceIdAnnual: addon.stripePriceIdAnnual,
        synced: !!addon.stripeProductId,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedAddons,
      total: formattedAddons.length,
    });
  } catch (error: any) {
    logger.error('[Add-ons API Error]:', error);

    // Fallback: retornar add-ons desde config si BD falla
    const { ADD_ONS } = await import('@/lib/pricing-config');

    const fallbackAddons = Object.values(ADD_ONS).map((addon: any) => ({
      id: addon.id,
      codigo: addon.id,
      nombre: addon.name,
      descripcion: addon.description,
      categoria: addon.category || 'feature',
      precio: {
        mensual: addon.monthlyPrice,
        anual: addon.annualPrice || addon.monthlyPrice * 10,
      },
      disponiblePara: addon.availableFor,
      incluidoEn: addon.includedIn,
      destacado: addon.highlighted || false,
      stripe: { synced: false },
    }));

    return NextResponse.json({
      success: true,
      data: fallbackAddons,
      total: fallbackAddons.length,
      source: 'config-fallback',
    });
  }
}

/**
 * POST /api/addons
 * Crear un nuevo add-on (solo admin)
 * Sincroniza automáticamente con Stripe
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validación
    const schema = z.object({
      codigo: z.string().min(3).max(50),
      nombre: z.string().min(3).max(100),
      descripcion: z.string().min(10),
      categoria: z.enum(['usage', 'feature', 'premium']),
      precioMensual: z.number().min(0),
      precioAnual: z.number().min(0).optional(),
      unidades: z.number().optional(),
      tipoUnidad: z.string().optional(),
      disponiblePara: z.array(z.string()),
      incluidoEn: z.array(z.string()).optional(),
      margenPorcentaje: z.number().min(0).max(100).optional(),
      costoUnitario: z.number().min(0).optional(),
      destacado: z.boolean().optional(),
      syncWithStripe: z.boolean().optional().default(true),
    });

    const validated = schema.parse(body);

    // Lazy load Prisma
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Crear add-on
    const addon = await prisma.addOn.create({
      data: {
        codigo: validated.codigo,
        nombre: validated.nombre,
        descripcion: validated.descripcion,
        categoria: validated.categoria,
        precioMensual: validated.precioMensual,
        precioAnual: validated.precioAnual,
        unidades: validated.unidades,
        tipoUnidad: validated.tipoUnidad,
        disponiblePara: validated.disponiblePara,
        incluidoEn: validated.incluidoEn || [],
        margenPorcentaje: validated.margenPorcentaje,
        costoUnitario: validated.costoUnitario,
        destacado: validated.destacado || false,
        activo: true,
      },
    });

    // Sincronizar con Stripe si está habilitado
    let stripeSync = { synced: false, error: null as string | null };

    if (validated.syncWithStripe !== false) {
      try {
        const { syncAddOnToStripe } = await import('@/lib/stripe-subscription-service');

        const stripeIds = await syncAddOnToStripe({
          id: addon.id,
          codigo: addon.codigo,
          nombre: addon.nombre,
          descripcion: addon.descripcion,
          precioMensual: addon.precioMensual,
          precioAnual: addon.precioAnual || undefined,
          categoria: addon.categoria,
        });

        if (stripeIds) {
          // Actualizar con IDs de Stripe
          await prisma.addOn.update({
            where: { id: addon.id },
            data: {
              stripeProductId: stripeIds.productId,
              stripePriceIdMonthly: stripeIds.priceIdMonthly,
              stripePriceIdAnnual: stripeIds.priceIdAnnual,
            },
          });
          stripeSync.synced = true;
        } else {
          stripeSync.error = 'Stripe no configurado o error de sincronización';
        }
      } catch (stripeError: any) {
        logger.error('[Stripe Sync Error]:', stripeError);
        stripeSync.error = stripeError.message;
      }
    }

    // Log de auditoría (solo si hay companyId)
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { companyId: true },
      });
      
      if (user?.companyId) {
        await prisma.auditLog.create({
          data: {
            companyId: user.companyId,
            userId: session.user.id,
            action: 'UPDATE',
            entityType: 'ADDON',
            entityId: addon.id,
            entityName: addon.nombre,
            changes: JSON.stringify({
              action: 'created',
              codigo: addon.codigo,
              nombre: addon.nombre,
              precioMensual: addon.precioMensual,
              stripeSync,
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });
      }
    } catch (auditError) {
      logger.warn('[Audit Log Warning]:', auditError);
    }

    return NextResponse.json(
      {
        success: true,
        data: addon,
        stripe: stripeSync,
        message: stripeSync.synced
          ? 'Add-on creado y sincronizado con Stripe'
          : 'Add-on creado. Sincronización con Stripe pendiente.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('[Add-ons POST Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error creando add-on',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
