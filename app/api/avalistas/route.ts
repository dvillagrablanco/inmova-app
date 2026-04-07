import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  contractId: z.string().min(1),
  nombre: z.string().min(1),
  dni: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tipoGarantia: z.enum(['personal', 'bancaria', 'seguro']).default('personal'),
  importe: z.number().min(0).default(0),
  estado: z.enum(['activo', 'liberado', 'ejecutado']).default('activo'),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
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
    const tipoGarantia = searchParams.get('tipoGarantia');

    const where: Record<string, unknown> = { companyId };
    if (estado) where.estado = estado;
    if (tipoGarantia) where.tipoGarantia = tipoGarantia;

    const guarantors = await prisma.guarantor.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    const formatted = guarantors.map((g: any) => ({
      id: g.id,
      nombre: g.nombre,
      dni: g.dni,
      telefono: g.telefono,
      email: g.email,
      contratoId: g.contractId,
      contratoRef: g.contractId,
      inmuebleNombre: g.contract?.unit
        ? `${g.contract.unit.building?.nombre || ''} - ${g.contract.unit.numero}`
        : '',
      tipoGarantia: g.tipoGarantia,
      importe: g.importe,
      estado: g.estado,
      fechaInicio: g.fechaInicio?.toISOString().split('T')[0] || null,
      fechaFin: g.fechaFin?.toISOString().split('T')[0] || null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[avalistas GET]:', error);
    return NextResponse.json({ error: 'Error al obtener avalistas' }, { status: 500 });
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
    const entry = await prisma.guarantor.create({
      data: {
        companyId,
        contractId: data.contractId,
        nombre: data.nombre,
        dni: data.dni || null,
        telefono: data.telefono || null,
        email: data.email || null,
        tipoGarantia: data.tipoGarantia,
        importe: data.importe,
        estado: data.estado,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        notas: data.notas || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('[avalistas POST]:', error);
    return NextResponse.json({ error: 'Error al crear avalista' }, { status: 500 });
  }
}
