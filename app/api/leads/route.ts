import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/leads - Lista de leads
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const isSuperAdmin = session.user.role === 'super_admin' || session.user.role === 'soporte';

    // Si no es super_admin y no tiene companyId, retornar vacío
    if (!isSuperAdmin && !companyId) {
      return NextResponse.json([]);
    }

    // Parámetros de búsqueda
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const estado = searchParams.get('estado');
    const fuente = searchParams.get('fuente');

    // Construir where clause
    const whereClause: any = {};
    
    if (!isSuperAdmin && companyId) {
      whereClause.companyId = companyId;
    }
    
    if (estado && estado !== 'all') {
      whereClause.estado = estado;
    }
    
    if (fuente && fuente !== 'all') {
      whereClause.fuente = fuente;
    }

    // Verificar si el modelo Lead existe
    // Por seguridad, verificamos primero si el modelo existe
    try {
      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            company: {
              select: { id: true, nombre: true },
            },
          },
        }),
        prisma.lead.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        data: leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (prismaError: any) {
      // Si el modelo no existe, retornar lista vacía
      if (prismaError.code === 'P2021' || prismaError.message?.includes('does not exist')) {
        logger.warn('Lead model not found in schema');
        return NextResponse.json([]);
      }
      throw prismaError;
    }
  } catch (error: any) {
    logger.error('Error fetching leads:', error);
    // Retornar array vacío en lugar de error para mejor UX
    return NextResponse.json([]);
  }
}

// POST /api/leads - Crear lead
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId requerido' }, { status: 400 });
    }

    const body = await req.json();
    
    // Validación básica
    if (!body.nombre || !body.email) {
      return NextResponse.json(
        { error: 'Nombre y email son requeridos' },
        { status: 400 }
      );
    }

    try {
      const verticalesInteres = Array.isArray(body.verticalesInteres)
        ? body.verticalesInteres
        : body.interes
          ? [body.interes]
          : [];
      const presupuestoMensual = body.presupuesto ? Number(body.presupuesto) : undefined;

      const lead = await prisma.lead.create({
        data: {
          companyId,
          nombre: body.nombre,
          email: body.email,
          telefono: body.telefono,
          empresa: body.empresa,
          fuente: body.fuente || 'web',
          estado: 'nuevo',
          tipoNegocio: body.tipoNegocio || body.interes,
          verticalesInteres,
          presupuestoMensual: Number.isFinite(presupuestoMensual) ? presupuestoMensual : undefined,
          notas: body.notas,
        },
      });

      logger.info('Lead created', { leadId: lead.id, companyId });
      return NextResponse.json(lead, { status: 201 });
    } catch (prismaError: any) {
      if (prismaError.code === 'P2021') {
        return NextResponse.json(
          { error: 'Funcionalidad de leads no disponible' },
          { status: 501 }
        );
      }
      throw prismaError;
    }
  } catch (error: any) {
    logger.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Error al crear lead' },
      { status: 500 }
    );
  }
}
