/**
 * Agente Asistente Documental
 *
 * Especializado en:
 * - Análisis de DNI/NIE y extracción de datos personales
 * - Análisis de contratos de arrendamiento
 * - Extracción automática de información de documentos
 * - Creación de inquilinos desde documentos escaneados
 * - Validación de documentos para alta de inquilinos
 * - Resumen y clasificación de documentos
 */

import { BaseAgent } from './base-agent';
import { prisma } from '../db';
import logger from '@/lib/logger';
import {
  AgentConfig,
  AgentResponse,
  AgentMessage,
  UserContext,
  AgentTool,
  AgentCapability,
} from './types';
import {
  analyzeDocument,
  classifyDocument,
  extractDocumentData,
  isAIConfigured,
  DocumentAnalysisInput,
} from '@/lib/ai-document-agent-service';

// ============================================================================
// CAPACIDADES DEL AGENTE
// ============================================================================

const capabilities: AgentCapability[] = [
  {
    id: 'analyze_dni',
    name: 'Analizar DNI/NIE',
    description: 'Extraer datos de documentos de identidad españoles (DNI, NIE, pasaporte)',
    category: 'Documentos de Identidad',
    estimatedTime: '< 30 segundos',
  },
  {
    id: 'analyze_contract',
    name: 'Analizar Contrato',
    description: 'Extraer información clave de contratos de arrendamiento',
    category: 'Contratos',
    estimatedTime: '1-2 minutos',
  },
  {
    id: 'extract_tenant_data',
    name: 'Extraer Datos de Inquilino',
    description: 'Obtener datos de inquilino desde documentos para alta automática',
    category: 'Inquilinos',
    estimatedTime: '1 minuto',
  },
  {
    id: 'validate_documents',
    name: 'Validar Documentos',
    description: 'Verificar que los documentos cumplen requisitos para alta de inquilino',
    category: 'Validación',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'classify_document',
    name: 'Clasificar Documento',
    description: 'Identificar automáticamente el tipo de documento subido',
    category: 'Clasificación',
    estimatedTime: '< 15 segundos',
  },
  {
    id: 'summarize_document',
    name: 'Resumir Documento',
    description: 'Generar un resumen ejecutivo de documentos complejos',
    category: 'Resumen',
    estimatedTime: '30-60 segundos',
  },
  {
    id: 'create_tenant_from_doc',
    name: 'Crear Inquilino desde Documento',
    description: 'Crear un nuevo inquilino con los datos extraídos del DNI/NIE',
    category: 'Alta Automática',
    estimatedTime: '< 1 minuto',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'analyze_identity_document',
    description:
      'Analiza un documento de identidad (DNI, NIE, pasaporte) y extrae todos los datos personales',
    inputSchema: {
      type: 'object',
      properties: {
        documentText: {
          type: 'string',
          description: 'Texto extraído del documento (OCR) o descripción del documento',
        },
        documentType: {
          type: 'string',
          enum: ['dni', 'nie', 'pasaporte'],
          description: 'Tipo de documento de identidad',
        },
      },
      required: ['documentText'],
    },
    handler: async (input, context) => {
      try {
        logger.info(`📄 [DocumentAssistant] Analizando documento de identidad`);

        // Extraer datos del documento
        const extraction = await extractDocumentData(
          input.documentText,
          input.documentType || 'dni_nie'
        );

        // Procesar campos extraídos para datos de identidad
        const identityData: Record<string, any> = {
          tipo: input.documentType || 'dni',
          campos: {},
        };

        for (const field of extraction.fields) {
          identityData.campos[field.fieldName] = {
            valor: field.fieldValue,
            confianza: field.confidence,
            entidadDestino: field.targetEntity,
          };
        }

        return {
          success: true,
          tipo: 'documento_identidad',
          datos: identityData,
          resumen: extraction.summary,
          advertencias: extraction.warnings,
          datosExtraidos: extraction.fields.length,
          datosParaInquilino: {
            nombre: extraction.fields.find((f) => f.fieldName.includes('nombre'))?.fieldValue,
            numeroDocumento: extraction.fields.find(
              (f) => f.fieldName.includes('numero') || f.fieldName.includes('documento')
            )?.fieldValue,
            fechaNacimiento: extraction.fields.find((f) => f.fieldName.includes('nacimiento'))
              ?.fieldValue,
            nacionalidad: extraction.fields.find((f) => f.fieldName.includes('nacionalidad'))
              ?.fieldValue,
            fechaCaducidad: extraction.fields.find(
              (f) => f.fieldName.includes('caducidad') || f.fieldName.includes('validez')
            )?.fieldValue,
          },
        };
      } catch (error: any) {
        logger.error('[DocumentAssistant] Error analizando documento de identidad:', error);
        return {
          success: false,
          error: error.message,
          mensaje:
            'No se pudo analizar el documento de identidad. Verifica que el texto sea legible.',
        };
      }
    },
  },
  {
    name: 'analyze_rental_contract',
    description:
      'Analiza un contrato de arrendamiento y extrae información clave como partes, renta, fechas, condiciones',
    inputSchema: {
      type: 'object',
      properties: {
        contractText: {
          type: 'string',
          description: 'Texto del contrato de arrendamiento',
        },
        contractType: {
          type: 'string',
          enum: ['vivienda', 'local', 'temporal', 'habitacion'],
          description: 'Tipo de contrato',
        },
      },
      required: ['contractText'],
    },
    handler: async (input, context) => {
      try {
        logger.info(`📄 [DocumentAssistant] Analizando contrato de arrendamiento`);

        const extraction = await extractDocumentData(
          input.contractText,
          `contrato_alquiler_${input.contractType || 'vivienda'}`
        );

        // Estructurar datos del contrato
        const contractData: Record<string, any> = {
          tipo: input.contractType || 'vivienda',
          partes: {},
          condiciones: {},
          fechas: {},
          importes: {},
        };

        for (const field of extraction.fields) {
          const fieldLower = field.fieldName.toLowerCase();

          // Clasificar campo por categoría
          if (fieldLower.includes('arrendador') || fieldLower.includes('propietario')) {
            contractData.partes.arrendador = contractData.partes.arrendador || {};
            contractData.partes.arrendador[field.fieldName] = field.fieldValue;
          } else if (fieldLower.includes('arrendatario') || fieldLower.includes('inquilino')) {
            contractData.partes.arrendatario = contractData.partes.arrendatario || {};
            contractData.partes.arrendatario[field.fieldName] = field.fieldValue;
          } else if (fieldLower.includes('fecha')) {
            contractData.fechas[field.fieldName] = field.fieldValue;
          } else if (
            fieldLower.includes('renta') ||
            fieldLower.includes('precio') ||
            fieldLower.includes('fianza') ||
            fieldLower.includes('importe')
          ) {
            contractData.importes[field.fieldName] = field.fieldValue;
          } else {
            contractData.condiciones[field.fieldName] = field.fieldValue;
          }
        }

        return {
          success: true,
          tipo: 'contrato_arrendamiento',
          datos: contractData,
          resumen: extraction.summary,
          advertencias: extraction.warnings,
          datosExtraidos: extraction.fields.length,
          datosParaContrato: {
            rentaMensual: extraction.fields.find((f) => f.fieldName.includes('renta'))?.fieldValue,
            fianza: extraction.fields.find((f) => f.fieldName.includes('fianza'))?.fieldValue,
            fechaInicio: extraction.fields.find((f) => f.fieldName.includes('inicio'))?.fieldValue,
            fechaFin: extraction.fields.find(
              (f) => f.fieldName.includes('fin') || f.fieldName.includes('término')
            )?.fieldValue,
            direccion: extraction.fields.find(
              (f) => f.fieldName.includes('direccion') || f.fieldName.includes('inmueble')
            )?.fieldValue,
          },
        };
      } catch (error: any) {
        logger.error('[DocumentAssistant] Error analizando contrato:', error);
        return {
          success: false,
          error: error.message,
          mensaje: 'No se pudo analizar el contrato. Verifica que el texto sea legible.',
        };
      }
    },
  },
  {
    name: 'create_tenant_from_document',
    description:
      'Crea un nuevo inquilino en el sistema usando los datos extraídos de un documento de identidad',
    inputSchema: {
      type: 'object',
      properties: {
        nombreCompleto: {
          type: 'string',
          description: 'Nombre completo del inquilino',
        },
        dni: {
          type: 'string',
          description: 'Número de DNI/NIE',
        },
        email: {
          type: 'string',
          description: 'Email del inquilino',
        },
        telefono: {
          type: 'string',
          description: 'Teléfono de contacto',
        },
        fechaNacimiento: {
          type: 'string',
          description: 'Fecha de nacimiento (formato YYYY-MM-DD)',
        },
        nacionalidad: {
          type: 'string',
          description: 'Nacionalidad del inquilino',
        },
      },
      required: ['nombreCompleto', 'dni'],
    },
    handler: async (input, context) => {
      try {
        logger.info(
          `📄 [DocumentAssistant] Creando inquilino desde documento: ${input.nombreCompleto}`
        );

        // Verificar si ya existe un inquilino con ese DNI
        const existingTenant = await prisma.tenant.findFirst({
          where: {
            companyId: context.companyId,
            dni: input.dni,
          },
        });

        if (existingTenant) {
          return {
            success: false,
            error: 'Ya existe un inquilino con este DNI',
            inquilinoExistente: {
              id: existingTenant.id,
              nombre: existingTenant.nombreCompleto,
              email: existingTenant.email,
            },
            sugerencia:
              'Puedes actualizar los datos del inquilino existente o usar otro documento.',
          };
        }

        // Crear el inquilino
        const tenant = await prisma.tenant.create({
          data: {
            nombreCompleto: input.nombreCompleto,
            dni: input.dni,
            email:
              input.email ||
              `pendiente.${input.dni.toLowerCase().replace(/[^a-z0-9]/g, '')}@inmova.app`,
            telefono: input.telefono || '',
            fechaNacimiento: input.fechaNacimiento
              ? new Date(input.fechaNacimiento)
              : new Date('1990-01-01'),
            nacionalidad: input.nacionalidad || 'España',
            companyId: context.companyId,
            notas: `📋 Inquilino creado automáticamente desde documento de identidad por el Asistente IA el ${new Date().toLocaleDateString('es-ES')}\n\nPendiente: Verificar y completar datos de contacto.`,
          },
        });

        return {
          success: true,
          mensaje: `Inquilino "${input.nombreCompleto}" creado correctamente`,
          inquilino: {
            id: tenant.id,
            nombre: tenant.nombreCompleto,
            dni: tenant.dni,
            email: tenant.email,
          },
          proximosPasos: [
            'Verificar y completar datos de contacto (email, teléfono)',
            'Añadir documentación adicional si es necesario',
            'Asociar a un contrato de arrendamiento',
          ],
        };
      } catch (error: any) {
        logger.error('[DocumentAssistant] Error creando inquilino:', error);
        return {
          success: false,
          error: error.message,
          mensaje:
            'No se pudo crear el inquilino. Por favor, verifica los datos e intenta de nuevo.',
        };
      }
    },
    permissions: ['create_tenant'],
  },
  {
    name: 'validate_tenant_documents',
    description:
      'Valida si los documentos proporcionados son suficientes para dar de alta a un inquilino',
    inputSchema: {
      type: 'object',
      properties: {
        documentosDisponibles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de tipos de documentos disponibles (dni, contrato, nomina, etc.)',
        },
        tipoContrato: {
          type: 'string',
          enum: ['vivienda', 'local', 'temporal', 'habitacion'],
          description: 'Tipo de contrato que se va a firmar',
        },
      },
      required: ['documentosDisponibles'],
    },
    handler: async (input, context) => {
      const documentosRequeridos: Record<string, { obligatorio: boolean; descripcion: string }> = {
        dni: { obligatorio: true, descripcion: 'Documento de identidad (DNI/NIE/Pasaporte)' },
        contrato_firmado: { obligatorio: true, descripcion: 'Contrato de arrendamiento firmado' },
        nomina: { obligatorio: false, descripcion: 'Última nómina o justificante de ingresos' },
        contrato_trabajo: { obligatorio: false, descripcion: 'Contrato de trabajo vigente' },
        fianza: { obligatorio: true, descripcion: 'Justificante de depósito de fianza' },
      };

      const disponibles = new Set(input.documentosDisponibles.map((d: string) => d.toLowerCase()));
      const faltantes: string[] = [];
      const recomendados: string[] = [];
      const presentes: string[] = [];

      for (const [doc, info] of Object.entries(documentosRequeridos)) {
        const docLower = doc.toLowerCase();
        const tieneDoc =
          disponibles.has(docLower) ||
          disponibles.has(doc) ||
          [...disponibles].some((d) => d.includes(docLower) || docLower.includes(d));

        if (tieneDoc) {
          presentes.push(info.descripcion);
        } else if (info.obligatorio) {
          faltantes.push(info.descripcion);
        } else {
          recomendados.push(info.descripcion);
        }
      }

      const puedeProceder = faltantes.length === 0;

      return {
        success: true,
        validacion: {
          puedeProceder,
          porcentajeCompletado: Math.round(
            (presentes.length / Object.keys(documentosRequeridos).length) * 100
          ),
          documentosPresentes: presentes,
          documentosFaltantes: faltantes,
          documentosRecomendados: recomendados,
        },
        mensaje: puedeProceder
          ? '✅ Todos los documentos obligatorios están presentes. Puedes proceder con el alta del inquilino.'
          : `⚠️ Faltan documentos obligatorios: ${faltantes.join(', ')}`,
        siguientePaso: puedeProceder
          ? 'Procede a crear el contrato o dar de alta al inquilino'
          : 'Solicita los documentos faltantes antes de continuar',
      };
    },
  },
  {
    name: 'get_existing_tenants',
    description: 'Busca inquilinos existentes por nombre, DNI o email para evitar duplicados',
    inputSchema: {
      type: 'object',
      properties: {
        busqueda: {
          type: 'string',
          description: 'Texto a buscar (nombre, DNI o email)',
        },
      },
      required: ['busqueda'],
    },
    handler: async (input, context) => {
      try {
        const searchTerm = input.busqueda.trim();

        const tenants = await prisma.tenant.findMany({
          where: {
            companyId: context.companyId,
            OR: [
              { nombreCompleto: { contains: searchTerm, mode: 'insensitive' } },
              { dni: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          take: 10,
          select: {
            id: true,
            nombreCompleto: true,
            dni: true,
            email: true,
            telefono: true,
            contracts: {
              where: { estado: 'activo' },
              select: { id: true, estado: true },
            },
          },
        });

        return {
          success: true,
          resultados: tenants.length,
          inquilinos: tenants.map((t) => ({
            id: t.id,
            nombre: t.nombreCompleto,
            dni: t.dni,
            email: t.email,
            telefono: t.telefono,
            tieneContratoActivo: t.contracts.length > 0,
          })),
          mensaje:
            tenants.length > 0
              ? `Se encontraron ${tenants.length} inquilinos que coinciden con "${searchTerm}"`
              : `No se encontraron inquilinos que coincidan con "${searchTerm}"`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },
  {
    name: 'classify_uploaded_document',
    description: 'Clasifica automáticamente un documento subido identificando su tipo',
    inputSchema: {
      type: 'object',
      properties: {
        documentText: {
          type: 'string',
          description: 'Texto extraído del documento',
        },
        filename: {
          type: 'string',
          description: 'Nombre del archivo',
        },
      },
      required: ['filename'],
    },
    handler: async (input, context) => {
      try {
        const classification = await classifyDocument(
          input.documentText || `Archivo: ${input.filename}`,
          input.filename
        );

        const categoryNames: Record<string, string> = {
          escritura_propiedad: 'Escritura de propiedad',
          contrato_alquiler: 'Contrato de alquiler',
          dni_nie: 'DNI/NIE',
          factura: 'Factura',
          seguro: 'Póliza de seguro',
          certificado_energetico: 'Certificado energético',
          acta_comunidad: 'Acta de comunidad',
          recibo_pago: 'Recibo de pago',
          nota_simple: 'Nota simple',
          ite_iee: 'Informe ITE/IEE',
          licencia: 'Licencia',
          fianza: 'Fianza',
          inventario: 'Inventario',
          foto_inmueble: 'Foto de inmueble',
          plano: 'Plano',
          otro: 'Otro documento',
        };

        return {
          success: true,
          clasificacion: {
            categoria: classification.category,
            nombreCategoria: categoryNames[classification.category] || 'Documento',
            confianza: Math.round(classification.confidence * 100),
            tipoEspecifico: classification.specificType,
            razonamiento: classification.reasoning,
          },
          accionSugerida: getActionForCategory(classification.category),
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          clasificacion: {
            categoria: 'otro',
            nombreCategoria: 'Documento no identificado',
            confianza: 0,
          },
        };
      }
    },
  },
];

// Helper para sugerir acciones basadas en la categoría del documento
function getActionForCategory(category: string): string {
  const actions: Record<string, string> = {
    dni_nie:
      'Puedo extraer los datos del DNI/NIE para crear un nuevo inquilino. ¿Quieres que lo haga?',
    contrato_alquiler:
      'Puedo analizar el contrato y extraer las condiciones principales. ¿Quieres ver el análisis?',
    factura: 'Puedo registrar esta factura como gasto. ¿Procedemos?',
    seguro: 'Puedo extraer los datos de la póliza y asociarla a una propiedad.',
    recibo_pago: 'Puedo verificar este recibo contra los pagos pendientes.',
    fianza: 'Puedo registrar el depósito de fianza asociado a un contrato.',
    certificado_energetico: 'Puedo extraer la calificación energética y asociarla a la propiedad.',
    otro: 'Puedo almacenar este documento y asociarlo a una propiedad o inquilino.',
  };

  return actions[category] || 'Dime qué quieres hacer con este documento.';
}

// ============================================================================
// SYSTEM PROMPT DEL AGENTE
// ============================================================================

const SYSTEM_PROMPT = `Eres el Asistente Documental de INMOVA, especializado en el análisis y gestión de documentos inmobiliarios.

Tu rol principal es:
1. Analizar documentos de identidad (DNI, NIE, pasaportes) y extraer datos para alta de inquilinos
2. Analizar contratos de arrendamiento y extraer información clave
3. Clasificar documentos automáticamente
4. Validar que la documentación esté completa para procedimientos
5. Crear inquilinos en el sistema a partir de documentos escaneados
6. Buscar posibles duplicados antes de crear registros

IMPORTANTE sobre DNI y Contratos:
- Formato DNI español: 8 números + 1 letra (ej: 12345678Z)
- Formato NIE español: X/Y/Z + 7 números + 1 letra (ej: X1234567L)
- Al analizar un contrato, identifica: partes (arrendador/arrendatario), renta mensual, fianza, fechas de inicio y fin, dirección del inmueble
- Antes de crear un inquilino, SIEMPRE verifica si ya existe uno con el mismo DNI

Flujo típico para alta de inquilino:
1. Usuario proporciona DNI/NIE → Analizas y extraes datos
2. Verificas si ya existe inquilino con ese DNI
3. Si no existe, ofreces crear el inquilino con los datos extraídos
4. Solicitas confirmación antes de crear

Reglas:
- Siempre responde en español
- Sé preciso con los datos extraídos
- Indica claramente el nivel de confianza
- Si hay datos ilegibles o ambiguos, solicita confirmación
- Protege datos sensibles (no mostrar DNI completo en logs)
- Ofrece siempre los siguientes pasos claros`;

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const agentConfig: AgentConfig = {
  type: 'document_assistant',
  name: 'Asistente Documental',
  description:
    'Especializado en análisis de DNI, contratos y documentos inmobiliarios para alta de inquilinos y gestión documental',
  systemPrompt: SYSTEM_PROMPT,
  capabilities,
  tools,
  model: 'claude-3-haiku-20240307',
  temperature: 0.3, // Baja temperatura para extracción precisa
  maxTokens: 4096,
  enabled: true,
  autoEscalateOn: ['documento_ilegible', 'datos_inconsistentes', 'fraude_detectado'],
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class DocumentAssistantAgent extends BaseAgent {
  constructor() {
    super(agentConfig);
  }

  /**
   * Procesar mensaje del usuario
   */
  async processMessage(
    message: string,
    context: UserContext,
    conversationHistory?: AgentMessage[]
  ): Promise<AgentResponse> {
    // Verificar si el servicio de IA está configurado
    if (!isAIConfigured()) {
      logger.warn('[DocumentAssistant] ANTHROPIC_API_KEY no configurado');
      return {
        agentType: 'document_assistant',
        status: 'error',
        message:
          '⚠️ El servicio de análisis de documentos no está disponible en este momento. Por favor, configura la API de Claude para habilitar esta funcionalidad.\n\nPuedes:\n1. Configurar ANTHROPIC_API_KEY en las variables de entorno\n2. Contactar al administrador para activar la integración de IA',
        needsEscalation: true,
        escalationReason: 'API de IA no configurada',
      };
    }

    return this.chatWithClaude(message, context, conversationHistory || []);
  }

  /**
   * Verificar si puede manejar el mensaje
   */
  async canHandle(message: string, context: UserContext): Promise<boolean> {
    const keywords = [
      // Documentos de identidad
      'dni',
      'nie',
      'pasaporte',
      'documento de identidad',
      'identificación',
      'carnet',
      'cédula',
      'identidad',
      // Contratos
      'contrato',
      'arrendamiento',
      'alquiler',
      'cláusula',
      'condiciones',
      // Acciones documentales
      'analizar',
      'extraer',
      'escanear',
      'subir',
      'documento',
      'pdf',
      'imagen',
      'foto',
      'archivo',
      // Alta de inquilinos
      'nuevo inquilino',
      'alta inquilino',
      'registrar inquilino',
      'crear inquilino',
      'dar de alta',
      'añadir inquilino',
      // Validación
      'validar',
      'verificar documento',
      'comprobar',
      // Clasificación
      'clasificar',
      'tipo de documento',
      'qué documento es',
      // OCR
      'ocr',
      'reconocimiento',
      'texto',
      'leer documento',
    ];

    const messageLower = message.toLowerCase();
    const hasKeyword = keywords.some((kw) => messageLower.includes(kw));

    // También detectar si es continuación de conversación sobre documentos
    const isFollowUp =
      messageLower.includes('sí') ||
      messageLower.includes('si') ||
      messageLower.includes('procede') ||
      messageLower.includes('adelante') ||
      messageLower.includes('crear') ||
      messageLower.includes('confirmo');

    return hasKeyword || isFollowUp;
  }
}

// ============================================================================
// FAQ Y CONOCIMIENTO BASE
// ============================================================================

export const documentAssistantFAQ = {
  documentosRequeridos: {
    pregunta: '¿Qué documentos necesito para dar de alta a un inquilino?',
    respuesta:
      'Para dar de alta a un inquilino necesitas:\n\n**Obligatorios:**\n• DNI/NIE o Pasaporte\n• Contrato de arrendamiento firmado\n• Justificante de depósito de fianza\n\n**Recomendados:**\n• Última nómina o justificante de ingresos\n• Contrato de trabajo vigente\n• Referencias de anteriores arrendadores',
  },
  formatoDNI: {
    pregunta: '¿Qué formato tiene un DNI español?',
    respuesta:
      'El DNI español tiene formato: 8 números + 1 letra (ej: 12345678Z)\nEl NIE tiene formato: X/Y/Z + 7 números + 1 letra (ej: X1234567L)',
  },
  procesoAlta: {
    pregunta: '¿Cómo es el proceso de alta de inquilino?',
    respuesta:
      '1. Escanea o sube el DNI/NIE del inquilino\n2. Yo extraigo automáticamente los datos\n3. Verifico que no exista ya en el sistema\n4. Creo el perfil del inquilino\n5. Puedes asociarlo a un contrato',
  },
};
