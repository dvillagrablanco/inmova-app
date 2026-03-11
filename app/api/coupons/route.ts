import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createCoupon, getCompanyCoupons, validateCoupon } from '@/lib/coupon-service';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const validateCouponSchema = z.object({
  action: z.literal('validate'),
  codigo: z.string().min(1),
  montoCompra: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? parseFloat(v) : v)),
  userId: z.string().optional(),
  tenantId: z.string().optional(),
});

const createCouponSchema = z.object({
  action: z.string().optional(),
  codigo: z.string().min(1),
  tipo: z.string().min(1),
  valor: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? parseFloat(v) : v)),
  descripcion: z.string().optional(),
  usosMaximos: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v != null ? (typeof v === 'string' ? parseInt(v) : v) : undefined)),
  usosPorUsuario: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v != null ? (typeof v === 'string' ? parseInt(v) : v) : 1)),
  montoMinimo: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v != null ? (typeof v === 'string' ? parseFloat(v) : v) : undefined)),
  fechaInicio: z.string(),
  fechaExpiracion: z.string(),
  aplicaATodos: z.boolean().optional().default(true),
  unidadesPermitidas: z.array(z.string()).optional().default([]),
  planesPermitidos: z.array(z.string()).optional().default([]),
});
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') as any | null;
    const activo = searchParams.get('activo');

    const filters: any = {};
    if (estado) filters.estado = estado;
    if (activo !== null) filters.activo = activo === 'true';

    const coupons = await getCompanyCoupons(session.user.companyId, filters);

    return NextResponse.json(coupons);
  } catch (error) {
    logger.error('Error al obtener cupones:', error);
    return NextResponse.json({ error: 'Error al obtener cupones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden crear cupones
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();

    // Validar cupón
    if (body.action === 'validate') {
      const validateParsed = validateCouponSchema.safeParse(body);
      if (!validateParsed.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validateParsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const { codigo, montoCompra, userId, tenantId } = validateParsed.data;
      const result = await validateCoupon({
        codigo,
        companyId: session.user.companyId,
        montoCompra,
        userId,
        tenantId,
      });
      return NextResponse.json(result);
    }

    // Crear cupón
    const createParsed = createCouponSchema.safeParse(body);
    if (!createParsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: createParsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = createParsed.data;

    const coupon = await createCoupon({
      companyId: session.user.companyId,
      codigo: data.codigo,
      tipo: data.tipo as any,
      valor: data.valor,
      descripcion: data.descripcion,
      usosMaximos: data.usosMaximos,
      usosPorUsuario: data.usosPorUsuario ?? 1,
      montoMinimo: data.montoMinimo,
      fechaInicio: new Date(data.fechaInicio),
      fechaExpiracion: new Date(data.fechaExpiracion),
      aplicaATodos: data.aplicaATodos ?? true,
      unidadesPermitidas: data.unidadesPermitidas ?? [],
      planesPermitidos: data.planesPermitidos ?? [],
      creadoPor: session.user.id,
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    logger.error('Error al crear cupón:', error);
    return NextResponse.json({ error: error.message || 'Error al crear cupón' }, { status: 500 });
  }
}
