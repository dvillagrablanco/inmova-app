import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createClaimSchema = z.object({
  tipo: z.string().min(1, 'Tipo requerido'),
  fechaSiniestro: z.string().datetime(),
  descripcion: z.string().min(10, 'Descripción mínima 10 caracteres'),
  montoReclamado: z.number().positive().optional(),
  documentos: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();

    // Verificar acceso al seguro
    const insurance = await prisma.insurance.findUnique({
      where: { id: params.id },
      select: { companyId: true },
    });

    if (!insurance || insurance.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener siniestros
    const claims = await prisma.insuranceClaim.findMany({
      where: { insuranceId: params.id },
      orderBy: { fechaSiniestro: 'desc' },
    });

    return NextResponse.json({ success: true, data: claims });
  } catch (error: any) {
    console.error('[Claims List Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo siniestros' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();

    // Verificar acceso
    const insurance = await prisma.insurance.findUnique({
      where: { id: params.id },
      select: { companyId: true, numeroPoliza: true },
    });

    if (!insurance || insurance.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createClaimSchema.parse(body);

    // Generar número de reclamo único
    const claimCount = await prisma.insuranceClaim.count({
      where: { insuranceId: params.id },
    });
    const numeroReclamo = `SIN-${new Date().getFullYear()}-${String(claimCount + 1).padStart(4, '0')}`;

    // Crear siniestro
    const claim = await prisma.insuranceClaim.create({
      data: {
        insuranceId: params.id,
        numeroReclamo,
        tipo: validated.tipo,
        fechaSiniestro: new Date(validated.fechaSiniestro),
        descripcion: validated.descripcion,
        montoReclamado: validated.montoReclamado,
        documentosAdjuntos: validated.documentos || [],
        estado: 'abierto',
      },
    });

    // TODO: Enviar notificación por email
    // TODO: Crear tarea de seguimiento

    return NextResponse.json(
      {
        success: true,
        data: claim,
        message: 'Siniestro reportado correctamente',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Claim Create Error]:', error);
    return NextResponse.json({ error: 'Error creando siniestro' }, { status: 500 });
  }
}
