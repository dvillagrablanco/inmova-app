import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateLeadScoring, calculateProbabilidadCierre } from '@/lib/crm-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const asignadoA = searchParams.get('asignadoA');

    const where: any = {
      companyId: user.companyId,
    };

    if (estado) where.estado = estado;
    if (asignadoA) where.asignadoA = asignadoA;

    const leads = await prisma.lead.findMany({
      where,
      include: {
        actividades: {
          orderBy: { fecha: 'desc' },
          take: 5,
        },
        asignadoUsuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { puntuacion: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(leads);
  } catch (error) {
    logger.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Error al obtener leads' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();

    // Calcular scoring inicial basado en datos del lead
    const puntuacionInicial = calculateLeadScoring(body);
    const probabilidadInicial = calculateProbabilidadCierre(body);

    const lead = await prisma.lead.create({
      data: {
        companyId: user.companyId,
        nombre: body.nombre || body.nombreCompleto?.split(' ')[0] || '',
        apellidos: body.apellidos || body.nombreCompleto?.split(' ').slice(1).join(' ') || '',
        email: body.email,
        telefono: body.telefono,
        empresa: body.empresa,
        cargo: body.cargo,
        direccion: body.direccion,
        ciudad: body.ciudad,
        codigoPostal: body.codigoPostal,
        pais: body.pais || 'España',
        fuente: body.fuente || 'formulario_contacto',
        origenDetalle: body.origenDetalle,
        paginaOrigen: body.paginaOrigen,
        estado: body.estado || 'nuevo',
        etapa: body.etapa || 'contacto_inicial',
        puntuacion: puntuacionInicial,
        temperatura: body.temperatura || 'frio',
        tipoNegocio: body.tipoNegocio,
        verticalesInteres: body.verticalesInteres || [],
        numeroUnidades: body.numeroUnidades ? parseInt(body.numeroUnidades) : null,
        presupuestoMensual: body.presupuestoMensual ? parseFloat(body.presupuestoMensual) : null,
        urgencia: body.urgencia || 'media',
        notas: body.notas,
        probabilidadCierre: probabilidadInicial,
        fechaEstimadaCierre: body.fechaEstimadaCierre ? new Date(body.fechaEstimadaCierre) : null,
        asignadoA: body.asignadoA || user.id,
        conversacionId: body.conversacionId,
        mensajeInicial: body.mensajeInicial,
        preguntasFrecuentes: body.preguntasFrecuentes || [],
      },
      include: {
        actividades: true,
        asignadoUsuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    logger.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Error al crear lead' },
      { status: 500 }
    );
  }
}
