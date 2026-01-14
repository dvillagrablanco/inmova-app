import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { analyzeDocument, validateDocumentOwnership } from '@/lib/ai-document-agent-service';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    const companyId = session.user?.companyId;

    if (!file && !documentId) {
      return NextResponse.json({ error: 'Se requiere archivo o ID de documento' }, { status: 400 });
    }

    // Obtener información de la empresa para validación
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { cif: true, nombre: true, direccion: true }
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    let textContent = '';
    let filename = '';
    let mimeType = '';

    // Si viene archivo directo
    if (file) {
      filename = file.name;
      mimeType = file.type;
      
      // TODO: Implementar extracción de texto real (OCR/PDF parse)
      // Por ahora simulamos con el contenido si es texto o placeholder
      if (file.type === 'text/plain') {
        textContent = await file.text();
      } else {
        // En un caso real, aquí llamaríamos al servicio de OCR/Textract
        textContent = "Contenido simulado del documento para análisis de IA..."; 
      }
    } else if (documentId) {
      // Recuperar documento existente
      const doc = await prisma.document.findUnique({
        where: { id: documentId }
      });
      if (!doc) {
        return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
      }
      filename = doc.nombre;
      mimeType = doc.tipo;
      // Aquí se leería el contenido del S3/Storage
      textContent = "Contenido recuperado del documento almacenado...";
    }

    // Ejecutar análisis de IA
    const analysisResult = await analyzeDocument({
      text: textContent,
      filename,
      mimeType,
      companyInfo: {
        cif: company.cif || null,
        nombre: company.nombre,
        direccion: company.direccion
      }
    });

    // Guardar resultado si es un documento existente
    if (documentId) {
      // Opcional: guardar metadatos extraídos en el documento
    }

    return NextResponse.json(analysisResult);

  } catch (error: any) {
    logger.error('Error in AI document analysis:', error);
    return NextResponse.json(
      { error: 'Error analizando documento', details: error.message },
      { status: 500 }
    );
  }
}
