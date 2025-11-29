import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/admin/subscription-plans - Lista todos los planes (solo super_admin)
export async function GET(request: NextRequest) {
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

    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            companies: true,
          },
        },
      },
      orderBy: { precioMensual: 'asc' },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Error al obtener planes de suscripción' },
      { status: 500 }
    );
  }
}

// POST /api/admin/subscription-plans - Crea nuevo plan (solo super_admin)
export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Nombre, tier y precio son requeridos' },
        { status: 400 }
      );
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
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Error al crear plan de suscripción' },
      { status: 500 }
    );
  }
}