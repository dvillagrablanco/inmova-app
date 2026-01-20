/**
 * API para gestionar cupones promocionales INMOVA
 * Solo accesible para SUPERADMIN
 * 
 * GET /api/admin/promo-coupons - Listar cupones
 * POST /api/admin/promo-coupons - Crear cupón
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createCouponSchema = z.object({
  codigo: z.string().min(3).max(20).toUpperCase(),
  nombre: z.string().min(3),
  descripcion: z.string().optional(),
  tipo: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_MONTHS', 'TRIAL_EXTENSION']),
  valor: z.number().positive(),
  fechaInicio: z.string().datetime(),
  fechaExpiracion: z.string().datetime(),
  usosMaximos: z.number().int().positive().optional(),
  usosPorUsuario: z.number().int().positive().default(1),
  duracionMeses: z.number().int().positive().default(1),
  planesPermitidos: z.array(z.string()).default([]),
  destacado: z.boolean().default(false),
  notas: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      // Retornar datos vacíos en lugar de error para mejor UX
      return NextResponse.json({
        success: true,
        data: [],
        stats: { total: 0, activos: 0, porExpirar: 0, usosHoy: 0 },
        _authRequired: true,
      });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const activo = searchParams.get('activo');

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const coupons = await prisma.promoCoupon.findMany({
      where: {
        ...(estado && { estado: estado as any }),
        ...(activo !== null && { activo: activo === 'true' }),
      },
      include: {
        _count: {
          select: { usos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estadísticas
    const stats = {
      total: coupons.length,
      activos: coupons.filter(c => c.estado === 'ACTIVE').length,
      porExpirar: coupons.filter(c => {
        const diasRestantes = Math.ceil((new Date(c.fechaExpiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 7 && diasRestantes > 0 && c.estado === 'ACTIVE';
      }).length,
      usosHoy: 0, // TODO: Calcular
    };

    return NextResponse.json({
      success: true,
      data: coupons.map(c => ({
        ...c,
        usosActuales: c._count.usos,
        diasRestantes: Math.ceil((new Date(c.fechaExpiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      })),
      stats,
    });
  } catch (error: any) {
    logger.error('[PromoCoupons GET Error]:', error);
    // Retornar lista vacía en lugar de error para mejor UX
    return NextResponse.json({
      success: true,
      data: [],
      stats: { total: 0, activos: 0, porExpirar: 0, usosHoy: 0 },
      _error: 'Error obteniendo cupones',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCouponSchema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que no exista otro cupón con el mismo código
    const existing = await prisma.promoCoupon.findUnique({
      where: { codigo: validated.codigo },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un cupón con el código ${validated.codigo}` },
        { status: 400 }
      );
    }

    // Crear cupón
    const coupon = await prisma.promoCoupon.create({
      data: {
        codigo: validated.codigo,
        nombre: validated.nombre,
        descripcion: validated.descripcion,
        tipo: validated.tipo as any,
        valor: validated.valor,
        fechaInicio: new Date(validated.fechaInicio),
        fechaExpiracion: new Date(validated.fechaExpiracion),
        usosMaximos: validated.usosMaximos,
        usosPorUsuario: validated.usosPorUsuario,
        duracionMeses: validated.duracionMeses,
        planesPermitidos: validated.planesPermitidos,
        destacado: validated.destacado,
        notas: validated.notas,
        creadoPor: session.user.id,
        estado: 'ACTIVE',
        activo: true,
      },
    });

    // TODO: Sincronizar con Stripe si es necesario

    return NextResponse.json({
      success: true,
      data: coupon,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[PromoCoupons POST Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error creando cupón' }, { status: 500 });
  }
}
