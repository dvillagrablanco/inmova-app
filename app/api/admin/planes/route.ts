import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Roles permitidos para gestionar planes
const ADMIN_ROLES = ['super_admin', 'administrador'];

// Schema de validación para crear/actualizar plan
const planSchema = z.object({
  nombre: z.string().min(2).max(100),
  tier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']),
  descripcion: z.string(),
  precioMensual: z.number().min(0),
  precioAnual: z.number().min(0).optional(),
  maxUsuarios: z.number().min(1),
  maxPropiedades: z.number().min(1),
  maxVerticales: z.number().min(1).optional().default(1),
  modulosIncluidos: z.array(z.string()).default([]),
  // Límites de integraciones
  signaturesIncludedMonth: z.number().min(0).default(0),
  extraSignaturePrice: z.number().min(0).default(2.0),
  storageIncludedGB: z.number().min(0).default(1),
  extraStorageGBPrice: z.number().min(0).default(0.05),
  aiTokensIncludedMonth: z.number().min(0).default(0),
  extraAITokensPrice: z.number().min(0).default(0.01),
  smsIncludedMonth: z.number().min(0).default(0),
  extraSMSPrice: z.number().min(0).default(0.10),
  // Stripe
  stripePriceIdMonthly: z.string().optional(),
  stripePriceIdAnnual: z.string().optional(),
  // Estado
  activo: z.boolean().default(true),
  popular: z.boolean().default(false),
});

/**
 * GET /api/admin/planes
 * Obtiene todos los planes de suscripción
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const planes = await prisma.subscriptionPlan.findMany({
      orderBy: { precioMensual: 'asc' },
      include: {
        _count: {
          select: { companies: true },
        },
      },
    });

    // Formatear respuesta
    const planesFormateados = planes.map(plan => ({
      id: plan.id,
      nombre: plan.nombre,
      tier: plan.tier,
      descripcion: plan.descripcion,
      precioMensual: plan.precioMensual,
      maxUsuarios: plan.maxUsuarios,
      maxPropiedades: plan.maxPropiedades,
      modulosIncluidos: plan.modulosIncluidos,
      // Límites
      signaturesIncludedMonth: plan.signaturesIncludedMonth,
      extraSignaturePrice: plan.extraSignaturePrice,
      storageIncludedGB: plan.storageIncludedGB,
      extraStorageGBPrice: plan.extraStorageGBPrice,
      aiTokensIncludedMonth: plan.aiTokensIncludedMonth,
      extraAITokensPrice: plan.extraAITokensPrice,
      smsIncludedMonth: plan.smsIncludedMonth,
      extraSMSPrice: plan.extraSMSPrice,
      // Estado
      activo: plan.activo,
      empresasUsando: plan._count.companies,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));

    return NextResponse.json({
      planes: planesFormateados,
      total: planes.length,
    });

  } catch (error: any) {
    console.error('[Admin Planes GET Error]:', error);
    // Retornar lista vacía en lugar de error para mejor UX
    return NextResponse.json({
      planes: [],
      total: 0,
      _error: 'Error parcial al cargar planes',
    });
  }
}

/**
 * POST /api/admin/planes
 * Crea un nuevo plan de suscripción
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = planSchema.parse(body);

    const plan = await prisma.subscriptionPlan.create({
      data: {
        nombre: data.nombre,
        tier: data.tier as any,
        descripcion: data.descripcion,
        precioMensual: data.precioMensual,
        maxUsuarios: data.maxUsuarios,
        maxPropiedades: data.maxPropiedades,
        modulosIncluidos: data.modulosIncluidos,
        signaturesIncludedMonth: data.signaturesIncludedMonth,
        extraSignaturePrice: data.extraSignaturePrice,
        storageIncludedGB: data.storageIncludedGB,
        extraStorageGBPrice: data.extraStorageGBPrice,
        aiTokensIncludedMonth: data.aiTokensIncludedMonth,
        extraAITokensPrice: data.extraAITokensPrice,
        smsIncludedMonth: data.smsIncludedMonth,
        extraSMSPrice: data.extraSMSPrice,
        activo: data.activo,
      },
    });

    return NextResponse.json({
      success: true,
      plan,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Admin Planes POST Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear plan' },
      { status: 500 }
    );
  }
}
