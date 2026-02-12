import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
/**
 * API Route: Análisis de Documentos con IA
 *
 * Endpoint para analizar documentos usando el AI Document Agent Service.
 * Soporta subida de archivos y análisis de texto.
 *
 * Usa el servicio real de Anthropic Claude cuando ANTHROPIC_API_KEY está configurado,
 * con fallback a análisis básico si no está disponible.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  analyzeDocument,
  isAIConfigured,
  DocumentAnalysisInput,
} from '@/lib/ai-document-agent-service';
import logger from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const DOCUMENT_ANALYSIS_RATE_LIMIT = {
  interval: 60 * 1000,
  uniqueTokenPerInterval: 20,
};

/**
 * Verifica si el archivo es una imagen
 */
function isImageFile(file: File): boolean {
  // Verificar por tipo MIME
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }

  // Verificar por extensión del nombre del archivo (fallback importante)
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.bmp',
    '.tiff',
    '.heic',
    '.heif',
  ];
  const fileName = (file.name || '').toLowerCase();
  if (imageExtensions.some((ext) => fileName.endsWith(ext))) {
    return true;
  }

  // Si el tipo MIME incluye 'image' en cualquier parte
  if (file.type && file.type.includes('image')) {
    return true;
  }

  return false;
}

/**
 * Verifica si el archivo es un PDF
 */
function isPDFFile(file: File): boolean {
  if (file.type === 'application/pdf') {
    return true;
  }
  const fileName = (file.name || '').toLowerCase();
  return fileName.endsWith('.pdf');
}

/**
 * Verifica si el archivo debe usar Claude Vision (imágenes o PDFs)
 */
function shouldUseVision(file: File): boolean {
  return isImageFile(file) || isPDFFile(file);
}

/**
 * Verifica si el archivo es una imagen por sus bytes mágicos (magic numbers)
 */
async function isImageByMagicBytes(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return true;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return true;
    }

    // GIF: 47 49 46 38
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return true;
    }

    // WebP: 52 49 46 46 ... 57 45 42 50
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return true;
    }

    // BMP: 42 4D
    if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Convierte un archivo a base64
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

/**
 * Genera el prompt de Vision según el contexto
 */
function getVisionPromptForContext(
  context: string,
  companyInfo: { cif: string | null; nombre: string; direccion: string | null }
): string {
  const basePrompt = `Analiza esta imagen de documento y extrae toda la información visible.

CONTEXTO:
- Empresa del usuario: ${companyInfo.nombre}
- CIF de la empresa: ${companyInfo.cif || 'No proporcionado'}
- Contexto de uso: ${context}

INSTRUCCIONES:
1. Identifica el tipo de documento
2. Extrae TODOS los datos visibles de forma estructurada
3. Usa el formato de campo más apropiado (fechas en YYYY-MM-DD, números sin formato)

`;

  // Instrucciones específicas según contexto
  const contextInstructions: Record<string, string> = {
    inquilinos: `PARA DOCUMENTOS DE INQUILINOS, busca especialmente:
- Documentos de identidad (DNI, NIE, Pasaporte): nombre completo, número, fecha nacimiento, nacionalidad, sexo, dirección
- Nóminas: nombre, empresa, salario bruto/neto, fecha
- Contratos laborales: nombre, empresa, cargo, salario, fecha inicio
- Certificados de empadronamiento: nombre, dirección, fecha
- Referencias bancarias: nombre, banco, número cuenta (parcial)`,

    contratos: `PARA DOCUMENTOS DE CONTRATOS, busca especialmente:
- Contratos de arrendamiento: dirección inmueble, fecha inicio/fin, renta mensual, fianza, partes (arrendador/arrendatario con DNI)
- Anexos de contrato: modificaciones, cláusulas adicionales
- Inventarios: lista de elementos, estado
- Actas de entrega de llaves: fecha, firmas`,

    propiedades: `PARA DOCUMENTOS DE PROPIEDADES, busca especialmente:
- Escrituras: dirección, referencia catastral, superficie, propietario, fecha
- Notas simples del registro: finca, titular, cargas
- Certificados energéticos: calificación, consumo, emisiones
- IBI/Catastro: referencia catastral, valor catastral, dirección
- Planos: superficie, distribución, habitaciones`,

    seguros: `PARA DOCUMENTOS DE SEGUROS, busca especialmente:
- Pólizas: número póliza, aseguradora, tomador, dirección asegurada, coberturas, prima, fecha vigencia
- Recibos: número recibo, importe, periodo
- Partes de siniestro: fecha siniestro, descripción, daños`,

    facturas: `PARA FACTURAS Y DOCUMENTOS FINANCIEROS, busca especialmente:
- Facturas: número factura, emisor (nombre, CIF), receptor, fecha, concepto, base imponible, IVA, total
- Recibos de suministros: compañía, dirección, periodo, consumo, importe
- Justificantes de pago: fecha, importe, concepto, ordenante, beneficiario`,

    garantias: `PARA DOCUMENTOS DE GARANTÍAS, busca especialmente:
- Avales bancarios: banco, importe, beneficiario, vigencia
- Depósitos: importe, fecha, organismo
- Seguros de impago: aseguradora, cobertura, prima`,

    incidencias: `PARA DOCUMENTOS DE INCIDENCIAS/MANTENIMIENTO, busca especialmente:
- Presupuestos: proveedor, concepto, importe, fecha
- Facturas de reparación: descripción trabajo, materiales, mano de obra, total
- Informes técnicos: fecha, descripción, conclusiones`,

    general: `TIPOS DE DOCUMENTOS A IDENTIFICAR:
- Documentos de identidad (DNI, NIE, Pasaporte)
- Contratos (arrendamiento, compraventa, laboral)
- Documentos de propiedad (escrituras, notas simples)
- Documentos financieros (facturas, recibos, nóminas)
- Certificados (energético, empadronamiento)
- Seguros (pólizas, recibos)
- Documentos técnicos (informes, presupuestos)`,
  };

  const specificInstructions = contextInstructions[context] || contextInstructions.general;

  return (
    basePrompt +
    specificInstructions +
    `

CATEGORÍAS DE DOCUMENTO:
- dni_nie: Documentos de identidad (DNI, NIE, Pasaporte)
- contrato_alquiler: Contratos de arrendamiento
- contrato_compraventa: Contratos de compraventa
- escritura_propiedad: Escrituras y documentos notariales
- factura: Facturas y recibos
- nomina: Nóminas y documentos laborales
- seguro: Pólizas y documentos de seguros
- certificado_energetico: Certificados de eficiencia energética
- nota_simple: Notas simples del registro
- catastro: Documentos catastrales
- presupuesto: Presupuestos
- otro: Otros documentos

RESPONDE EN FORMATO JSON:
{
  "documentType": "descripción del tipo de documento",
  "classification": {
    "category": "categoria_del_documento",
    "confidence": 0.0-1.0,
    "specificType": "tipo específico detallado"
  },
  "extractedFields": [
    {
      "fieldName": "nombre_del_campo_en_snake_case",
      "fieldValue": "valor extraído",
      "confidence": 0.0-1.0,
      "dataType": "string|number|date|currency|percentage"
    }
  ],
  "summary": "resumen breve del documento y su contenido principal",
  "warnings": ["advertencias si hay datos ilegibles, incompletos o sospechosos"],
  "suggestedEntity": "Tenant|Property|Contract|Insurance|Provider|Invoice"
}`
  );
}

/**
 * Determina la entidad objetivo según la categoría del documento
 */
function getTargetEntityFromCategory(category: string): string {
  const entityMapping: Record<string, string> = {
    dni_nie: 'Tenant',
    contrato_alquiler: 'Contract',
    contrato_compraventa: 'Contract',
    escritura_propiedad: 'Property',
    factura: 'Invoice',
    nomina: 'Tenant',
    seguro: 'Insurance',
    certificado_energetico: 'Property',
    nota_simple: 'Property',
    catastro: 'Property',
    presupuesto: 'Provider',
  };
  return entityMapping[category] || 'Document';
}

/**
 * Determina el dataType según la categoría del documento
 */
function getDataTypeFromCategory(category: string): string {
  const dataTypeMapping: Record<string, string> = {
    dni_nie: 'tenant_info',
    contrato_alquiler: 'contract_info',
    contrato_compraventa: 'contract_info',
    escritura_propiedad: 'property_info',
    factura: 'financial_info',
    nomina: 'tenant_info',
    seguro: 'insurance_info',
    certificado_energetico: 'energy_info',
    nota_simple: 'property_info',
    catastro: 'property_info',
    presupuesto: 'provider_info',
  };
  return dataTypeMapping[category] || 'property_info';
}

/**
 * Convierte un PDF a imagen PNG usando pdftoppm
 */
async function convertPDFToImage(file: File): Promise<string> {
  const { spawn } = await import('child_process');
  const { writeFile, readFile, unlink } = await import('fs/promises');
  const { join } = await import('path');
  const os = await import('os');

  const tmpDir = os.tmpdir();
  const timestamp = Date.now();
  const pdfPath = join(tmpDir, `pdf_${timestamp}.pdf`);
  const outputPrefix = join(tmpDir, `img_${timestamp}`);
  const outputPath = `${outputPrefix}-1.png`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    await writeFile(pdfPath, pdfBuffer);

    logger.info('[PDF to Image] Convirtiendo PDF...', { filename: file.name });

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('pdftoppm', [
        '-png',
        '-f',
        '1',
        '-l',
        '1',
        '-r',
        '150',
        pdfPath,
        outputPrefix,
      ]);
      let stderr = '';
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`pdftoppm falló: ${stderr}`));
      });
      proc.on('error', (err) => reject(err));
    });

    const imageBuffer = await readFile(outputPath);
    const base64 = imageBuffer.toString('base64');

    logger.info('[PDF to Image] Conversión exitosa', { filename: file.name });

    await unlink(pdfPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    return base64;
  } catch (error: any) {
    await unlink(pdfPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    throw error;
  }
}

/**
 * Analiza un documento (imagen o PDF) usando Claude Vision
 */
async function analyzeDocumentWithVision(
  file: File,
  companyInfo: { cif: string | null; nombre: string; direccion: string | null },
  context: string = 'general'
): Promise<any> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no configurada');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const isPDF = isPDFFile(file);

  // Para PDFs: convertir a imagen primero (más compatible con todos los modelos)
  // Para imágenes: usar directamente
  let base64Data: string;
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/png';

  if (isPDF) {
    console.error('[Vision Analysis] 📄 PDF detectado - convirtiendo a imagen:', file.name);
    try {
      base64Data = await convertPDFToImage(file);
      console.error('[Vision Analysis] ✅ PDF convertido exitosamente');
    } catch (convError: any) {
      console.error('[Vision Analysis] ❌ Error convirtiendo PDF:', convError.message);
      throw convError;
    }
    mediaType = 'image/png';
  } else {
    base64Data = await fileToBase64(file);
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') mediaType = 'image/jpeg';
    else if (file.type === 'image/gif') mediaType = 'image/gif';
    else if (file.type === 'image/webp') mediaType = 'image/webp';
  }

  const contentBlock = {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: mediaType,
      data: base64Data,
    },
  } as const;

  console.error('[Vision Analysis] 📤 Enviando a Claude Vision:', file.name, 'isPDF:', isPDF);

  const prompt = getVisionPromptForContext(context, companyInfo);

  const startTime = Date.now();

  // Usar claude-3-haiku para imágenes (rápido y confiable)
  console.error('[Vision Analysis] 🤖 Llamando a Claude API...');
  const response = await client.messages.create({
    model: CLAUDE_MODEL_FAST,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          contentBlock,
          {
            type: 'text' as const,
            text: prompt,
          },
        ],
      },
    ],
  });

  const processingTimeMs = Date.now() - startTime;
  console.error('[Vision Analysis] ✅ Claude respondió en', processingTimeMs, 'ms');

  const content = response.content[0];

  if (content.type === 'text') {
    console.error('[Vision Analysis] 📝 Procesando respuesta de texto...');
    // Extraer JSON de la respuesta
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.error('[Vision Analysis] ✅ JSON encontrado en respuesta');
      const result = JSON.parse(jsonMatch[0]);
      const category = result.classification?.category || 'otro';
      const targetEntity = result.suggestedEntity || getTargetEntityFromCategory(category);
      const dataType = getDataTypeFromCategory(category);

      logger.info('[Vision Analysis] Análisis completado', {
        documentType: result.documentType,
        category,
        fieldsExtracted: result.extractedFields?.length || 0,
        processingTimeMs,
      });

      // Detectar si tiene datos sensibles
      const sensitiveCategories = ['dni_nie', 'nomina', 'contrato_alquiler'];
      const hasSensitive = sensitiveCategories.includes(category);
      const sensitiveTypes: string[] = [];
      if (category === 'dni_nie') sensitiveTypes.push('documento_identidad');
      if (category === 'nomina') sensitiveTypes.push('datos_financieros', 'datos_laborales');
      if (category === 'contrato_alquiler')
        sensitiveTypes.push('datos_personales', 'datos_financieros');

      // Mapear campos extraídos - manejar tanto array como objeto
      let rawFields = result.extractedFields || [];

      // Si extractedFields es un objeto (no array), convertirlo a array
      if (!Array.isArray(rawFields) && typeof rawFields === 'object') {
        console.error('[Vision Analysis] 🔄 Convirtiendo extractedFields de objeto a array');
        rawFields = Object.entries(rawFields).map(([key, value]) => ({
          fieldName: key,
          fieldValue: value,
          confidence: 0.9,
        }));
      }

      const extractedFields = rawFields.map((f: any) => ({
        fieldName: f.fieldName,
        fieldValue: f.fieldValue,
        dataType: f.dataType || dataType,
        confidence: f.confidence || 0.8,
        targetEntity,
        targetField: mapFieldNameToTarget(f.fieldName, category),
      }));

      console.error('[Vision Analysis] ✅ Campos extraídos:', extractedFields.length);

      // Generar acciones sugeridas basadas en los campos extraídos
      const suggestedActions = generateSuggestedActions(extractedFields, category, targetEntity);

      return {
        classification: {
          category,
          confidence: result.classification?.confidence || 0.85,
          specificType: result.classification?.specificType || result.documentType || 'Documento',
          reasoning: `Análisis mediante Claude Vision (contexto: ${context})`,
        },
        ownershipValidation: {
          isOwned: true,
          detectedCIF: extractCIF(result.extractedFields),
          detectedCompanyName: extractCompanyName(result.extractedFields),
          matchesCIF: false,
          matchesName: false,
          confidence: 0.7,
          notes: `Documento analizado en contexto: ${context}`,
        },
        extractedFields,
        summary: result.summary || 'Documento analizado con visión artificial',
        warnings: result.warnings || [],
        suggestedActions,
        sensitiveData: {
          hasSensitive,
          types: sensitiveTypes,
        },
        processingMetadata: {
          tokensUsed: response.usage?.output_tokens || 0,
          processingTimeMs,
          modelUsed: 'claude-3-5-sonnet-vision',
        },
      };
    }
  }

  throw new Error('No se pudo procesar la respuesta de visión');
}

/**
 * Extrae CIF de los campos si existe
 */
function extractCIF(fields: any[]): string | null {
  if (!fields) return null;
  const cifField = fields.find(
    (f: any) =>
      f.fieldName?.toLowerCase().includes('cif') ||
      f.fieldName?.toLowerCase().includes('nif_empresa')
  );
  return cifField?.fieldValue || null;
}

/**
 * Extrae nombre de empresa de los campos si existe
 */
function extractCompanyName(fields: any[]): string | null {
  if (!fields) return null;
  const nameField = fields.find(
    (f: any) =>
      f.fieldName?.toLowerCase().includes('empresa') ||
      f.fieldName?.toLowerCase().includes('razon_social') ||
      f.fieldName?.toLowerCase().includes('emisor')
  );
  return nameField?.fieldValue || null;
}

/**
 * Genera acciones sugeridas basadas en los campos extraídos
 */
function generateSuggestedActions(
  fields: any[],
  category: string,
  targetEntity: string
): Array<{
  action: 'create' | 'update' | 'link';
  entity: string;
  description: string;
  data: Record<string, any>;
  confidence: number;
  requiresReview: boolean;
}> {
  const actions: any[] = [];

  if (fields.length === 0) return actions;

  // Construir datos del objeto
  const data: Record<string, any> = {};
  fields.forEach((f) => {
    if (f.targetField && f.fieldValue) {
      data[f.targetField] = f.fieldValue;
    }
  });

  if (Object.keys(data).length > 0) {
    actions.push({
      action: 'create',
      entity: targetEntity,
      description: `Crear/actualizar ${targetEntity} con datos extraídos del documento`,
      data,
      confidence: 0.8,
      requiresReview: true,
    });
  }

  return actions;
}

/**
 * Mapea nombres de campo extraídos a campos del sistema según categoría
 */
function mapFieldNameToTarget(fieldName: string, category: string = 'general'): string {
  // Mapeo base para todos los documentos
  const baseMapping: Record<string, string> = {
    // Datos personales - español
    nombre_completo: 'nombreCompleto',
    nombre: 'nombre',
    apellidos: 'apellidos',
    primer_apellido: 'primerApellido',
    segundo_apellido: 'segundoApellido',
    dni: 'dni',
    nie: 'dni',
    numero_documento: 'dni',
    pasaporte: 'dni',
    fecha_nacimiento: 'fechaNacimiento',
    nacionalidad: 'nacionalidad',
    email: 'email',
    correo: 'email',
    telefono: 'telefono',
    movil: 'telefono',
    direccion: 'direccion',
    domicilio: 'direccion',
    sexo: 'sexo',
    genero: 'sexo',
    estado_civil: 'estadoCivil',
    profesion: 'profesion',
    ocupacion: 'profesion',

    // Datos personales - inglés (como devuelve Claude a veces)
    name: 'nombre',
    fullName: 'nombre',
    full_name: 'nombre',
    firstName: 'nombre',
    lastName: 'apellidos',
    surname: 'apellidos',
    documentNumber: 'dni',
    document_number: 'dni',
    idNumber: 'dni',
    id_number: 'dni',
    birthDate: 'fechaNacimiento',
    birth_date: 'fechaNacimiento',
    dateOfBirth: 'fechaNacimiento',
    nationality: 'nacionalidad',
    sex: 'sexo',
    gender: 'sexo',
    address: 'direccion',
    issueDate: 'fechaExpedicion',
    issue_date: 'fechaExpedicion',
    expirationDate: 'fechaCaducidad',
    expiration_date: 'fechaCaducidad',
    expiryDate: 'fechaCaducidad',
    expiry_date: 'fechaCaducidad',

    // Datos financieros
    salario: 'ingresosMensuales',
    salario_bruto: 'salarioBruto',
    salario_neto: 'salarioNeto',
    ingresos: 'ingresosMensuales',
    ingresos_mensuales: 'ingresosMensuales',
    iban: 'iban',
    cuenta_bancaria: 'cuentaBancaria',
    banco: 'banco',

    // Datos de empresa
    cif: 'cif',
    nif_empresa: 'cif',
    razon_social: 'razonSocial',
    nombre_empresa: 'nombreEmpresa',
    empresa: 'empresa',
  };

  // Mapeos específicos por categoría
  const categoryMappings: Record<string, Record<string, string>> = {
    contrato_alquiler: {
      direccion_inmueble: 'direccionInmueble',
      direccion_vivienda: 'direccionInmueble',
      fecha_inicio: 'fechaInicio',
      fecha_fin: 'fechaFin',
      fecha_vencimiento: 'fechaFin',
      renta: 'precioAlquiler',
      renta_mensual: 'precioAlquiler',
      precio_alquiler: 'precioAlquiler',
      fianza: 'fianza',
      deposito: 'deposito',
      arrendador: 'arrendador',
      propietario: 'propietario',
      arrendatario: 'arrendatario',
      inquilino: 'inquilino',
      dni_arrendador: 'dniArrendador',
      dni_arrendatario: 'dniArrendatario',
      duracion: 'duracion',
      prorroga: 'prorroga',
    },
    escritura_propiedad: {
      referencia_catastral: 'referenciaCatastral',
      superficie: 'superficie',
      metros_cuadrados: 'superficie',
      m2: 'superficie',
      superficie_construida: 'superficieConstruida',
      superficie_util: 'superficieUtil',
      fecha_escritura: 'fechaEscritura',
      notario: 'notario',
      protocolo: 'numeroProtocolo',
      precio_compra: 'precioCompra',
      valor_escritura: 'valorEscritura',
    },
    nota_simple: {
      finca: 'numeroFinca',
      numero_finca: 'numeroFinca',
      titular: 'titular',
      propietario: 'propietario',
      cargas: 'cargas',
      hipoteca: 'hipoteca',
    },
    certificado_energetico: {
      calificacion: 'calificacionEnergetica',
      calificacion_energetica: 'calificacionEnergetica',
      consumo: 'consumoEnergetico',
      emisiones: 'emisiones',
      fecha_emision: 'fechaEmision',
      fecha_validez: 'fechaValidez',
    },
    factura: {
      numero_factura: 'numeroFactura',
      fecha_factura: 'fechaFactura',
      fecha_emision: 'fechaEmision',
      emisor: 'emisor',
      receptor: 'receptor',
      concepto: 'concepto',
      descripcion: 'descripcion',
      base_imponible: 'baseImponible',
      iva: 'iva',
      tipo_iva: 'tipoIva',
      total: 'total',
      importe_total: 'importeTotal',
    },
    seguro: {
      numero_poliza: 'numeroPoliza',
      aseguradora: 'aseguradora',
      compania: 'aseguradora',
      tomador: 'tomador',
      asegurado: 'asegurado',
      direccion_asegurada: 'direccionAsegurada',
      cobertura: 'cobertura',
      coberturas: 'coberturas',
      prima: 'prima',
      prima_anual: 'primaAnual',
      fecha_efecto: 'fechaEfecto',
      fecha_vencimiento: 'fechaVencimiento',
      capital_asegurado: 'capitalAsegurado',
    },
    nomina: {
      periodo: 'periodo',
      mes: 'mes',
      año: 'año',
      salario_base: 'salarioBase',
      complementos: 'complementos',
      retenciones: 'retenciones',
      irpf: 'irpf',
      seguridad_social: 'seguridadSocial',
      liquido: 'liquido',
      neto_a_percibir: 'netoPercibir',
      categoria: 'categoria',
      puesto: 'puesto',
      antiguedad: 'antiguedad',
    },
    catastro: {
      referencia_catastral: 'referenciaCatastral',
      valor_catastral: 'valorCatastral',
      uso: 'uso',
      clase: 'clase',
      superficie_suelo: 'superficieSuelo',
      superficie_construida: 'superficieConstruida',
      año_construccion: 'añoConstruccion',
    },
    presupuesto: {
      numero_presupuesto: 'numeroPresupuesto',
      fecha_presupuesto: 'fechaPresupuesto',
      proveedor: 'proveedor',
      concepto: 'concepto',
      descripcion_trabajos: 'descripcionTrabajos',
      materiales: 'materiales',
      mano_obra: 'manoObra',
      total: 'total',
      validez: 'validez',
    },
  };

  const lowerName = fieldName.toLowerCase().replace(/\s+/g, '_');

  // Primero buscar en mapeo específico de categoría
  if (categoryMappings[category] && categoryMappings[category][lowerName]) {
    return categoryMappings[category][lowerName];
  }

  // Luego buscar en mapeo base
  if (baseMapping[lowerName]) {
    return baseMapping[lowerName];
  }

  // Si no se encuentra, convertir a camelCase
  return lowerName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Extrae texto de un archivo (PDF, documento de texto)
 * Para imágenes, se usa Claude Vision directamente
 */
async function extractTextFromFile(file: File): Promise<string> {
  // Para archivos de texto
  if (file.type === 'text/plain') {
    return await file.text();
  }

  // Para imágenes, retornar solo info básica (se procesará con Vision)
  if (isImageFile(file)) {
    return `[IMAGEN: ${file.name}] - Este archivo se procesará con análisis de visión.`;
  }

  // Para PDFs y documentos - usar el nombre del archivo como contexto básico
  const basicInfo = `
Nombre de archivo: ${file.name}
Tipo MIME: ${file.type}
Tamaño: ${(file.size / 1024).toFixed(2)} KB
Fecha de carga: ${new Date().toISOString()}
  `.trim();

  // Si el archivo es un PDF o documento, intentar leer como texto
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
    // Si falla la extracción, usar solo info básica
  }

  return basicInfo;
}

/**
 * Análisis básico cuando la IA no está disponible
 */
function basicAnalysis(filename: string, fileType: string) {
  const lowerName = filename.toLowerCase();

  let category = 'otro';
  let specificType = 'Documento general';

  if (lowerName.includes('contrato') || lowerName.includes('alquiler')) {
    category = 'contrato_alquiler';
    specificType = 'Contrato de arrendamiento';
  } else if (lowerName.includes('dni') || lowerName.includes('nie')) {
    category = 'dni_nie';
    specificType = 'Documento de identidad';
  } else if (lowerName.includes('factura')) {
    category = 'factura';
    specificType = 'Factura';
  } else if (lowerName.includes('seguro') || lowerName.includes('poliza')) {
    category = 'seguro';
    specificType = 'Póliza de seguro';
  } else if (lowerName.includes('escritura')) {
    category = 'escritura_propiedad';
    specificType = 'Escritura de propiedad';
  } else if (lowerName.includes('certificado') && lowerName.includes('energetico')) {
    category = 'certificado_energetico';
    specificType = 'Certificado de eficiencia energética';
  }

  return {
    classification: {
      category,
      confidence: 0.5,
      specificType,
      reasoning: 'Clasificación basada en el nombre del archivo (IA no configurada)',
    },
    ownershipValidation: {
      isOwned: true,
      detectedCIF: null,
      detectedCompanyName: null,
      matchesCIF: false,
      matchesName: false,
      confidence: 0.3,
      notes: 'Validación básica - configure ANTHROPIC_API_KEY para análisis completo',
    },
    extractedFields: [],
    summary: `Documento: ${filename}. Para análisis detallado, configure la integración con IA.`,
    warnings: ['IA no configurada - análisis limitado'],
    suggestedActions: [],
    sensitiveData: {
      hasSensitive: false,
      types: [],
    },
    processingMetadata: {
      tokensUsed: 0,
      processingTimeMs: 50,
      modelUsed: 'basic-fallback',
    },
  };
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  return withRateLimit(
    request,
    async () => {
      try {
        // Verificar autenticación
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Obtener el archivo del FormData
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const context = (formData.get('context') as string) || 'general';

        if (!file) {
          return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
        }

        // LOG DETALLADO DEL ARCHIVO RECIBIDO
        logger.info('[AI Document Analysis] 📥 Archivo recibido', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          context,
          isImageByType: file.type.startsWith('image/'),
          isImageByExtension: ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some((ext) =>
            file.name.toLowerCase().endsWith(ext)
          ),
        });

        // Verificar tipo de archivo
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];

        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
        }

        // Verificar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: 'El archivo excede el tamaño máximo de 10MB' },
            { status: 400 }
          );
        }

        // Verificar si IA está configurada
        if (!isAIConfigured()) {
          logger.warn(
            '[AI Document Analysis] ANTHROPIC_API_KEY no configurado, usando análisis básico'
          );
          const basicResult = basicAnalysis(file.name, file.type);
          basicResult.warnings.push(
            '⚠️ IA no configurada: Para análisis inteligente de documentos, configure ANTHROPIC_API_KEY en el servidor.'
          );
          basicResult.summary =
            'Análisis básico (sin IA). Configure ANTHROPIC_API_KEY para extracción automática de datos.';
          return NextResponse.json(basicResult);
        }

        // Extraer texto del archivo
        const extractedText = await extractTextFromFile(file);

        // Obtener información de la empresa del usuario
        let companyInfo: DocumentAnalysisInput['companyInfo'] = {
          cif: null,
          nombre: session.user.name || 'Usuario',
          direccion: null,
        };

        // Intentar obtener info de la empresa del usuario
        if (session.user.companyId) {
          try {
            const company = await prisma.company.findUnique({
              where: { id: session.user.companyId },
              select: {
                cif: true,
                nombre: true,
                direccion: true,
              },
            });
            if (company) {
              companyInfo = {
                cif: company.cif || null,
                nombre: company.nombre,
                direccion: company.direccion || null,
              };
            }
          } catch (e) {
            logger.warn('[AI Document Analysis] No se pudo obtener info de empresa');
          }
        }

        // Analizar documento con IA real
        // Determinar si usar Vision (para imágenes y PDFs)
        const isPDF = isPDFFile(file);
        let isImage = isImageFile(file);

        // Si no se detectó como imagen por tipo/extensión, verificar por magic bytes
        if (!isImage && !isPDF) {
          isImage = await isImageByMagicBytes(file);
          if (isImage) {
            logger.info('[AI Document Analysis] 🔍 Imagen detectada por magic bytes', {
              filename: file.name,
              declaredType: file.type,
            });
          }
        }

        // Usar Vision para imágenes y PDFs
        const useVision = isImage || isPDF;

        logger.info('[AI Document Analysis] Iniciando análisis con IA', {
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          userId: session.user.id,
          isImage,
          isPDF,
          useVision,
          context,
        });

        // Si es imagen o PDF, usar Claude Vision
        if (useVision) {
          logger.info('[AI Document Analysis] 🖼️ USANDO CLAUDE VISION', {
            context,
            filename: file.name,
            fileType: file.type,
            isPDF,
            isImage,
          });
          try {
            const visionAnalysis = await analyzeDocumentWithVision(
              file,
              { ...companyInfo, direccion: companyInfo.direccion ?? null },
              context
            );

            logger.info('[AI Document Analysis] Análisis de visión completado', {
              filename: file.name,
              context,
              category: visionAnalysis.classification?.category,
              fieldsExtracted: visionAnalysis.extractedFields?.length || 0,
            });

            return NextResponse.json(visionAnalysis);
          } catch (visionError: any) {
            const visionMessage =
              visionError?.message || visionError?.toString() || 'Error desconocido';
            logger.warn('[AI Document Analysis] Vision falló, intentando fallback a texto', {
              filename: file.name,
              context,
              isPDF,
              isImage,
              error: visionMessage,
            });

            if (extractedText && extractedText.trim().length > 0) {
              const analysis = await analyzeDocument({
                text: extractedText,
                filename: file.name,
                mimeType: file.type,
                companyInfo,
              });

              analysis.warnings = [
                ...(analysis.warnings || []),
                `Visión no disponible (${visionMessage}). Se usó análisis por texto.`,
              ];

              return NextResponse.json(analysis);
            }

            throw visionError;
          }
        }

        // Para documentos de texto/PDF, usar el análisis tradicional
        logger.info('[AI Document Analysis] 📄 Usando análisis de TEXTO (no Vision)', {
          filename: file.name,
          fileType: file.type,
          textLength: extractedText.length,
        });

        const analysis = await analyzeDocument({
          text: extractedText,
          filename: file.name,
          mimeType: file.type,
          companyInfo,
        });

        logger.info('[AI Document Analysis] Análisis completado', {
          filename: file.name,
          category: analysis.classification.category,
          confidence: analysis.classification.confidence,
          processingTimeMs: analysis.processingMetadata.processingTimeMs,
        });

        return NextResponse.json(analysis);
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Error desconocido';
        const errorDetails = {
          message: errorMessage,
          name: error?.name,
          status: error?.status,
          code: error?.code,
          stack: error?.stack?.substring(0, 500),
        };

        // Log crítico usando console.error para PM2
        console.error('[AI Document Analysis] ❌ ERROR CRÍTICO:', JSON.stringify(errorDetails));
        logger.error('[AI Document Analysis] Error:', errorDetails);

        // Retornar análisis básico como fallback con mensaje de error claro
        return NextResponse.json({
          classification: {
            category: 'otro',
            confidence: 0,
            specificType: 'Error en análisis',
            reasoning: `No se pudo analizar el documento: ${errorMessage}`,
          },
          ownershipValidation: {
            isOwned: false,
            detectedCIF: null,
            detectedCompanyName: null,
            matchesCIF: false,
            matchesName: false,
            confidence: 0,
            notes: 'Error en el análisis',
          },
          extractedFields: [],
          summary: `Error: ${errorMessage}`,
          warnings: [`Error en análisis de IA: ${errorMessage}`],
          suggestedActions: [],
          sensitiveData: { hasSensitive: false, types: [] },
          processingMetadata: {
            tokensUsed: 0,
            processingTimeMs: 0,
            modelUsed: 'error-fallback',
          },
          error: true,
          errorMessage,
        });
      }
    },
    DOCUMENT_ANALYSIS_RATE_LIMIT
  );
}
