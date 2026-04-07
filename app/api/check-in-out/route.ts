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

    const entries = await prisma.propertyCheckInOut.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = entries.map((e: any) => ({
      id: e.id,
      tipo: e.tipo,
      inquilinoId: e.inquilinoId,
      inquilinoNombre: e.inquilinoNombre,
      inmuebleId: e.inmuebleId,
      inmuebleNombre: e.inmuebleNombre,
      fecha: e.fecha.toISOString().split('T')[0],
      estado: e.estado,
      token: e.token,
      items: e.items || [],
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[check-in-out GET]:', error);
    return NextResponse.json({ error: 'Error al obtener check-ins/check-outs' }, { status: 500 });
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
    const { tipo, inquilinoId, inquilinoNombre, inmuebleId, inmuebleNombre, fecha, items } = body;

    const token = `tok-${Math.random().toString(36).slice(2, 10)}`;

    const entry = await prisma.propertyCheckInOut.create({
      data: {
        companyId,
        tipo: tipo || 'check-in',
        inquilinoId: inquilinoId || null,
        inquilinoNombre: inquilinoNombre || null,
        inmuebleId: inmuebleId || null,
        inmuebleNombre: inmuebleNombre || null,
        fecha: fecha ? new Date(fecha) : new Date(),
        estado: 'pendiente',
        token,
        items: items || [],
      },
    });

    return NextResponse.json(
      {
        id: entry.id,
        tipo: entry.tipo,
        inquilinoId: entry.inquilinoId,
        inquilinoNombre: entry.inquilinoNombre,
        inmuebleId: entry.inmuebleId,
        inmuebleNombre: entry.inmuebleNombre,
        fecha: entry.fecha.toISOString().split('T')[0],
        estado: entry.estado,
        token: entry.token,
        items: entry.items,
        createdAt: entry.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[check-in-out POST]:', error);
    return NextResponse.json({ error: 'Error al crear check-in/check-out' }, { status: 500 });
  }
}
