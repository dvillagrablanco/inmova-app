import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const documento = await prisma.documentoFirma.findUnique({
      where: { id: params.id },
      include: {
        firmantes: true,
        tenant: { select: { nombreCompleto: true } },
        contract: {
          select: {
            unit: {
              select: {
                numero: true,
                building: { select: { nombre: true } },
              },
            },
          },
        },
        company: { select: { nombre: true } },
      },
    });

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ documento });
  } catch (error: any) {
    logger.error('[Digital Signature] Error detail:', error);
    return NextResponse.json({ error: 'Error obteniendo documento' }, { status: 500 });
  }
}
