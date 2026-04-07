import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json([]);

    const periods = await prisma.unavailabilityPeriod.findMany({
      where: { companyId },
      orderBy: { fechaDesde: 'desc' },
    });

    const formatted = periods.map((p: any) => ({
      id: p.id,
      inmuebleId: p.inmuebleId,
      inmuebleNombre: p.inmuebleNombre,
      motivo: p.motivo,
      fechaDesde: p.fechaDesde.toISOString().split('T')[0],
      fechaHasta: p.fechaHasta.toISOString().split('T')[0],
      notas: p.notas || '',
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[no-disponibilidad GET]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json({ error: 'Company requerida' }, { status: 400 });

    const body = await req.json();
    const { inmuebleId, inmuebleNombre, motivo, fechaDesde, fechaHasta, notas } = body;
    if (!inmuebleNombre || !motivo || !fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: 'Faltan campos: inmuebleNombre, motivo, fechaDesde, fechaHasta' },
        { status: 400 }
      );
    }

    const period = await prisma.unavailabilityPeriod.create({
      data: {
        companyId,
        inmuebleId: inmuebleId || null,
        inmuebleNombre,
        motivo,
        fechaDesde: new Date(fechaDesde),
        fechaHasta: new Date(fechaHasta),
        notas: notas || null,
      },
    });

    return NextResponse.json(
      {
        id: period.id,
        inmuebleId: period.inmuebleId,
        inmuebleNombre: period.inmuebleNombre,
        motivo: period.motivo,
        fechaDesde: period.fechaDesde.toISOString().split('T')[0],
        fechaHasta: period.fechaHasta.toISOString().split('T')[0],
        notas: period.notas || '',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[no-disponibilidad POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
