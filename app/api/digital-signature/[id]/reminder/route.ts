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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const documento = await prisma.documentoFirma.findUnique({
      where: { id: params.id },
      include: { firmantes: { where: { estado: 'pendiente' } } },
    });

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    for (const firmante of documento.firmantes) {
      await prisma.firmante.update({
        where: { id: firmante.id },
        data: {
          recordatoriosEnviados: firmante.recordatoriosEnviados + 1,
          ultimoRecordatorio: new Date(),
        },
      });
    }

    logger.info(
      `[Digital Signature] Reminder sent for ${params.id} to ${documento.firmantes.length} signers`
    );

    return NextResponse.json({
      success: true,
      message: `Recordatorio enviado a ${documento.firmantes.length} firmante(s) pendiente(s)`,
    });
  } catch (error: any) {
    logger.error('[Digital Signature] Error reminder:', error);
    return NextResponse.json({ error: 'Error enviando recordatorio' }, { status: 500 });
  }
}
