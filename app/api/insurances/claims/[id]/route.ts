import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateClaimSchema = z.object({
  estado: z.enum(['abierto', 'en_revision', 'aprobado', 'rechazado', 'cerrado']).optional(),
  montoAprobado: z.number().positive().optional(),
  notas: z.string().optional(),
  fechaCierre: z.string().datetime().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();

    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: params.id },
      include: {
        insurance: {
          select: {
            id: true,
            numeroPoliza: true,
            aseguradora: true,
            companyId: true,
          },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Siniestro no encontrado' }, { status: 404 });
    }

    if (claim.insurance.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: claim });
  } catch (error: any) {
    console.error('[Claim Detail Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo siniestro' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();

    // Verificar acceso
    const existingClaim = await prisma.insuranceClaim.findUnique({
      where: { id: params.id },
      include: {
        insurance: {
          select: { companyId: true },
        },
      },
    });

    if (!existingClaim) {
      return NextResponse.json({ error: 'Siniestro no encontrado' }, { status: 404 });
    }

    if (existingClaim.insurance.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateClaimSchema.parse(body);

    // Actualizar
    const updated = await prisma.insuranceClaim.update({
      where: { id: params.id },
      data: {
        ...(validated.estado && { estado: validated.estado }),
        ...(validated.montoAprobado && { montoAprobado: validated.montoAprobado }),
        ...(validated.notas && { notas: validated.notas }),
        ...(validated.fechaCierre && { fechaCierre: new Date(validated.fechaCierre) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Siniestro actualizado correctamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Claim Update Error]:', error);
    return NextResponse.json({ error: 'Error actualizando siniestro' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();

    // Verificar acceso
    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: params.id },
      include: {
        insurance: {
          select: { companyId: true },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Siniestro no encontrado' }, { status: 404 });
    }

    if (claim.insurance.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Eliminar
    await prisma.insuranceClaim.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Siniestro eliminado correctamente',
    });
  } catch (error: any) {
    console.error('[Claim Delete Error]:', error);
    return NextResponse.json({ error: 'Error eliminando siniestro' }, { status: 500 });
  }
}
