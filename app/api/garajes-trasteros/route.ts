import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');

    const where: Record<string, unknown> = { companyId };
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const entries = await prisma.parkingStorage.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('[garajes-trasteros GET]:', error);
    return NextResponse.json({ error: 'Error al obtener garajes y trasteros' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json({ error: 'Company requerida' }, { status: 400 });

    const body = await req.json();
    const {
      tipo,
      numero,
      buildingId,
      buildingNombre,
      unidadVinculada,
      inquilinoNombre,
      precioMensual,
      estado,
      planta,
      metros2,
    } = body;

    const entry = await prisma.parkingStorage.create({
      data: {
        companyId,
        tipo: tipo || 'garaje',
        numero: numero || 'N/A',
        buildingId: buildingId || null,
        buildingNombre: buildingNombre || null,
        unidadVinculada: unidadVinculada || null,
        inquilinoNombre: inquilinoNombre || null,
        precioMensual: precioMensual || 0,
        estado: estado || 'libre',
        planta: planta ?? 0,
        metros2: metros2 ?? 0,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('[garajes-trasteros POST]:', error);
    return NextResponse.json({ error: 'Error al crear garaje/trastero' }, { status: 500 });
  }
}
