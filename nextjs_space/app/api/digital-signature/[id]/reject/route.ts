import { NextRequest, NextResponse } from 'next/server';
import { rechazarDocumento } from '@/lib/digital-signature-service';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: documentoId } = params;
    const body = await request.json();
    const { firmanteId, motivo } = body;

    if (!firmanteId || !motivo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el firmante existe
    const firmante = await prisma.firmante.findFirst({
      where: {
        id: firmanteId,
        documentoId: documentoId
      }
    });

    if (!firmante) {
      return NextResponse.json(
        { error: 'Firmante no encontrado' },
        { status: 404 }
      );
    }

    const result = await rechazarDocumento(documentoId, firmanteId, motivo);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error rechazando documento:', error);
    return NextResponse.json(
      { error: error.message || 'Error rechazando documento' },
      { status: 500 }
    );
  }
}
