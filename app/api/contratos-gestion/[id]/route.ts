import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const updateSchema = z.object({
  propietario: z.string().min(1).optional(),
  inmuebles: z.array(z.string()).min(1).optional(),
  tipo: z.enum(['integral', 'parcial', 'subarriendo']).optional(),
  honorarios: z.number().optional().nullable(),
  honorariosPorcentaje: z.number().min(0).max(100).optional().nullable(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  condiciones: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  estado: z.enum(['borrador', 'pendiente', 'activo', 'vencido', 'cancelado']).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 400 });
    }

    const contract = await prisma.managementContract.findFirst({
      where: { id: params.id, companyId: user.companyId },
    });

    if (!contract) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('[ContratosGestion GET id] Error:', error);
    return NextResponse.json({ error: 'Error al obtener contrato' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 400 });
    }

    const existing = await prisma.managementContract.findFirst({
      where: { id: params.id, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const data: Record<string, unknown> = {};
    if (validated.propietario !== undefined) data.propietario = validated.propietario;
    if (validated.inmuebles !== undefined) data.inmuebles = validated.inmuebles;
    if (validated.tipo !== undefined) data.tipo = validated.tipo;
    if (validated.honorarios !== undefined) data.honorarios = validated.honorarios;
    if (validated.honorariosPorcentaje !== undefined)
      data.honorariosPorcentaje = validated.honorariosPorcentaje;
    if (validated.condiciones !== undefined) data.condiciones = validated.condiciones;
    if (validated.notas !== undefined) data.notas = validated.notas;
    if (validated.estado !== undefined) data.estado = validated.estado;
    if (validated.fechaInicio !== undefined) data.fechaInicio = new Date(validated.fechaInicio);
    if (validated.fechaFin !== undefined) data.fechaFin = new Date(validated.fechaFin);

    const updated = await prisma.managementContract.update({
      where: { id: params.id },
      data: data as any,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[ContratosGestion PATCH] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
