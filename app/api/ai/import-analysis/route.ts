/**
 * API: POST /api/ai/import-analysis
 * Analiza archivos de importación con IA para detectar tipo de datos,
 * validar formato y sugerir mapeo de columnas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

// Tipos de entidad conocidos
const ENTITY_TYPES = {
  buildings: {
    keywords: ['edificio', 'building', 'inmueble', 'propiedad', 'finca', 'direccion', 'address', 'planta', 'floor'],
    requiredFields: ['nombre', 'direccion'],
    commonFields: ['nombre', 'direccion', 'ciudad', 'codigo_postal', 'provincia', 'pais', 'num_plantas', 'num_unidades', 'año_construccion', 'tipo'],
  },
  units: {
    keywords: ['unidad', 'unit', 'piso', 'apartamento', 'apartment', 'vivienda', 'local', 'habitacion', 'room', 'superficie', 'metros'],
    requiredFields: ['codigo', 'tipo'],
    commonFields: ['codigo', 'tipo', 'planta', 'superficie', 'habitaciones', 'baños', 'precio_alquiler', 'estado', 'edificio_id', 'descripcion'],
  },
  tenants: {
    keywords: ['inquilino', 'tenant', 'arrendatario', 'nombre', 'apellido', 'dni', 'nie', 'email', 'telefono', 'phone'],
    requiredFields: ['nombre', 'email'],
    commonFields: ['nombre', 'apellidos', 'email', 'telefono', 'dni_nie', 'fecha_nacimiento', 'nacionalidad', 'profesion', 'direccion'],
  },
  contracts: {
    keywords: ['contrato', 'contract', 'alquiler', 'rent', 'arrendamiento', 'fecha_inicio', 'fecha_fin', 'renta', 'fianza'],
    requiredFields: ['fecha_inicio', 'renta_mensual'],
    commonFields: ['numero_contrato', 'fecha_inicio', 'fecha_fin', 'renta_mensual', 'fianza', 'inquilino_id', 'unidad_id', 'estado', 'tipo'],
  },
  payments: {
    keywords: ['pago', 'payment', 'cobro', 'recibo', 'importe', 'amount', 'factura', 'invoice'],
    requiredFields: ['fecha_pago', 'importe'],
    commonFields: ['fecha_pago', 'importe', 'concepto', 'metodo_pago', 'contrato_id', 'inquilino_id', 'estado', 'referencia'],
  },
  providers: {
    keywords: ['proveedor', 'provider', 'supplier', 'empresa', 'company', 'cif', 'nif', 'servicio'],
    requiredFields: ['nombre'],
    commonFields: ['nombre', 'cif', 'email', 'telefono', 'direccion', 'tipo_servicio', 'persona_contacto', 'web'],
  },
  expenses: {
    keywords: ['gasto', 'expense', 'coste', 'cost', 'factura', 'invoice', 'importe', 'categoria'],
    requiredFields: ['fecha', 'importe'],
    commonFields: ['fecha', 'importe', 'concepto', 'categoria', 'proveedor_id', 'propiedad_id', 'factura_numero', 'estado'],
  },
};

// Función para leer contenido de CSV
async function parseCSVContent(file: File): Promise<{ headers: string[]; rows: string[][]; rawSample: string }> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('El archivo está vacío');
  }

  // Detectar delimitador
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  } else if (firstLine.includes('\t')) {
    delimiter = '\t';
  }

  // Parsear headers y filas
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => 
    line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );

  // Muestra del contenido raw (primeras líneas)
  const rawSample = lines.slice(0, 10).join('\n');

  return { headers, rows, rawSample };
}

// Función para analizar tipos de datos de columnas
function analyzeColumnTypes(headers: string[], rows: string[][]): Array<{
  name: string;
  detectedType: string;
  sampleValues: string[];
  nullCount: number;
  uniqueCount: number;
}> {
  return headers.map((header, colIndex) => {
    const values = rows.map(row => row[colIndex] || '').filter(v => v.trim() !== '');
    const nullCount = rows.length - values.length;
    const uniqueValues = [...new Set(values)];

    // Detectar tipo
    let detectedType = 'string';
    
    if (values.length > 0) {
      const sampleValues = values.slice(0, 10);
      
      // Email
      if (sampleValues.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
        detectedType = 'email';
      }
      // Teléfono
      else if (sampleValues.every(v => /^[\d\s\-\+\(\)]{6,}$/.test(v))) {
        detectedType = 'phone';
      }
      // Fecha
      else if (sampleValues.every(v => /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/.test(v))) {
        detectedType = 'date';
      }
      // Moneda/Número con decimales
      else if (sampleValues.every(v => /^[\d\.,]+\s*€?$/.test(v))) {
        detectedType = 'currency';
      }
      // Número
      else if (sampleValues.every(v => /^-?\d+(\.\d+)?$/.test(v))) {
        detectedType = 'number';
      }
      // Boolean
      else if (sampleValues.every(v => /^(true|false|si|no|yes|1|0)$/i.test(v))) {
        detectedType = 'boolean';
      }
    }

    return {
      name: header,
      detectedType,
      sampleValues: values.slice(0, 3),
      nullCount,
      uniqueCount: uniqueValues.length,
    };
  });
}

// Detectar tipo de entidad basado en headers
function detectEntityType(headers: string[]): { entityType: string; confidence: number } {
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[_\-\s]/g, ''));
  
  let bestMatch = { entityType: 'unknown', score: 0, maxScore: 0 };

  for (const [entityType, config] of Object.entries(ENTITY_TYPES)) {
    let score = 0;
    let maxScore = config.keywords.length + config.requiredFields.length * 2;

    // Verificar keywords
    for (const keyword of config.keywords) {
      if (normalizedHeaders.some(h => h.includes(keyword.toLowerCase()))) {
        score += 1;
      }
    }

    // Verificar campos requeridos (mayor peso)
    for (const field of config.requiredFields) {
      if (normalizedHeaders.some(h => h.includes(field.toLowerCase().replace(/[_\-\s]/g, '')))) {
        score += 2;
      }
    }

    if (score > bestMatch.score) {
      bestMatch = { entityType, score, maxScore };
    }
  }

  // Calcular confianza
  const confidence = bestMatch.maxScore > 0 ? Math.min(bestMatch.score / bestMatch.maxScore, 1) : 0;

  return { entityType: bestMatch.entityType, confidence };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const allowedExtensions = ['.csv', '.txt'];
    
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    const hasValidType = allowedTypes.includes(file.type) || file.type === '';

    if (!hasValidExtension && !hasValidType) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no soportado. Por favor sube un archivo CSV.' 
      }, { status: 400 });
    }

    // Parsear CSV
    const { headers, rows, rawSample } = await parseCSVContent(file);

    if (headers.length === 0) {
      return NextResponse.json({ error: 'No se pudieron detectar columnas en el archivo' }, { status: 400 });
    }

    // Análisis básico de columnas
    const columnAnalysis = analyzeColumnTypes(headers, rows);

    // Detección inicial de tipo de entidad
    const initialDetection = detectEntityType(headers);

    // Usar Claude para análisis más profundo si hay API key
    let aiAnalysis: any = null;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey.length > 10) {
      try {
        const anthropic = new Anthropic({ apiKey });

        const prompt = `Analiza este archivo CSV para importación de datos en una aplicación de gestión inmobiliaria.

HEADERS DEL ARCHIVO:
${headers.join(', ')}

MUESTRA DE DATOS (primeras líneas):
${rawSample}

ANÁLISIS DE COLUMNAS:
${columnAnalysis.map(col => `- ${col.name}: ${col.detectedType} (${col.uniqueCount} valores únicos, ${col.nullCount} vacíos)`).join('\n')}

DETECCIÓN INICIAL: ${initialDetection.entityType} (${Math.round(initialDetection.confidence * 100)}% confianza)

Los tipos de datos posibles son:
- buildings: Edificios/Inmuebles
- units: Unidades/Pisos/Apartamentos
- tenants: Inquilinos
- contracts: Contratos de alquiler
- payments: Pagos
- providers: Proveedores
- expenses: Gastos

Por favor proporciona:
1. El tipo de entidad más probable y por qué
2. Mapeo sugerido de columnas del archivo a campos del sistema
3. Problemas de validación detectados (errores, advertencias)
4. Recomendaciones para una importación exitosa

Responde en formato JSON con esta estructura:
{
  "suggestedEntityType": "string",
  "entityTypeConfidence": number (0-1),
  "entityTypeReasoning": "string explicando la detección",
  "mappingSuggestions": { "columna_archivo": "campo_sistema" },
  "validationIssues": [{ "type": "error|warning|info", "message": "string", "column": "string opcional" }],
  "recommendations": ["string"]
}`;

        const message = await anthropic.messages.create({
          model: DEFAULT_MODEL,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        
        // Extraer JSON de la respuesta
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      } catch (aiError) {
        console.error('[Import Analysis] AI error:', aiError);
        // Continuar sin análisis AI
      }
    }

    // Construir respuesta
    const response = {
      fileType: 'csv',
      encoding: 'utf-8',
      delimiter: ',',
      rowCount: rows.length,
      columnCount: headers.length,
      columns: columnAnalysis.map(col => ({
        ...col,
        suggestedMapping: aiAnalysis?.mappingSuggestions?.[col.name] || null,
        confidence: 0.8,
      })),
      suggestedEntityType: aiAnalysis?.suggestedEntityType || initialDetection.entityType,
      entityTypeConfidence: aiAnalysis?.entityTypeConfidence || initialDetection.confidence,
      entityTypeReasoning: aiAnalysis?.entityTypeReasoning || 
        `Detectado basándose en las columnas: ${headers.slice(0, 5).join(', ')}`,
      validationIssues: aiAnalysis?.validationIssues || [],
      recommendations: aiAnalysis?.recommendations || [
        'Verifica que las columnas coincidan con el formato esperado',
        'Asegúrate de que no haya filas vacías',
        'Revisa los valores faltantes antes de importar',
      ],
      previewData: rows.slice(0, 5).map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
      }),
      mappingSuggestions: aiAnalysis?.mappingSuggestions || {},
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Import Analysis Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al analizar el archivo' },
      { status: 500 }
    );
  }
}
