/**
 * AI Document Agent Service
 * 
 * Agente de IA para análisis inteligente de documentos durante el onboarding.
 * Extrae, clasifica y parametriza datos de documentos empresariales.
 * 
 * Funcionalidades:
 * - Clasificación automática de tipo de documento
 * - Extracción de entidades (CIF, nombres, direcciones, importes)
 * - Validación de propiedad (documento pertenece a la empresa)
 * - Sugerencias de parametrización
 * - Detección de datos sensibles
 * 
 * @module lib/ai-document-agent-service
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';
import { ExtractedDataType } from '@/types/prisma-types';
import { DocumentImportCategory, DocumentImportStatus } from '@/types/prisma-types';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || '';
import { CLAUDE_MODEL_FAST } from './ai-model-config';
const DEFAULT_MODEL = CLAUDE_MODEL_FAST;
const MAX_TOKENS = 4096;

// Lazy initialization para evitar errores en tests/SSR
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: CLAUDE_API_KEY,
    });
  }
  return anthropicClient;
}

// ============================================================================
// TIPOS
// ============================================================================

export interface DocumentAnalysisInput {
  text: string;
  filename: string;
  mimeType: string;
  pageCount?: number;
  companyInfo: {
    cif: string | null;
    nombre: string;
    direccion?: string | null;
  };
  /** Imagen en base64 para análisis con visión */
  imageBase64?: string;
}

export interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  dataType: ExtractedDataType;
  confidence: number;
  pageNumber?: number;
  targetEntity?: 'Company' | 'Building' | 'Unit' | 'Tenant' | 'Contract' | 'Provider' | 'Insurance';
  targetField?: string;
}

export interface DocumentClassification {
  category: DocumentImportCategory;
  confidence: number;
  specificType: string;
  reasoning: string;
}

export interface OwnershipValidation {
  isOwned: boolean;
  detectedCIF: string | null;
  detectedCompanyName: string | null;
  matchesCIF: boolean;
  matchesName: boolean;
  confidence: number;
  notes: string;
}

export interface DocumentAnalysisResult {
  classification: DocumentClassification;
  ownershipValidation: OwnershipValidation;
  extractedFields: ExtractedField[];
  summary: string;
  warnings: string[];
  suggestedActions: SuggestedAction[];
  sensitiveData: {
    hasSensitive: boolean;
    types: string[];
  };
  processingMetadata: {
    tokensUsed: number;
    processingTimeMs: number;
    modelUsed: string;
  };
}

export interface SuggestedAction {
  action: 'create' | 'update' | 'link';
  entity: string;
  description: string;
  data: Record<string, any>;
  confidence: number;
  requiresReview: boolean;
}

// ============================================================================
// PROMPTS DE IA
// ============================================================================

const CLASSIFICATION_PROMPT = `Eres un experto en clasificación de documentos inmobiliarios y empresariales españoles.

TAREA: Analiza el siguiente texto extraído de un documento y clasifícalo.

TEXTO DEL DOCUMENTO:
---
{document_text}
---

NOMBRE ARCHIVO: {filename}

CATEGORÍAS DISPONIBLES:
- escritura_propiedad: Escrituras de compraventa, títulos de propiedad
- contrato_alquiler: Contratos de arrendamiento (vivienda, local, temporal)
- dni_nie: Documentos de identidad (DNI, NIE, pasaporte)
- factura: Facturas de proveedores, recibos de servicios
- seguro: Pólizas de seguros (hogar, RC, multirriesgo)
- certificado_energetico: Certificados de eficiencia energética
- acta_comunidad: Actas de juntas de propietarios
- recibo_pago: Recibos de alquiler, justificantes de pago
- nota_simple: Notas simples del registro de la propiedad
- ite_iee: Informes ITE/IEE (inspección técnica edificios)
- licencia: Licencias de primera ocupación, permisos
- fianza: Justificantes de depósito de fianza
- inventario: Inventarios de mobiliario/equipamiento
- foto_inmueble: Fotografías de propiedades
- plano: Planos arquitectónicos, croquis
- otro: Documentos no clasificables

RESPONDE EN JSON:
{
  "category": "categoria_del_enum",
  "confidence": 0.0-1.0,
  "specificType": "tipo específico (ej: 'contrato arrendamiento vivienda LAU')",
  "reasoning": "explicación breve de por qué esta clasificación"
}`;

const OWNERSHIP_VALIDATION_PROMPT = `Eres un experto en validación de documentos empresariales españoles.

TAREA: Determina si este documento pertenece a la empresa indicada.

DATOS DE LA EMPRESA QUE ESTÁ IMPORTANDO:
- CIF: {company_cif}
- Nombre: {company_name}
- Dirección: {company_address}

TEXTO DEL DOCUMENTO:
---
{document_text}
---

INSTRUCCIONES:
1. Busca CIF/NIF/NIE en el documento
2. Busca nombres de empresas o personas
3. Determina si el documento es de la empresa, de un inquilino, de un proveedor, o de terceros

Un documento PERTENECE a la empresa si:
- Es una escritura donde la empresa es propietaria
- Es un contrato donde la empresa es arrendadora
- Es una factura donde la empresa es cliente
- Es un seguro donde la empresa es tomador
- Es documentación de propiedades de la empresa

Un documento es de TERCEROS (pero válido para importar) si:
- Es el DNI de un inquilino potencial
- Es documentación de un proveedor de servicios
- Es acta de comunidad donde la empresa tiene propiedades

RESPONDE EN JSON:
{
  "isOwned": true/false (si es directamente de la empresa),
  "detectedCIF": "CIF encontrado o null",
  "detectedCompanyName": "Nombre de empresa encontrado o null",
  "matchesCIF": true/false,
  "matchesName": true/false,
  "confidence": 0.0-1.0,
  "notes": "Explicación de la relación del documento con la empresa"
}`;

const EXTRACTION_PROMPT = `Eres un experto en extracción de datos de documentos inmobiliarios españoles.

TAREA: Extrae todos los datos estructurados del siguiente documento.

TIPO DE DOCUMENTO: {document_type}
TEXTO DEL DOCUMENTO:
---
{document_text}
---

DATOS A EXTRAER según tipo de documento:

PARA ESCRITURAS/NOTAS SIMPLES:
- Dirección completa de la propiedad
- Referencia catastral
- Superficie (m²)
- Datos del propietario
- Cargas/gravámenes si existen

PARA CONTRATOS:
- Datos del arrendador (nombre, CIF/DNI)
- Datos del arrendatario (nombre, DNI, email, teléfono)
- Dirección del inmueble
- Renta mensual
- Fecha inicio y fin
- Fianza
- Condiciones especiales

PARA DNI/NIE:
- Nombre completo
- Número de documento
- Fecha de nacimiento
- Fecha de caducidad
- Nacionalidad

PARA FACTURAS:
- Proveedor (nombre, CIF)
- Número de factura
- Fecha
- Concepto
- Importe (base, IVA, total)

PARA SEGUROS:
- Aseguradora
- Número de póliza
- Dirección asegurada
- Coberturas
- Fecha vencimiento
- Prima anual

PARA CERTIFICADOS ENERGÉTICOS:
- Dirección
- Calificación energética (letra)
- Consumo energético
- Emisiones CO2
- Fecha emisión/caducidad

TIPOS DE DATOS (usar estos valores exactos):
- company_info
- property_info
- tenant_info
- contract_info
- financial_info
- insurance_info
- energy_info
- community_info
- provider_info
- maintenance_info

MAPEO A ENTIDADES DEL SISTEMA:
- Company: CIF, nombre, dirección de empresa
- Building: nombre edificio, dirección, año, características
- Unit: número, tipo, superficie, habitaciones, baños, planta
- Tenant: nombre, DNI, email, teléfono, nacionalidad
- Contract: fechas, renta, fianza, condiciones
- Provider: nombre, CIF, servicios
- Insurance: póliza, coberturas, prima

RESPONDE EN JSON:
{
  "fields": [
    {
      "fieldName": "nombre_campo (snake_case)",
      "fieldValue": "valor extraído",
      "dataType": "tipo_del_enum",
      "confidence": 0.0-1.0,
      "pageNumber": 1,
      "targetEntity": "entidad_destino",
      "targetField": "campo_en_entidad"
    }
  ],
  "summary": "Resumen breve del documento en 1-2 frases",
  "warnings": ["advertencia1", "advertencia2"],
  "sensitiveData": {
    "hasSensitive": true/false,
    "types": ["tipo1", "tipo2"]
  }
}`;

const ACTIONS_PROMPT = `Eres un asistente de parametrización para una plataforma de gestión inmobiliaria.

DATOS EXTRAÍDOS DEL DOCUMENTO:
{extracted_data}

TIPO DE DOCUMENTO: {document_type}

ENTIDADES EXISTENTES EN EL SISTEMA DE LA EMPRESA:
- Propiedades: {existing_properties}
- Inquilinos: {existing_tenants}
- Contratos: {existing_contracts}

TAREA: Sugiere acciones de parametrización basándote en los datos extraídos.

TIPOS DE ACCIONES:
1. CREATE: Crear nueva entidad (propiedad, inquilino, contrato, etc.)
2. UPDATE: Actualizar entidad existente
3. LINK: Vincular entidades (inquilino a propiedad, contrato a unidad, etc.)

CRITERIOS:
- Si los datos no coinciden con nada existente → CREATE
- Si hay coincidencia parcial (misma dirección, mismo DNI) → UPDATE
- Si faltan vínculos → LINK
- Si la confianza < 80% → requiresReview = true

RESPONDE EN JSON:
{
  "actions": [
    {
      "action": "create/update/link",
      "entity": "Building/Unit/Tenant/Contract/etc",
      "description": "Descripción clara de la acción",
      "data": { "campo1": "valor1", "campo2": "valor2" },
      "confidence": 0.0-1.0,
      "requiresReview": true/false
    }
  ]
}`;

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Verifica si el servicio de IA está configurado
 */
export function isAIConfigured(): boolean {
  return !!CLAUDE_API_KEY;
}

/**
 * Clasifica un documento según su contenido
 */
export async function classifyDocument(
  text: string,
  filename: string
): Promise<DocumentClassification> {
  if (!isAIConfigured()) {
    throw new Error('AI Document Agent no configurado. Configure ANTHROPIC_API_KEY.');
  }

  const startTime = Date.now();

  try {
    const prompt = CLASSIFICATION_PROMPT
      .replace('{document_text}', truncateText(text, 8000))
      .replace('{filename}', filename);

  const response = await getAnthropicClient().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    temperature: 0.1, // Baja temperatura para clasificación consistente
    messages: [{ role: 'user', content: prompt }],
  });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        logger.info('📄 Documento clasificado', { 
          category: result.category, 
          confidence: result.confidence,
          timeMs: Date.now() - startTime
        });
        return {
          category: result.category as DocumentImportCategory,
          confidence: result.confidence,
          specificType: result.specificType,
          reasoning: result.reasoning,
        };
      }
    }

    throw new Error('No se pudo parsear la clasificación');
  } catch (error: any) {
    logger.error('❌ Error clasificando documento:', error);
    throw error;
  }
}

/**
 * Valida si un documento pertenece a la empresa
 */
export async function validateDocumentOwnership(
  text: string,
  companyInfo: DocumentAnalysisInput['companyInfo']
): Promise<OwnershipValidation> {
  if (!isAIConfigured()) {
    throw new Error('AI Document Agent no configurado. Configure ANTHROPIC_API_KEY.');
  }

  try {
    const prompt = OWNERSHIP_VALIDATION_PROMPT
      .replace('{company_cif}', companyInfo.cif || 'No proporcionado')
      .replace('{company_name}', companyInfo.nombre)
      .replace('{company_address}', companyInfo.direccion || 'No proporcionada')
      .replace('{document_text}', truncateText(text, 6000));

    const response = await getAnthropicClient().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        logger.info('🔐 Validación de propiedad completada', {
          isOwned: result.isOwned,
          matchesCIF: result.matchesCIF,
        });
        return result;
      }
    }

    throw new Error('No se pudo validar la propiedad del documento');
  } catch (error: any) {
    logger.error('❌ Error validando propiedad:', error);
    throw error;
  }
}

/**
 * Extrae datos estructurados de un documento
 */
export async function extractDocumentData(
  text: string,
  documentType: string
): Promise<{
  fields: ExtractedField[];
  summary: string;
  warnings: string[];
  sensitiveData: { hasSensitive: boolean; types: string[] };
}> {
  if (!isAIConfigured()) {
    throw new Error('AI Document Agent no configurado. Configure ANTHROPIC_API_KEY.');
  }

  // Log para diagnóstico
  logger.error('📄 [extractDocumentData] Iniciando con:', {
    textLength: text?.length || 0,
    textPreview: text?.substring(0, 200),
    documentType,
  });

  try {
    const truncatedText = truncateText(text, 10000);
    const prompt = EXTRACTION_PROMPT
      .replace('{document_type}', documentType)
      .replace('{document_text}', truncatedText);

    logger.error('📄 [extractDocumentData] Enviando a Claude:', {
      promptLength: prompt.length,
      truncatedTextLength: truncatedText.length,
    });

    const response = await getAnthropicClient().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    
    logger.error('📄 [extractDocumentData] Respuesta de Claude:', {
      contentType: content.type,
      textLength: content.type === 'text' ? content.text.length : 0,
      textPreview: content.type === 'text' ? content.text.substring(0, 300) : 'N/A',
    });

    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // Mapear los campos extraídos al tipo correcto
        const fields: ExtractedField[] = (result.fields || []).map((f: any) => ({
          fieldName: f.fieldName,
          fieldValue: f.fieldValue,
          dataType: mapDataType(f.dataType),
          confidence: f.confidence,
          pageNumber: f.pageNumber,
          targetEntity: f.targetEntity,
          targetField: f.targetField,
        }));

        logger.info('📊 Datos extraídos', { 
          fieldsCount: fields.length,
          summary: result.summary?.substring(0, 50)
        });

        return {
          fields,
          summary: result.summary || '',
          warnings: result.warnings || [],
          sensitiveData: result.sensitiveData || { hasSensitive: false, types: [] },
        };
      } else {
        logger.error('📄 [extractDocumentData] No se encontró JSON en respuesta:', {
          fullText: content.text.substring(0, 500),
        });
      }
    }

    throw new Error('No se pudieron extraer los datos');
  } catch (error: any) {
    // Mejorar el logging del error
    const errorDetails = {
      message: error.message,
      status: error.status,
      type: error.error?.type,
      errorMessage: error.error?.error?.message,
      requestId: error.error?.request_id,
    };
    logger.error('❌ Error extrayendo datos:', errorDetails);
    throw error;
  }
}

/**
 * Genera sugerencias de acciones de parametrización
 */
export async function generateSuggestedActions(
  extractedFields: ExtractedField[],
  documentType: string,
  existingEntities: {
    properties: Array<{ id: string; direccion: string }>;
    tenants: Array<{ id: string; nombre: string; dni: string }>;
    contracts: Array<{ id: string; direccion: string; tenant: string }>;
  }
): Promise<SuggestedAction[]> {
  if (!isAIConfigured()) {
    throw new Error('AI Document Agent no configurado. Configure ANTHROPIC_API_KEY.');
  }

  try {
    const prompt = ACTIONS_PROMPT
      .replace('{extracted_data}', JSON.stringify(extractedFields, null, 2))
      .replace('{document_type}', documentType)
      .replace('{existing_properties}', JSON.stringify(existingEntities.properties.slice(0, 20)))
      .replace('{existing_tenants}', JSON.stringify(existingEntities.tenants.slice(0, 20)))
      .replace('{existing_contracts}', JSON.stringify(existingEntities.contracts.slice(0, 10)));

    const response = await getAnthropicClient().messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result.actions || [];
      }
    }

    return [];
  } catch (error: any) {
    logger.error('❌ Error generando acciones:', error);
    return [];
  }
}

/**
 * Análisis completo de un documento
 */
export async function analyzeDocument(
  input: DocumentAnalysisInput
): Promise<DocumentAnalysisResult> {
  if (!isAIConfigured()) {
    throw new Error('AI Document Agent no configurado. Configure ANTHROPIC_API_KEY.');
  }

  const startTime = Date.now();
  let tokensUsed = 0;

  try {
    logger.info('🚀 Iniciando análisis de documento', { 
      filename: input.filename,
      textLength: input.text.length 
    });

    // 1. Clasificar el documento
    const classification = await classifyDocument(input.text, input.filename);

    // 2. Validar propiedad
    const ownershipValidation = await validateDocumentOwnership(input.text, input.companyInfo);

    // 3. Extraer datos
    const { fields, summary, warnings, sensitiveData } = await extractDocumentData(
      input.text,
      classification.specificType
    );

    // 4. Generar acciones sugeridas (con entidades vacías por ahora)
    const suggestedActions = await generateSuggestedActions(
      fields,
      classification.specificType,
      { properties: [], tenants: [], contracts: [] }
    );

    const processingTimeMs = Date.now() - startTime;

    logger.info('✅ Análisis completado', {
      filename: input.filename,
      category: classification.category,
      fieldsExtracted: fields.length,
      actionsGenerated: suggestedActions.length,
      processingTimeMs,
    });

    return {
      classification,
      ownershipValidation,
      extractedFields: fields,
      summary,
      warnings,
      suggestedActions,
      sensitiveData,
      processingMetadata: {
        tokensUsed, // TODO: Calcular tokens reales
        processingTimeMs,
        modelUsed: DEFAULT_MODEL,
      },
    };
  } catch (error: any) {
    logger.error('❌ Error en análisis completo:', error);
    throw error;
  }
}

// ============================================================================
// ANÁLISIS DE IMÁGENES CON VISIÓN
// ============================================================================

/**
 * Prompt para análisis de imágenes de documentos de identidad
 */
const IMAGE_ANALYSIS_PROMPT = `Eres un experto en extracción de datos de documentos de identidad españoles.

TAREA: Analiza esta imagen de un documento y extrae todos los datos visibles.

TIPOS DE DOCUMENTOS A DETECTAR:
- DNI español (Documento Nacional de Identidad)
- NIE (Número de Identidad de Extranjero)  
- Pasaporte
- Tarjeta de residencia
- Permiso de conducir

DATOS A EXTRAER:
1. Tipo de documento (dni, nie, pasaporte, permiso_conducir, otro)
2. Número del documento
3. Nombre completo
4. Apellidos
5. Fecha de nacimiento (formato YYYY-MM-DD)
6. Fecha de caducidad (formato YYYY-MM-DD)
7. Nacionalidad
8. Sexo (M/F)
9. Lugar de nacimiento
10. Dirección (si está visible)

IMPORTANTE:
- Si un campo no es legible o no está presente, usa null
- Los números de DNI españoles tienen 8 dígitos + 1 letra
- Los NIE tienen formato X/Y/Z + 7 dígitos + letra
- Las fechas deben estar en formato ISO (YYYY-MM-DD)

RESPONDE SIEMPRE EN JSON CON ESTA ESTRUCTURA:
{
  "classification": {
    "category": "dni_nie",
    "confidence": 0.0-1.0,
    "specificType": "DNI español / NIE / Pasaporte / etc",
    "reasoning": "explicación breve"
  },
  "extractedFields": [
    {"fieldName": "nombreCompleto", "fieldValue": "valor", "dataType": "tenant_info", "confidence": 0.0-1.0, "targetEntity": "Tenant", "targetField": "nombre"},
    {"fieldName": "dni", "fieldValue": "valor", "dataType": "tenant_info", "confidence": 0.0-1.0, "targetEntity": "Tenant", "targetField": "documentoIdentidad"},
    {"fieldName": "fechaNacimiento", "fieldValue": "YYYY-MM-DD", "dataType": "tenant_info", "confidence": 0.0-1.0, "targetEntity": "Tenant", "targetField": "fechaNacimiento"},
    {"fieldName": "nacionalidad", "fieldValue": "valor", "dataType": "tenant_info", "confidence": 0.0-1.0, "targetEntity": "Tenant", "targetField": "nacionalidad"},
    {"fieldName": "fechaCaducidad", "fieldValue": "YYYY-MM-DD", "dataType": "tenant_info", "confidence": 0.0-1.0},
    {"fieldName": "sexo", "fieldValue": "M/F", "dataType": "tenant_info", "confidence": 0.0-1.0},
    {"fieldName": "lugarNacimiento", "fieldValue": "valor", "dataType": "tenant_info", "confidence": 0.0-1.0},
    {"fieldName": "direccion", "fieldValue": "valor", "dataType": "tenant_info", "confidence": 0.0-1.0}
  ],
  "summary": "Resumen del documento analizado",
  "warnings": ["lista de advertencias si las hay"],
  "sensitiveData": {
    "hasSensitive": true,
    "types": ["datos_personales", "documento_identidad"]
  }
}`;

/**
 * Analiza una IMAGEN de documento usando Claude Vision
 * IMPORTANTE: Solo funciona con imágenes reales (JPG, PNG, GIF, WebP)
 * NO funciona con PDFs - los PDFs deben ser rechazados antes de llamar esta función
 */
export async function analyzeImageDocument(
  imageBase64: string,
  mimeType: string,
  filename: string,
  companyInfo: DocumentAnalysisInput['companyInfo']
): Promise<DocumentAnalysisResult> {
  if (!isAIConfigured()) {
    throw new Error('AI Document Agent no configurado. Configure ANTHROPIC_API_KEY.');
  }

  const startTime = Date.now();
  const maxRetries = 3;
  
  logger.info('🖼️ Iniciando análisis de imagen con Claude Vision', { 
    filename,
    mimeType 
  });

  // Determinar el media type correcto para la imagen
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  if (mimeType.includes('png')) mediaType = 'image/png';
  else if (mimeType.includes('gif')) mediaType = 'image/gif';
  else if (mimeType.includes('webp')) mediaType = 'image/webp';

  // Función para hacer la llamada a la API con reintentos
  async function callAPI(retryCount: number = 0): Promise<any> {
    try {
      logger.info(`🖼️ Enviando imagen a Claude Vision`, { 
        filename,
        mediaType,
        attempt: retryCount + 1
      });

      return await getAnthropicClient().messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: IMAGE_ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      });
    } catch (error: any) {
      // Reintentar si es error de servidor sobrecargado (529) o error temporal (500-599)
      if ((error.status === 529 || (error.status >= 500 && error.status < 600)) && retryCount < maxRetries - 1) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        logger.warn(`⚠️ Servidor sobrecargado, reintentando en ${waitTime/1000}s...`, { attempt: retryCount + 1 });
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return callAPI(retryCount + 1);
      }
      throw error;
    }
  }

  try {
    const response = await callAPI();

    const content = response.content[0];
    if (content.type === 'text') {
      // Extraer JSON de la respuesta
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        const processingTimeMs = Date.now() - startTime;
        
        logger.info('✅ Análisis de imagen completado', {
          filename,
          category: result.classification?.category,
          fieldsExtracted: result.extractedFields?.length || 0,
          processingTimeMs,
        });

        return {
          classification: result.classification || {
            category: 'dni_nie' as DocumentImportCategory,
            confidence: 0.8,
            specificType: 'Documento de identidad',
            reasoning: 'Análisis de imagen',
          },
          ownershipValidation: {
            isOwned: false,
            detectedCIF: null,
            detectedCompanyName: null,
            matchesCIF: false,
            matchesName: false,
            confidence: 0.9,
            notes: 'Documento de identidad de tercero (potencial inquilino)',
          },
          extractedFields: (result.extractedFields || []).map((f: any) => ({
            ...f,
            dataType: f.dataType || 'tenant_info',
          })),
          summary: result.summary || `Documento de identidad analizado: ${filename}`,
          warnings: result.warnings || [],
          suggestedActions: [
            {
              action: 'create' as const,
              entity: 'Tenant',
              description: 'Crear nuevo inquilino con los datos extraídos',
              data: extractTenantDataFromFields(result.extractedFields || []),
              confidence: 0.85,
              requiresReview: true,
            },
          ],
          sensitiveData: result.sensitiveData || {
            hasSensitive: true,
            types: ['datos_personales', 'documento_identidad'],
          },
          processingMetadata: {
            tokensUsed: response.usage?.input_tokens || 0,
            processingTimeMs,
            modelUsed: DEFAULT_MODEL,
          },
        };
      }
    }

    throw new Error('No se pudo parsear la respuesta del análisis de imagen');
  } catch (error: any) {
    // Mejorar el logging del error para mostrar detalles completos
    const errorDetails = {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      type: error.error?.type,
      errorType: error.error?.error?.type,
      errorMessage: error.error?.error?.message,
      requestId: error.error?.request_id || error.requestID,
      stack: error.stack?.substring(0, 500),
    };
    logger.error('❌ Error analizando imagen:', errorDetails);
    
    // Re-lanzar con mensaje más descriptivo
    const errorMsg = error.error?.error?.message || error.message || 'Error desconocido';
    const newError = new Error(`Error de Claude Vision: ${errorMsg}`);
    (newError as any).status = error.status;
    (newError as any).originalError = error;
    throw newError;
  }
}

/**
 * Extrae datos de inquilino de los campos extraídos
 */
function extractTenantDataFromFields(fields: any[]): Record<string, any> {
  const data: Record<string, any> = {};
  
  for (const field of fields) {
    if (field.targetField && field.fieldValue) {
      data[field.targetField] = field.fieldValue;
    } else if (field.fieldName && field.fieldValue) {
      // Mapear nombres de campo comunes
      const fieldMappings: Record<string, string> = {
        nombreCompleto: 'nombre',
        nombre: 'nombre',
        apellidos: 'nombre', // Se concatenará
        dni: 'documentoIdentidad',
        nie: 'documentoIdentidad',
        numeroDocumento: 'documentoIdentidad',
        fechaNacimiento: 'fechaNacimiento',
        nacionalidad: 'nacionalidad',
        email: 'email',
        telefono: 'telefono',
      };
      
      const mappedField = fieldMappings[field.fieldName];
      if (mappedField) {
        data[mappedField] = field.fieldValue;
      }
    }
  }
  
  return data;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Trunca texto a un máximo de caracteres
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '\n\n[... texto truncado ...]';
}

/**
 * Mapea string a enum ExtractedDataType
 */
function mapDataType(dataType: string): ExtractedDataType {
  const mapping: Record<string, ExtractedDataType> = {
    'company_info': 'company_info',
    'property_info': 'property_info',
    'tenant_info': 'tenant_info',
    'contract_info': 'contract_info',
    'financial_info': 'financial_info',
    'insurance_info': 'insurance_info',
    'energy_info': 'energy_info',
    'community_info': 'community_info',
    'provider_info': 'provider_info',
    'maintenance_info': 'maintenance_info',
  };
  return mapping[dataType] || 'property_info';
}

/**
 * Calcula similitud entre dos strings (para matching)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  // Levenshtein distance simplificado
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longerLength - editDistance) / longerLength;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export default {
  isAIConfigured,
  classifyDocument,
  validateDocumentOwnership,
  extractDocumentData,
  generateSuggestedActions,
  analyzeDocument,
  analyzeImageDocument,
  calculateStringSimilarity,
};
