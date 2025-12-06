import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/sales/leads - Obtener todos los leads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const salesRepId = searchParams.get('salesRepId');
    const status = searchParams.get('status');
    const prioridad = searchParams.get('prioridad');
    const fuente = searchParams.get('fuente');

    // Construir filtros
    const where: any = {
      companyId: session.user.companyId,
    };

    // Si es un comercial, solo mostrar sus propios leads
    if ((session.user as any).userType === 'sales_representative') {
      const salesRep = await prisma.salesRepresentative.findUnique({
        where: { email: session.user.email },
      });
      if (salesRep) {
        where.salesRepresentativeId = salesRep.id;
      }
    } else if (salesRepId) {
      // Si es admin y especifica un salesRepId, filtrar por ese
      where.salesRepresentativeId = salesRepId;
    }

    if (status) {
      where.estado = status;
    }

    if (prioridad) {
      where.prioridad = prioridad;
    }

    if (fuente) {
      where.fuente = fuente;
    }

    const leads = await prisma.salesLead.findMany({
      where,
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
          },
        },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    logError('Error en GET /api/sales/leads', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener leads' },
      { status: 500 }
    );
  }
}

// POST /api/sales/leads - Crear nuevo lead
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const data = await request.json();

    // Validar campos requeridos
    if (!data.salesRepresentativeId || !data.nombreCompleto || !data.email) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Calcular scoring automáticamente
    const scoring = calculateLeadScoring(data);

    const lead = await prisma.salesLead.create({
      data: {
        companyId: session.user.companyId,
        salesRepresentativeId: data.salesRepresentativeId,
        nombreCompleto: data.nombreCompleto,
        email: data.email,
        telefono: data.telefono || null,
        empresa: data.empresa || null,
        cargo: data.cargo || null,
        presupuestoMensual: data.presupuestoMensual || null,
        propiedadesEstimadas: data.propiedadesEstimadas || null,
        estado: data.estado || 'NUEVO',
        prioridad: data.prioridad || 'MEDIA',
        fuente: data.fuente || 'WEB',
        notas: data.notas || null,
        scoring: scoring,
      },
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    logger.info(`Lead creado: ${lead.id}`);

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    logError('Error en POST /api/sales/leads', error as Error);
    return NextResponse.json(
      { error: 'Error al crear lead' },
      { status: 500 }
    );
  }
}

// Función auxiliar para calcular scoring
function calculateLeadScoring(data: any): number {
  let score = 50; // Base score

  // Más presupuesto = más score
  if (data.presupuestoMensual) {
    if (data.presupuestoMensual > 5000) score += 20;
    else if (data.presupuestoMensual > 2000) score += 15;
    else if (data.presupuestoMensual > 1000) score += 10;
    else score += 5;
  }

  // Más propiedades = más score
  if (data.propiedadesEstimadas) {
    if (data.propiedadesEstimadas > 20) score += 20;
    else if (data.propiedadesEstimadas > 10) score += 15;
    else if (data.propiedadesEstimadas > 5) score += 10;
    else score += 5;
  }

  // Fuente confiable
  if (data.fuente === 'REFERIDO') score += 10;
  if (data.fuente === 'PARTNER') score += 15;

  // Tiene empresa = más serio
  if (data.empresa) score += 5;
  if (data.cargo) score += 5;

  return Math.min(100, Math.max(0, score));
}
