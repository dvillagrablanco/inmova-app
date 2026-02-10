/**
 * API Endpoint: Gestión de Locales Comerciales (Retail)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createRetailSchema = z.object({
  buildingId: z.string(),
  nombre: z.string().min(2),
  tipo: z.string(), // tienda, restaurante, oficina, etc.
  superficie: z.number().min(0),
  precioAlquiler: z.number().min(0),
  estado: z.enum(['disponible', 'alquilado', 'reservado', 'mantenimiento']).default('disponible'),
  descripcion: z.string().optional(),
  caracteristicas: z.array(z.string()).default([]),
  planta: z.string().optional(),
  fachada: z.boolean().default(false),
  escaparate: z.boolean().default(false),
  almacen: z.boolean().default(false),
});

// Almacenamiento temporal
let retailStore: any[] = [];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');

    // Filtrar locales
    let locales = retailStore.filter(l => l.companyId === companyId);

    if (buildingId) locales = locales.filter(l => l.buildingId === buildingId);
    if (estado) locales = locales.filter(l => l.estado === estado);
    if (tipo) locales = locales.filter(l => l.tipo === tipo);

    // Stats
    const stats = {
      total: locales.length,
      disponibles: locales.filter(l => l.estado === 'disponible').length,
      alquilados: locales.filter(l => l.estado === 'alquilado').length,
      superficieTotal: locales.reduce((sum, l) => sum + (l.superficie || 0), 0),
      ingresosMensuales: locales.filter(l => l.estado === 'alquilado').reduce((sum, l) => sum + (l.precioAlquiler || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: locales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching retail:', error);
    return NextResponse.json({ error: 'Error al obtener locales' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createRetailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;

    const local = {
      id: `retail-${Date.now()}`,
      companyId,
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    retailStore.push(local);

    logger.info('Retail unit created', { retailId: local.id, companyId });

    return NextResponse.json({
      success: true,
      data: local,
      message: 'Local creado exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating retail:', error);
    return NextResponse.json({ error: 'Error al crear local' }, { status: 500 });
  }
}
