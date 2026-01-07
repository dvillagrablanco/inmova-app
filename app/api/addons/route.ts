import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/addons
 * Lista los add-ons disponibles
 * 
 * Query params:
 * - categoria: filtrar por categoría (usage, feature, premium)
 * - plan: filtrar por plan disponible (STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const plan = searchParams.get('plan');

    // Lazy load Prisma
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Construir filtros
    const where: any = { activo: true };
    if (categoria) {
      where.categoria = categoria;
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
      precio: {
        mensual: addon.precioMensual,
        anual: addon.precioAnual,
      },
      unidades: addon.unidades,
      tipoUnidad: addon.tipoUnidad,
      disponiblePara: addon.disponiblePara,
      incluidoEn: addon.incluidoEn,
      destacado: addon.destacado,
    }));

    return NextResponse.json({
      success: true,
      data: formattedAddons,
      total: formattedAddons.length,
    });
  } catch (error: any) {
    console.error('[Add-ons API Error]:', error);

    // Fallback: retornar add-ons desde config si BD falla
    const { ADD_ONS } = await import('@/lib/pricing-config');

    const fallbackAddons = Object.values(ADD_ONS).map((addon: any) => ({
      id: addon.id,
      codigo: addon.id,
      nombre: addon.name,
      descripcion: addon.description,
      categoria: 'feature',
      precio: {
        mensual: addon.monthlyPrice,
        anual: addon.monthlyPrice * 10,
      },
      disponiblePara: addon.availableFor,
      incluidoEn: addon.includedIn,
      destacado: false,
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
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
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

    return NextResponse.json({
      success: true,
      data: addon,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Add-ons POST Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error creando add-on',
      message: error.message,
    }, { status: 500 });
  }
}
