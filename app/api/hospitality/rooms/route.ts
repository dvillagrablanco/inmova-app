/**
 * API Hospitality: Rooms (Habitaciones)
 * Usa el modelo Unit existente - habitaciones son unidades de un edificio
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ data: [], stats: null }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const estado = searchParams.get('estado');

    const where: any = {
      building: { companyId: session.user.companyId },
    };
    if (buildingId && buildingId !== 'all') where.buildingId = buildingId;
    if (estado && estado !== 'all') where.estado = estado;

    const units = await prisma.unit.findMany({
      where,
      include: {
        building: { select: { id: true, nombre: true, direccion: true } },
      },
      orderBy: { numero: 'asc' },
    });

    // Mapear a formato Room esperado por la página
    const rooms = units.map((u: any) => ({
      id: u.id,
      numero: u.numero,
      tipo: u.tipo || 'standard',
      capacidad: u.habitaciones || 1,
      precioMensual: Number(u.rentaMensual) || 0,
      amenidades: [
        u.aireAcondicionado && 'aire',
        u.calefaccion && 'calefaccion',
        u.terraza && 'balcon',
        u.amueblado && 'amueblado',
      ].filter(Boolean),
      descripcion: '',
      superficie: Number(u.superficie) || 0,
      estado: u.estado,
      building: u.building,
    }));

    // Stats
    const stats = {
      total: rooms.length,
      disponibles: rooms.filter((r: any) => r.estado === 'disponible').length,
      ocupadas: rooms.filter((r: any) => r.estado === 'ocupada').length,
      mantenimiento: rooms.filter((r: any) => r.estado === 'en_mantenimiento').length,
      reservadas: 0,
    };

    return NextResponse.json({ data: rooms, stats });
  } catch (error: any) {
    logger.error('Error en hospitality rooms GET:', error);
    return NextResponse.json({ data: [], stats: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Verificar que el edificio pertenece a la empresa
    const building = await prisma.building.findFirst({
      where: { id: body.buildingId, companyId: session.user.companyId },
    });
    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    const unit = await prisma.unit.create({
      data: {
        buildingId: body.buildingId,
        numero: body.numero,
        tipo: 'vivienda',
        estado: 'disponible',
        superficie: body.superficie || 0,
        habitaciones: body.capacidad || 1,
        banos: body.banos || 1,
        rentaMensual: body.precioMensual || 0,
        amueblado: body.amenidades?.includes('amueblado') || false,
        aireAcondicionado: body.amenidades?.includes('aire') || false,
        calefaccion: body.amenidades?.includes('calefaccion') || false,
        terraza: body.amenidades?.includes('balcon') || false,
      },
      include: {
        building: { select: { id: true, nombre: true, direccion: true } },
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    logger.error('Error en hospitality rooms POST:', error);
    return NextResponse.json({ error: 'Error al crear habitación' }, { status: 500 });
  }
}
