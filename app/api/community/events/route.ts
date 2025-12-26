import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireAuth,
  hasPermission,
  forbiddenResponse,
  badRequestResponse,
} from '@/lib/permissions';

// GET - Listar eventos de la comunidad
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = {
      companyId: user.companyId,
    };

    if (buildingId) where.buildingId = buildingId;
    if (status) where.estado = status;
    if (tipo) where.categoria = tipo;
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = new Date(from);
      if (to) where.fecha.lte = new Date(to);
    }

    const events = await prisma.communityEvent.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: {
        building: {
          select: { id: true, nombre: true },
        },
      },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST - Crear nuevo evento
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Verificar permiso de gestión de eventos
    if (!hasPermission(user.role, 'manageEvents')) {
      return forbiddenResponse('No tienes permiso para crear eventos');
    }

    const data = await request.json();

    const event = await prisma.communityEvent.create({
      data: {
        companyId: user.companyId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria || 'social',
        fecha: new Date(data.fecha),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        ubicacion: data.ubicacion,
        capacidadMaxima: data.capacidadMaxima,
        precio: data.precio,
        requierePago: data.requierePago || false,
        buildingId: data.buildingId,
        organizadoPor: user.name,
        estado: data.estado || 'programado',
        fotos: data.fotos || [],
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
