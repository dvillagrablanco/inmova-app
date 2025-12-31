import { NextRequest, NextResponse } from 'next/server';
import { firmarDocumento } from '@/lib/digital-signature-service';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: documentoId } = params;
    const body = await request.json();
    const { firmanteId, nombreCompleto, dni, ubicacion } = body;

    if (!firmanteId || !nombreCompleto) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verificar que el firmante existe
    const firmante = await prisma.firmante.findFirst({
      where: {
        id: firmanteId,
        documentoId: documentoId,
      },
      include: {
        documento: true,
      },
    });

    if (!firmante) {
      return NextResponse.json({ error: 'Firmante no encontrado' }, { status: 404 });
    }

    // Verificar que el documento no ha expirado
    if (firmante.documento.fechaExpiracion && new Date() > firmante.documento.fechaExpiracion) {
      return NextResponse.json({ error: 'El documento ha expirado' }, { status: 400 });
    }

    const result = await firmarDocumento(documentoId, firmanteId, {
      nombreCompleto,
      dni,
      ubicacion,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Error firmando documento:', error);
    return NextResponse.json(
      { error: error.message || 'Error firmando documento' },
      { status: 500 }
    );
  }
}
