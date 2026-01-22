/**
 * API Route: Análisis de Contratos con IA
 * 
 * Endpoint especializado para analizar contratos de arrendamiento
 * y extraer datos automáticamente (fechas, importes, partes, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY no configurado');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

const CONTRACT_EXTRACTION_PROMPT = `Eres un experto en análisis de contratos de arrendamiento españoles.

TAREA: Analiza el siguiente contrato y extrae todos los datos relevantes.

INFORMACIÓN DEL ARCHIVO:
- Nombre: {filename}
- Tipo: {filetype}

TEXTO/CONTENIDO DEL CONTRATO:
---
{document_text}
---

DATOS A EXTRAER:

1. FECHAS:
- fechaInicio: Fecha de inicio del contrato (formato YYYY-MM-DD)
- fechaFin: Fecha de fin del contrato (formato YYYY-MM-DD)

2. IMPORTES:
- rentaMensual: Renta mensual en euros (solo número)
- deposito: Depósito o fianza en euros (solo número)

3. TIPO DE CONTRATO:
- tipo: "residencial", "comercial" o "temporal"

4. ARRENDADOR (propietario):
- arrendadorNombre: Nombre completo
- arrendadorDNI: DNI/NIF del arrendador

5. ARRENDATARIO (inquilino):
- arrendatarioNombre: Nombre completo
- arrendatarioDNI: DNI/NIE del arrendatario
- arrendatarioEmail: Email (si aparece)
- arrendatarioTelefono: Teléfono (si aparece)

6. INMUEBLE:
- direccionInmueble: Dirección completa del inmueble
- superficieM2: Superficie en metros cuadrados

7. OTROS:
- clausulasEspeciales: Resumen de cláusulas especiales importantes

REGLAS:
1. Solo extrae datos que estén claramente indicados en el contrato
2. Para fechas, usa formato YYYY-MM-DD
3. Para importes, solo números sin símbolo de euro
4. Si no encuentras un dato, NO lo incluyas en la respuesta
5. Normaliza nombres (primera letra mayúscula)

RESPONDE EN JSON:
{
  "documentType": "contrato_arrendamiento_vivienda" | "contrato_arrendamiento_local" | "contrato_temporal" | "otro",
  "confidence": 0.0-1.0,
  "extractedData": {
    "fechaInicio": "YYYY-MM-DD o null",
    "fechaFin": "YYYY-MM-DD o null",
    "rentaMensual": "número o null",
    "deposito": "número o null",
    "tipo": "residencial/comercial/temporal o null",
    "arrendadorNombre": "string o null",
    "arrendadorDNI": "string o null",
    "arrendatarioNombre": "string o null",
    "arrendatarioDNI": "string o null",
    "arrendatarioEmail": "string o null",
    "arrendatarioTelefono": "string o null",
    "direccionInmueble": "string o null",
    "superficieM2": "número o null",
    "clausulasEspeciales": "string o null"
  },
  "summary": "Resumen breve del contrato",
  "warnings": ["advertencia1", "advertencia2"]
}`;

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return await file.text();
  }

  const basicInfo = `
Nombre de archivo: ${file.name}
Tipo MIME: ${file.type}
Tamaño: ${(file.size / 1024).toFixed(2)} KB
  `.trim();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let extractedText = '';
    let textChars: number[] = [];
    
    for (let i = 0; i < uint8Array.length && extractedText.length < 50000; i++) {
      const byte = uint8Array[i];
      if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
        textChars.push(byte);
      } else if (textChars.length > 10) {
        const text = String.fromCharCode(...textChars);
        if (text.trim().length > 5 && /[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/.test(text)) {
          extractedText += text + ' ';
        }
        textChars = [];
      } else {
        textChars = [];
      }
    }
    
    if (extractedText.trim().length > 50) {
      return basicInfo + '\n\nTexto extraído:\n' + extractedText.trim();
    }
  } catch (e) {
    logger.warn('[Contract Analysis] Error extrayendo texto:', e);
  }

  return basicInfo;
}

function basicAnalysis(filename: string) {
  return {
    documentType: 'contrato',
    confidence: 0.3,
    extractedData: {},
    summary: `Documento: ${filename}. Configure ANTHROPIC_API_KEY para análisis con IA.`,
    warnings: ['IA no configurada - no se pueden extraer datos automáticamente'],
  };
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande (máx 10MB)' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(basicAnalysis(file.name));
    }

    logger.info('[Contract Analysis] Iniciando análisis', {
      filename: file.name,
      fileType: file.type,
      userId: session.user.id,
    });

    let messages: Anthropic.MessageCreateParams['messages'];
    
    if (file.type.startsWith('image/')) {
      const base64Data = await fileToBase64(file);
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      
      messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: CONTRACT_EXTRACTION_PROMPT.replace('{filename}', file.name).replace('{filetype}', file.type).replace('{document_text}', 'Ver imagen adjunta') },
        ],
      }];
    } else {
      const extractedText = await extractTextFromFile(file);
      messages = [{
        role: 'user',
        content: CONTRACT_EXTRACTION_PROMPT.replace('{filename}', file.name).replace('{filetype}', file.type).replace('{document_text}', extractedText),
      }];
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.1,
      messages,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo parsear la respuesta');
    }

    const result = JSON.parse(jsonMatch[0]);

    const cleanedData: Record<string, string> = {};
    if (result.extractedData) {
      Object.entries(result.extractedData).forEach(([key, value]) => {
        if (value && value !== 'null' && value !== null) {
          cleanedData[key] = String(value);
        }
      });
    }

    logger.info('[Contract Analysis] Completado', {
      filename: file.name,
      fieldsExtracted: Object.keys(cleanedData).length,
      processingTimeMs: Date.now() - startTime,
    });

    return NextResponse.json({
      documentType: result.documentType,
      confidence: result.confidence,
      extractedData: cleanedData,
      summary: result.summary,
      warnings: result.warnings || [],
    });

  } catch (error: any) {
    logger.error('[Contract Analysis] Error:', error);
    return NextResponse.json(
      { error: 'Error al analizar', details: error.message, extractedData: {}, warnings: ['Error durante el análisis'] },
      { status: 500 }
    );
  }
}
