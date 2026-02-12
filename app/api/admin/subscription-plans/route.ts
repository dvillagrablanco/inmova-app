import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/admin/subscription-plans - Lista todos los planes (solo super_admin)
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    // Para admin: mostrar TODOS los planes (incluyendo internos como Owner)
    // Usar select en vez de include para evitar problemas de columnas faltantes
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        activo: true, // Solo planes activos
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        tier: true,
        precioMensual: true,
        maxUsuarios: true,
        maxPropiedades: true,
        modulosIncluidos: true,
        activo: true,
        _count: {
          select: {
            companies: true,
          },
        },
      },
      orderBy: { precioMensual: 'asc' },
    });

    // Devolver en formato esperado por el hook useCompanies
    return NextResponse.json({ plans });
  } catch (error) {
    logger.error('Error fetching subscription plans:', error);
    // Retornar lista vacía en lugar de error para mejor UX
    return NextResponse.json({ plans: [], _error: 'Error al cargar planes' });
  }
}

// POST /api/admin/subscription-plans - Crea nuevo plan (solo super_admin)
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validaciones
    if (!data.nombre || !data.tier || !data.precioMensual) {
      return NextResponse.json({ error: 'Nombre, tier y precio son requeridos' }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        nombre: data.nombre,
        tier: data.tier,
        descripcion: data.descripcion || '',
        precioMensual: data.precioMensual,
        maxUsuarios: data.maxUsuarios || 5,
        maxPropiedades: data.maxPropiedades || 10,
        modulosIncluidos: data.modulosIncluidos || [],
        activo: data.activo !== undefined ? data.activo : true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    logger.error('Error creating subscription plan:', error);
    return NextResponse.json({ error: 'Error al crear plan de suscripción' }, { status: 500 });
  }
}
