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

const createSchema = z.object({
  propietario: z.string().min(1),
  inmuebles: z.array(z.string()).min(1),
  tipo: z.enum(['integral', 'parcial', 'subarriendo']),
  honorarios: z.number().optional(),
  honorariosPorcentaje: z.number().min(0).max(100).optional(),
  fechaInicio: z.string(),
  fechaFin: z.string(),
  condiciones: z.string().optional(),
  notas: z.string().optional(),
});

export async function GET() {
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
      return NextResponse.json([]);
    }

    try {
      const contracts = await prisma.managementContract.findMany({
        where: { companyId: user.companyId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(contracts);
    } catch {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('[ContratosGestion API] Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 400 });
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    if (!validated.honorarios && !validated.honorariosPorcentaje) {
      return NextResponse.json(
        { error: 'Debe especificar honorarios fijos o porcentaje' },
        { status: 400 }
      );
    }

    const contract = await prisma.managementContract.create({
      data: {
        companyId: user.companyId,
        propietario: validated.propietario,
        inmuebles: validated.inmuebles,
        tipo: validated.tipo as any,
        honorarios: validated.honorarios,
        honorariosPorcentaje: validated.honorariosPorcentaje,
        fechaInicio: new Date(validated.fechaInicio),
        fechaFin: new Date(validated.fechaFin),
        estado: 'borrador',
        condiciones: validated.condiciones,
        notas: validated.notas,
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[ContratosGestion API] Error:', error);
    return NextResponse.json({ error: 'Error al crear contrato de gestión' }, { status: 500 });
  }
}
