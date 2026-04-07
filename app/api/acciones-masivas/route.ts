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

    const batches = await prisma.batchAction.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = batches.map((b: any) => ({
      id: b.id,
      tipo: b.tipo,
      entidades: b.entidades || [],
      concepto: b.concepto,
      importe: b.importe,
      estado: b.estado,
      fechaCreacion: b.createdAt.toISOString(),
      fechaProcesamiento: b.fechaProcesamiento?.toISOString() || null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[acciones-masivas GET]:', error);
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
    const { tipo, entidades, concepto, importe } = body;
    if (!tipo || !entidades?.length || !concepto || importe == null) {
      return NextResponse.json(
        { error: 'Faltan campos: tipo, entidades, concepto, importe' },
        { status: 400 }
      );
    }

    const batch = await prisma.batchAction.create({
      data: {
        companyId,
        tipo,
        entidades: Array.isArray(entidades) ? entidades : [entidades],
        concepto,
        importe: Number(importe),
        estado: 'pendiente',
      },
    });

    return NextResponse.json(
      {
        id: batch.id,
        tipo: batch.tipo,
        entidades: batch.entidades,
        concepto: batch.concepto,
        importe: batch.importe,
        estado: batch.estado,
        fechaCreacion: batch.createdAt.toISOString(),
        fechaProcesamiento: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[acciones-masivas POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
