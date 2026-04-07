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
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');

    const where: Record<string, unknown> = { companyId };
    if (estado) where.estado = estado;

    const visits = await prisma.propertyVisit.findMany({
      where: where as any,
      orderBy: { fecha: 'desc' },
    });

    const formatted = visits.map((v: any) => ({
      id: v.id,
      fecha: v.fecha.toISOString().split('T')[0],
      hora: v.hora || '10:00',
      inmuebleId: v.inmuebleId,
      inmuebleNombre: v.inmuebleNombre,
      candidatoId: v.candidatoId,
      candidatoNombre: v.candidatoNombre || '-',
      agenteNombre: v.agenteNombre || '-',
      estado: v.estado,
      notas: v.notas || '',
      resultado: v.resultado,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[visitas GET]:', error);
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
    const {
      fecha,
      hora,
      inmuebleId,
      inmuebleNombre,
      candidatoId,
      candidatoNombre,
      agenteNombre,
      estado,
      notas,
    } = body;
    if (!fecha || !inmuebleNombre) {
      return NextResponse.json({ error: 'Faltan campos: fecha, inmuebleNombre' }, { status: 400 });
    }

    const visit = await prisma.propertyVisit.create({
      data: {
        companyId,
        fecha: new Date(fecha),
        hora: hora || '10:00',
        inmuebleId: inmuebleId || null,
        inmuebleNombre,
        candidatoId: candidatoId || null,
        candidatoNombre: candidatoNombre || null,
        agenteNombre: agenteNombre || session.user?.name || 'Agente',
        agentId: (session.user as any).id || null,
        estado: estado || 'programada',
        notas: notas || null,
      },
    });

    return NextResponse.json(
      {
        id: visit.id,
        fecha: visit.fecha.toISOString().split('T')[0],
        hora: visit.hora,
        inmuebleId: visit.inmuebleId,
        inmuebleNombre: visit.inmuebleNombre,
        candidatoNombre: visit.candidatoNombre,
        agenteNombre: visit.agenteNombre,
        estado: visit.estado,
        notas: visit.notas,
        resultado: visit.resultado,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[visitas POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
