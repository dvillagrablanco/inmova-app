import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  contractId: z.string().min(1),
  fechaRevision: z.string(),
  tipo: z.enum(['IPC', 'pactado', 'renta_referencia', 'IRAV']).default('IPC'),
  rentaAnterior: z.number().min(0),
  rentaNueva: z.number().min(0),
  estado: z.enum(['pendiente', 'comunicada', 'aplicada', 'rechazada']).default('pendiente'),
  fechaComunicacion: z.string().nullable().optional(),
  notas: z.string().optional(),
});

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
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');

    const where: Record<string, unknown> = { companyId };
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const updates = await prisma.rentUpdate.findMany({
      where: where as any,
      include: {
        contract: {
          select: {
            id: true,
            tenant: { select: { nombre: true, apellidos: true } },
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        },
      },
      orderBy: { fechaRevision: 'desc' },
    });

    const formatted = updates.map((u: any) => ({
      id: u.id,
      contratoId: u.contractId,
      contratoRef: u.contractId,
      inquilinoNombre: u.contract?.tenant
        ? `${u.contract.tenant.nombre} ${u.contract.tenant.apellidos || ''}`.trim()
        : '',
      inmuebleNombre: u.contract?.unit
        ? `${u.contract.unit.building?.nombre || ''} - ${u.contract.unit.numero}`.trim()
        : '',
      fechaRevision: u.fechaRevision.toISOString().split('T')[0],
      tipo: u.tipo,
      rentaAnterior: u.rentaAnterior,
      rentaNueva: u.rentaNueva,
      incrementoPorcentaje: u.incrementoPorcentaje,
      estado: u.estado,
      fechaComunicacion: u.fechaComunicacion?.toISOString().split('T')[0] || null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[actualizaciones-renta GET]:', error);
    return NextResponse.json(
      { error: 'Error al obtener actualizaciones de renta' },
      { status: 500 }
    );
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
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const incrementoPorcentaje =
      data.rentaAnterior > 0
        ? ((data.rentaNueva - data.rentaAnterior) / data.rentaAnterior) * 100
        : 0;

    const entry = await prisma.rentUpdate.create({
      data: {
        companyId,
        contractId: data.contractId,
        fechaRevision: new Date(data.fechaRevision),
        tipo: data.tipo,
        rentaAnterior: data.rentaAnterior,
        rentaNueva: data.rentaNueva,
        incrementoPorcentaje: Math.round(incrementoPorcentaje * 100) / 100,
        estado: data.estado,
        fechaComunicacion: data.fechaComunicacion ? new Date(data.fechaComunicacion) : null,
        notas: data.notas || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('[actualizaciones-renta POST]:', error);
    return NextResponse.json({ error: 'Error al crear actualización de renta' }, { status: 500 });
  }
}
