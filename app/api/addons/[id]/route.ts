import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/addons/[id]
 * Obtiene un add-on específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const addon = await prisma.addOn.findUnique({
      where: { id },
      include: {
        suscripciones: {
          where: { activo: true },
          include: {
            company: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
    });

    if (!addon) {
      return NextResponse.json(
        { error: 'Add-on no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...addon,
        stripe: {
          productId: addon.stripeProductId,
          priceIdMonthly: addon.stripePriceIdMonthly,
          priceIdAnnual: addon.stripePriceIdAnnual,
          synced: !!addon.stripeProductId,
        },
      },
    });
  } catch (error: any) {
    logger.error('[Add-ons GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo add-on', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/addons/[id]
 * Actualiza un add-on existente (solo admin)
 * Sincroniza automáticamente con Stripe si cambian precios
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Schema de validación para actualización
    const schema = z.object({
      nombre: z.string().min(3).max(100).optional(),
      descripcion: z.string().min(10).optional(),
      categoria: z.enum(['usage', 'feature', 'premium']).optional(),
      precioMensual: z.number().min(0).optional(),
      precioAnual: z.number().min(0).nullable().optional(),
      unidades: z.number().nullable().optional(),
      tipoUnidad: z.string().nullable().optional(),
      disponiblePara: z.array(z.string()).optional(),
      incluidoEn: z.array(z.string()).optional(),
      margenPorcentaje: z.number().min(0).max(100).nullable().optional(),
      costoUnitario: z.number().min(0).nullable().optional(),
      destacado: z.boolean().optional(),
      activo: z.boolean().optional(),
      orden: z.number().optional(),
      syncWithStripe: z.boolean().optional().default(true),
    });

    const validated = schema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Obtener add-on existente
    const existing = await prisma.addOn.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Add-on no encontrado' },
        { status: 404 }
      );
    }

    // Detectar si cambiaron los precios
    const preciosChanged = 
      (validated.precioMensual !== undefined && validated.precioMensual !== existing.precioMensual) ||
      (validated.precioAnual !== undefined && validated.precioAnual !== existing.precioAnual) ||
      (validated.nombre !== undefined && validated.nombre !== existing.nombre) ||
      (validated.descripcion !== undefined && validated.descripcion !== existing.descripcion);

    // Actualizar add-on
    const addon = await prisma.addOn.update({
      where: { id },
      data: {
        ...(validated.nombre && { nombre: validated.nombre }),
        ...(validated.descripcion && { descripcion: validated.descripcion }),
        ...(validated.categoria && { categoria: validated.categoria }),
        ...(validated.precioMensual !== undefined && { precioMensual: validated.precioMensual }),
        ...(validated.precioAnual !== undefined && { precioAnual: validated.precioAnual }),
        ...(validated.unidades !== undefined && { unidades: validated.unidades }),
        ...(validated.tipoUnidad !== undefined && { tipoUnidad: validated.tipoUnidad }),
        ...(validated.disponiblePara && { disponiblePara: validated.disponiblePara }),
        ...(validated.incluidoEn && { incluidoEn: validated.incluidoEn }),
        ...(validated.margenPorcentaje !== undefined && { margenPorcentaje: validated.margenPorcentaje }),
        ...(validated.costoUnitario !== undefined && { costoUnitario: validated.costoUnitario }),
        ...(validated.destacado !== undefined && { destacado: validated.destacado }),
        ...(validated.activo !== undefined && { activo: validated.activo }),
        ...(validated.orden !== undefined && { orden: validated.orden }),
      },
    });

    // Sincronizar con Stripe si cambiaron precios o datos relevantes
    let stripeSync = { synced: false, error: null as string | null, updated: false };
    
    if (validated.syncWithStripe !== false && preciosChanged) {
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
          // Actualizar con nuevos IDs de Stripe
          await prisma.addOn.update({
            where: { id: addon.id },
            data: {
              stripeProductId: stripeIds.productId,
              stripePriceIdMonthly: stripeIds.priceIdMonthly,
              stripePriceIdAnnual: stripeIds.priceIdAnnual,
            },
          });
          stripeSync.synced = true;
          stripeSync.updated = true;
        } else {
          stripeSync.error = 'Stripe no configurado';
        }
      } catch (stripeError: any) {
        logger.error('[Stripe Sync Error]:', stripeError);
        stripeSync.error = stripeError.message;
      }
    } else if (existing.stripeProductId) {
      stripeSync.synced = true; // Ya estaba sincronizado
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
              changes: Object.keys(validated).filter(k => k !== 'syncWithStripe'),
              addonName: addon.nombre,
              stripeSync,
              preciosChanged,
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });
      }
    } catch (auditError) {
      // No fallar si el audit log no se puede crear
      logger.warn('[Audit Log Warning]:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: addon,
      stripe: stripeSync,
      message: stripeSync.updated 
        ? 'Add-on actualizado y sincronizado con Stripe'
        : 'Add-on actualizado correctamente',
    });
  } catch (error: any) {
    logger.error('[Add-ons PUT Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error actualizando add-on',
      message: error.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/addons/[id]
 * Elimina un add-on (solo admin)
 * Desactiva el producto en Stripe
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que el add-on existe
    const addon = await prisma.addOn.findUnique({
      where: { id },
      include: {
        suscripciones: {
          where: { activo: true },
        },
      },
    });

    if (!addon) {
      return NextResponse.json(
        { error: 'Add-on no encontrado' },
        { status: 404 }
      );
    }

    // Desactivar producto en Stripe si existe
    let stripeDeactivated = false;
    if (addon.stripeProductId) {
      try {
        const { getStripe } = await import('@/lib/stripe-config');
        const stripe = getStripe();
        
        if (stripe) {
          await stripe.products.update(addon.stripeProductId, {
            active: false,
          });
          stripeDeactivated = true;
        }
      } catch (stripeError: any) {
        logger.warn('[Stripe Deactivate Warning]:', stripeError.message);
      }
    }

    // Si tiene suscripciones activas, hacer soft delete
    if (addon.suscripciones.length > 0) {
      await prisma.addOn.update({
        where: { id },
        data: { activo: false },
      });

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
                action: 'deactivated',
                addonName: addon.nombre,
                reason: 'Has active subscriptions',
                activeSubscriptions: addon.suscripciones.length,
                stripeDeactivated,
              }),
              ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            },
          });
        }
      } catch (auditError) {
        logger.warn('[Audit Log Warning]:', auditError);
      }

      return NextResponse.json({
        success: true,
        message: `Add-on desactivado (tiene ${addon.suscripciones.length} suscripciones activas)`,
        softDelete: true,
        stripeDeactivated,
      });
    }

    // Si no tiene suscripciones, eliminar definitivamente
    await prisma.addOn.delete({
      where: { id },
    });

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
            entityId: id,
            entityName: addon.nombre,
            changes: JSON.stringify({
              action: 'deleted',
              addonName: addon.nombre,
              stripeDeactivated,
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        });
      }
    } catch (auditError) {
      logger.warn('[Audit Log Warning]:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Add-on eliminado correctamente',
      stripeDeactivated,
    });
  } catch (error: any) {
    logger.error('[Add-ons DELETE Error]:', error);
    return NextResponse.json({
      error: 'Error eliminando add-on',
      message: error.message,
    }, { status: 500 });
  }
}
