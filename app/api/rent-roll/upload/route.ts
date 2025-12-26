import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { RentRollOCRService } from '@/lib/services/rent-roll-ocr-service';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const unitId = formData.get('unitId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Procesar documento con OCR
    const parsedData = await RentRollOCRService.processDocument(
      buffer,
      file.name,
      session.user.id
    );

    // Validar rent roll
    const validation = RentRollOCRService.validateRentRoll(parsedData);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Documento inválido',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Guardar rent roll en base de datos
    const rentRoll = await RentRollOCRService.saveRentRoll(
      session.user.id,
      unitId,
      parsedData,
      file.name
    );

    // Generar resumen
    const summary = RentRollOCRService.generateSummary(parsedData);

    return NextResponse.json({
      rentRoll,
      parsedData,
      summary,
      validation,
    });
  } catch (error) {
    console.error('Error procesando rent roll:', error);
    return NextResponse.json(
      { error: 'Error procesando documento' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
