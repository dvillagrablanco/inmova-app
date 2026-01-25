/**
 * API Route: Análisis General de Documentos con IA
 * 
 * Endpoint para clasificar y extraer datos de cualquier tipo de documento:
 * - Contratos
 * - DNI/NIE
 * - Seguros
 * - Certificados energéticos
 * - Facturas
 * - Nóminas
 * - Garantías/Avales
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
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurado');
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

const GENERAL_ANALYSIS_PROMPT = `Eres un experto en análisis y clasificación de documentos inmobiliarios y empresariales españoles.

TAREA: Analiza el siguiente documento, clasifícalo y extrae todos los datos relevantes.

INFORMACIÓN DEL ARCHIVO:
- Nombre: {filename}
- Tipo MIME: {filetype}
- Contexto de uso: {context}

CONTENIDO DEL DOCUMENTO:
---
{document_text}
---

CATEGORÍAS DE DOCUMENTOS (usa estos valores exactos):
- contrato: Contratos de arrendamiento, compraventa
- dni: DNI, NIE, pasaporte, documentos de identidad
- seguro: Pólizas de seguros (hogar, RC, multirriesgo)
- certificado_energetico: Certificados de eficiencia energética
- factura: Facturas de proveedores
- nomina: Nóminas, recibos de salario
- ite: Informes ITE/IEE (inspección técnica edificios)
- garantia: Avales bancarios, garantías, seguros de caución
- otro: Documentos no clasificables

DATOS A EXTRAER según tipo de documento:

PARA CONTRATOS:
- fechaInicio, fechaFin (YYYY-MM-DD)
- rentaMensual, deposito (solo números)
- nombre del arrendador y arrendatario

PARA DNI/NIE:
- numeroDocumento, titular, nacionalidad
- fechaVencimiento si aparece

PARA SEGUROS:
- poliza (número), aseguradora
- cobertura (resumen), prima (importe anual)
- fechaVencimiento

PARA CERTIFICADOS ENERGÉTICOS:
- calificacion (letra A-G)
- registroNumero
- fechaVencimiento

PARA FACTURAS:
- proveedor, importe, concepto
- fechaEmision

PARA GARANTÍAS:
- tipo de garantía
- importe, entidad
- fechaVencimiento

PARA TODOS:
- nombre: Un nombre descriptivo sugerido para el documento
- fechaVencimiento: Si aplica (YYYY-MM-DD)
- resumen: Breve descripción del contenido

REGLAS:
1. Clasifica el documento en UNA de las categorías
2. Solo extrae datos que puedas identificar con certeza
3. Fechas en formato YYYY-MM-DD
4. Importes solo números (sin € ni puntos de miles)
5. Si no encuentras un dato, NO lo incluyas

RESPONDE EN JSON:
{
  "documentType": "categoria",
  "suggestedCategory": "categoria (mismo valor)",
  "confidence": 0.0-1.0,
  "extractedData": {
    "nombre": "string",
    "tipo": "string",
    "fechaVencimiento": "YYYY-MM-DD o null",
    ... (campos según tipo)
  },
  "summary": "Breve descripción del documento",
  "warnings": ["advertencia si hay alguna"]
}`;

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return await file.text();
  }

  const basicInfo = `Nombre: ${file.name}\nTipo: ${file.type}\nTamaño: ${(file.size / 1024).toFixed(2)} KB`;

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
    logger.warn('[General Document Analysis] Error extrayendo texto:', e);
  }

  return basicInfo;
}

function basicAnalysis(filename: string) {
  const lowerName = filename.toLowerCase();
  let category = 'otro';
  
  if (lowerName.includes('contrato') || lowerName.includes('arrendamiento')) category = 'contrato';
  else if (lowerName.includes('dni') || lowerName.includes('nie') || lowerName.includes('identidad')) category = 'dni';
  else if (lowerName.includes('seguro') || lowerName.includes('poliza')) category = 'seguro';
  else if (lowerName.includes('certificado') && lowerName.includes('energ')) category = 'certificado_energetico';
  else if (lowerName.includes('factura')) category = 'factura';
  else if (lowerName.includes('nomina') || lowerName.includes('nómina')) category = 'nomina';
  else if (lowerName.includes('ite') || lowerName.includes('iee')) category = 'ite';
  else if (lowerName.includes('aval') || lowerName.includes('garantia') || lowerName.includes('garantía')) category = 'garantia';

  return {
    documentType: category,
    suggestedCategory: category,
    confidence: 0.3,
    extractedData: { nombre: filename },
    summary: `Documento: ${filename}. Configure ANTHROPIC_API_KEY para análisis con IA.`,
    warnings: ['IA no configurada'],
  };
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
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
    const context = (formData.get('context') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo no permitido' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo muy grande (máx 10MB)' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(basicAnalysis(file.name));
    }

    logger.info('[General Document Analysis] Iniciando', {
      filename: file.name,
      context,
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
          { 
            type: 'text', 
            text: GENERAL_ANALYSIS_PROMPT
              .replace('{filename}', file.name)
              .replace('{filetype}', file.type)
              .replace('{context}', context)
              .replace('{document_text}', 'Ver imagen adjunta') 
          },
        ],
      }];
    } else {
      const extractedText = await extractTextFromFile(file);
      messages = [{
        role: 'user',
        content: GENERAL_ANALYSIS_PROMPT
          .replace('{filename}', file.name)
          .replace('{filetype}', file.type)
          .replace('{context}', context)
          .replace('{document_text}', extractedText),
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
      throw new Error('No se pudo parsear respuesta');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Limpiar datos
    const cleanedData: Record<string, string> = {};
    if (result.extractedData) {
      Object.entries(result.extractedData).forEach(([key, value]) => {
        if (value && value !== 'null' && value !== null) {
          cleanedData[key] = String(value);
        }
      });
    }

    logger.info('[General Document Analysis] Completado', {
      filename: file.name,
      category: result.suggestedCategory,
      fieldsExtracted: Object.keys(cleanedData).length,
      processingTimeMs: Date.now() - startTime,
    });

    return NextResponse.json({
      documentType: result.documentType,
      suggestedCategory: result.suggestedCategory || result.documentType,
      confidence: result.confidence,
      extractedData: cleanedData,
      summary: result.summary,
      warnings: result.warnings || [],
    });

  } catch (error: any) {
    logger.error('[General Document Analysis] Error:', error);
    return NextResponse.json(
      { error: 'Error al analizar', details: error.message, extractedData: {} },
      { status: 500 }
    );
  }
}
