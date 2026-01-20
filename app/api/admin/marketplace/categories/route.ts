/**
 * API para gestionar categorías del marketplace
 * 
 * GET /api/admin/marketplace/categories - Listar categorías
 * POST /api/admin/marketplace/categories - Crear categoría
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Categorías predefinidas del marketplace
const DEFAULT_CATEGORIES = [
  {
    id: 'cat_seguros',
    nombre: 'Seguros',
    slug: 'seguros',
    descripcion: 'Seguros de hogar, alquiler y protección jurídica',
    icono: 'Shield',
    color: '#3B82F6',
    serviciosCount: 0,
    activo: true,
    orden: 1,
  },
  {
    id: 'cat_certificaciones',
    nombre: 'Certificaciones',
    slug: 'certificaciones',
    descripcion: 'Certificados energéticos, cédulas de habitabilidad y más',
    icono: 'FileCheck',
    color: '#10B981',
    serviciosCount: 0,
    activo: true,
    orden: 2,
  },
  {
    id: 'cat_mantenimiento',
    nombre: 'Mantenimiento',
    slug: 'mantenimiento',
    descripcion: 'Fontanería, electricidad, climatización y reparaciones',
    icono: 'Wrench',
    color: '#F59E0B',
    serviciosCount: 0,
    activo: true,
    orden: 3,
  },
  {
    id: 'cat_limpieza',
    nombre: 'Limpieza',
    slug: 'limpieza',
    descripcion: 'Limpieza profesional de inmuebles',
    icono: 'Sparkles',
    color: '#8B5CF6',
    serviciosCount: 0,
    activo: true,
    orden: 4,
  },
  {
    id: 'cat_mudanzas',
    nombre: 'Mudanzas',
    slug: 'mudanzas',
    descripcion: 'Servicios de mudanza y transporte',
    icono: 'Truck',
    color: '#EC4899',
    serviciosCount: 0,
    activo: true,
    orden: 5,
  },
  {
    id: 'cat_legal',
    nombre: 'Legal',
    slug: 'legal',
    descripcion: 'Asesoría legal y gestión de contratos',
    icono: 'Scale',
    color: '#6366F1',
    serviciosCount: 0,
    activo: true,
    orden: 6,
  },
  {
    id: 'cat_reformas',
    nombre: 'Reformas',
    slug: 'reformas',
    descripcion: 'Reformas integrales y parciales',
    icono: 'Hammer',
    color: '#EF4444',
    serviciosCount: 0,
    activo: true,
    orden: 7,
  },
  {
    id: 'cat_marketing',
    nombre: 'Marketing',
    slug: 'marketing',
    descripcion: 'Fotografía, tours virtuales y promoción',
    icono: 'Camera',
    color: '#14B8A6',
    serviciosCount: 0,
    activo: true,
    orden: 8,
  },
];

const categorySchema = z.object({
  nombre: z.string().min(2),
  slug: z.string().min(2),
  descripcion: z.string().optional(),
  icono: z.string().optional(),
  color: z.string().optional(),
  activo: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Retornar categorías predefinidas
    return NextResponse.json({
      success: true,
      data: DEFAULT_CATEGORIES,
      total: DEFAULT_CATEGORIES.length,
    });
  } catch (error) {
    logger.error('[API Error] Marketplace categories:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = categorySchema.parse(body);

    // Crear nueva categoría (en memoria por ahora)
    const newCategory = {
      id: `cat_${Date.now()}`,
      ...validated,
      serviciosCount: 0,
      activo: validated.activo ?? true,
      orden: DEFAULT_CATEGORIES.length + 1,
    };

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Categoría creada correctamente',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[API Error] Create marketplace category:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
