import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ENTIDADES = ['inmueble', 'inquilino', 'contrato', 'incidencia', 'propietario'] as const;
const TIPOS = ['texto', 'numero', 'fecha', 'select', 'checkbox'] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json([]);

    const entidad = req.nextUrl.searchParams.get('entidad');

    const where: Record<string, unknown> = { companyId };
    if (entidad && ENTIDADES.includes(entidad as any)) {
      where.entidad = entidad;
    }

    const fields = await prisma.customField.findMany({
      where: where as any,
      orderBy: [{ entidad: 'asc' }, { orden: 'asc' }],
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error('[campos-personalizados GET]:', error);
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
    const { entidad, nombre, tipo, obligatorio, opciones, orden } = body;
    if (!entidad || !nombre || !tipo) {
      return NextResponse.json({ error: 'Faltan campos: entidad, nombre, tipo' }, { status: 400 });
    }
    if (!ENTIDADES.includes(entidad)) {
      return NextResponse.json({ error: 'Entidad no válida' }, { status: 400 });
    }
    if (!TIPOS.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    }

    const field = await prisma.customField.create({
      data: {
        companyId,
        entidad,
        nombre,
        tipo,
        obligatorio: !!obligatorio,
        opciones: tipo === 'select' ? opciones || [] : [],
        orden: Number(orden) || 0,
        activo: true,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error('[campos-personalizados POST]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json({ error: 'Company requerida' }, { status: 400 });

    const body = await req.json();
    const { id, nombre, tipo, obligatorio, opciones, orden, activo } = body;
    if (!id) {
      return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    }

    const existing = await prisma.customField.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Campo no encontrado' }, { status: 404 });
    }

    const updated = await prisma.customField.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(tipo !== undefined && { tipo }),
        ...(obligatorio !== undefined && { obligatorio: !!obligatorio }),
        ...(opciones !== undefined && { opciones }),
        ...(orden !== undefined && { orden: Number(orden) }),
        ...(activo !== undefined && { activo }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[campos-personalizados PUT]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
