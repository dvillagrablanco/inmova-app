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

    const supplies = await prisma.utilitySupply.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = supplies.map((s: any) => ({
      id: s.id,
      inmuebleId: s.unitId,
      inmuebleNombre: s.unitNombre || '',
      tipo: s.tipo,
      proveedor: s.proveedor || '',
      numeroContrato: s.numeroContrato || '',
      titular: s.titular || '',
      estado: s.estado,
      ultimaLectura: s.ultimaLectura,
      ultimaLecturaFecha: s.ultimaLecturaFecha?.toISOString().split('T')[0] || null,
      lecturas: s.lecturas || [],
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[suministros GET]:', error);
    return NextResponse.json({ error: 'Error al obtener suministros' }, { status: 500 });
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
      inmuebleId,
      inmuebleNombre,
      tipo,
      proveedor,
      numeroContrato,
      titular,
      estado,
      ultimaLectura,
      lecturas,
    } = body;

    const supply = await prisma.utilitySupply.create({
      data: {
        companyId,
        unitId: inmuebleId || null,
        unitNombre: inmuebleNombre || null,
        tipo: tipo || 'electricidad',
        proveedor: proveedor || null,
        numeroContrato: numeroContrato || null,
        titular: titular || null,
        estado: estado || 'activo',
        ultimaLectura: ultimaLectura || null,
        ultimaLecturaFecha: lecturas?.length
          ? new Date(lecturas[lecturas.length - 1]?.fecha)
          : null,
        lecturas: lecturas || [],
      },
    });

    return NextResponse.json(
      {
        id: supply.id,
        inmuebleId: supply.unitId,
        inmuebleNombre: supply.unitNombre,
        tipo: supply.tipo,
        proveedor: supply.proveedor,
        numeroContrato: supply.numeroContrato,
        titular: supply.titular,
        estado: supply.estado,
        ultimaLectura: supply.ultimaLectura,
        lecturas: supply.lecturas,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[suministros POST]:', error);
    return NextResponse.json({ error: 'Error al crear suministro' }, { status: 500 });
  }
}
