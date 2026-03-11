// @ts-nocheck
/**
 * Servicio de IA Assistant con Claude y Tool Calling
 *
 * Capacidades:
 * - Uso de Claude (Anthropic) con tool calling nativo
 * - Herramientas para consultar y manipular datos del sistema
 * - Conversación contextual avanzada
 * - Ejecución automática de acciones
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './db';
import logger from '@/lib/logger';

// ============================================================================
// CONFIGURACIÓN ANTHROPIC
// ============================================================================
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

import { CLAUDE_MODEL_PRIMARY } from './ai-model-config';
const CLAUDE_MODEL = CLAUDE_MODEL_PRIMARY;

// ============================================================================
// TIPOS
// ============================================================================
export interface AssistantContext {
  userId: string;
  userType: 'tenant' | 'landlord' | 'admin' | 'provider' | 'operador' | 'gestor';
  userName: string;
  userEmail: string;
  companyId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AssistantResponse {
  type: 'text' | 'action_executed' | 'data_retrieved';
  content: string;
  data?: any;
  toolsUsed?: string[];
}

// ============================================================================
// DEFINICIÓN DE HERRAMIENTAS (TOOLS)
// ============================================================================
const tools: Anthropic.Messages.Tool[] = [
  {
    name: 'search_buildings',
    description:
      'Busca edificios en el sistema. Puede filtrar por nombre, dirección, ciudad o estado.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda para nombre, dirección o ciudad',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_tenants',
    description: 'Busca inquilinos en el sistema. Puede filtrar por nombre, email o teléfono.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda para nombre, email o teléfono',
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio para filtrar inquilinos',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_building_details',
    description:
      'Obtiene detalles completos de un edificio específico incluyendo unidades, inquilinos y contratos.',
    input_schema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio',
        },
      },
      required: ['buildingId'],
    },
  },
  {
    name: 'get_tenant_details',
    description:
      'Obtiene detalles completos de un inquilino incluyendo contratos activos, pagos y solicitudes de mantenimiento.',
    input_schema: {
      type: 'object',
      properties: {
        tenantId: {
          type: 'string',
          description: 'ID del inquilino',
        },
      },
      required: ['tenantId'],
    },
  },
  {
    name: 'search_contracts',
    description: 'Busca contratos en el sistema. Puede filtrar por estado, fechas o inquilino.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Estado del contrato (activo, vencido, próximo_vencer)',
          enum: ['activo', 'vencido', 'próximo_vencer'],
        },
        tenantId: {
          type: 'string',
          description: 'ID del inquilino',
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)',
        },
      },
    },
  },
  {
    name: 'get_payment_status',
    description: 'Obtiene el estado de pagos de un inquilino o contrato específico.',
    input_schema: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'ID del contrato',
        },
        tenantId: {
          type: 'string',
          description: 'ID del inquilino',
        },
        includeHistory: {
          type: 'boolean',
          description: 'Incluir historial de pagos',
        },
      },
    },
  },
  {
    name: 'create_maintenance_request',
    description: 'Crea una nueva solicitud de mantenimiento para una unidad o edificio.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título de la solicitud',
        },
        description: {
          type: 'string',
          description: 'Descripción detallada del problema',
        },
        unitId: {
          type: 'string',
          description: 'ID de la unidad',
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio',
        },
        priority: {
          type: 'string',
          description: 'Prioridad (baja, media, alta, urgente)',
          enum: ['baja', 'media', 'alta', 'urgente'],
        },
        category: {
          type: 'string',
          description: 'Categoría (fontanería, electricidad, carpintería, limpieza, otro)',
        },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'search_maintenance_requests',
    description: 'Busca solicitudes de mantenimiento con filtros.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Estado (pendiente, en_progreso, completada, cancelada)',
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio',
        },
        priority: {
          type: 'string',
          description: 'Prioridad (baja, media, alta, urgente)',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)',
        },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Crea una nueva tarea en el sistema.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título de la tarea',
        },
        description: {
          type: 'string',
          description: 'Descripción de la tarea',
        },
        assignedTo: {
          type: 'string',
          description: 'ID del usuario asignado',
        },
        priority: {
          type: 'string',
          description: 'Prioridad (baja, media, alta, urgente)',
          enum: ['baja', 'media', 'alta', 'urgente'],
        },
        dueDate: {
          type: 'string',
          description: 'Fecha de vencimiento (ISO 8601)',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'search_tasks',
    description: 'Busca tareas en el sistema.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Estado de la tarea (pendiente, en_progreso, completada)',
        },
        assignedTo: {
          type: 'string',
          description: 'ID del usuario asignado',
        },
        priority: {
          type: 'string',
          description: 'Prioridad',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)',
        },
      },
    },
  },
  {
    name: 'get_dashboard_stats',
    description:
      'Obtiene estadísticas del dashboard como número de edificios, inquilinos, contratos activos, pagos pendientes, etc.',
    input_schema: {
      type: 'object',
      properties: {
        includeFinancial: {
          type: 'boolean',
          description: 'Incluir datos financieros',
        },
        includeMaintenance: {
          type: 'boolean',
          description: 'Incluir datos de mantenimiento',
        },
      },
    },
  },
  {
    name: 'search_units',
    description: 'Busca unidades/propiedades en el sistema.',
    input_schema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio',
        },
        status: {
          type: 'string',
          description: 'Estado (disponible, ocupada, mantenimiento)',
          enum: ['disponible', 'ocupada', 'mantenimiento'],
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)',
        },
      },
    },
  },
  // === HERRAMIENTAS DE ACCIÓN (Premium) ===
  {
    name: 'analyze_document',
    description:
      'Analiza un documento (PDF, Excel, imagen) subido por el usuario. Extrae datos como inquilinos, contratos, importes, fechas, direcciones. Usar cuando el usuario sube un archivo.',
    input_schema: {
      type: 'object',
      properties: {
        documentText: {
          type: 'string',
          description: 'Texto extraído del documento',
        },
        documentType: {
          type: 'string',
          description: 'Tipo de documento detectado',
          enum: [
            'contrato',
            'factura',
            'dni',
            'escritura',
            'certificado',
            'contabilidad',
            'catastro',
            'otro',
          ],
        },
        action: {
          type: 'string',
          description: 'Qué hacer con los datos extraídos',
          enum: ['extract_data', 'import_to_system', 'summarize', 'validate'],
        },
      },
      required: ['documentText', 'documentType'],
    },
  },
  {
    name: 'valuate_property',
    description:
      'Valora un activo inmobiliario por dirección o referencia catastral. Estima valor de venta, alquiler, ROI. Usar cuando el usuario pide valorar un inmueble.',
    input_schema: {
      type: 'object',
      properties: {
        direccion: { type: 'string', description: 'Dirección del inmueble' },
        ciudad: { type: 'string', description: 'Ciudad' },
        superficie: { type: 'number', description: 'Superficie en m²' },
        tipo: {
          type: 'string',
          description: 'Tipo de activo',
          enum: ['vivienda', 'local', 'oficina', 'nave', 'garaje', 'edificio'],
        },
        habitaciones: { type: 'number', description: 'Número de habitaciones (si vivienda)' },
        refCatastral: { type: 'string', description: 'Referencia catastral (si disponible)' },
      },
      required: ['direccion', 'tipo'],
    },
  },
  {
    name: 'search_catastro',
    description:
      'Consulta el Catastro público español por referencia catastral o dirección. Devuelve superficie, uso, año de construcción.',
    input_schema: {
      type: 'object',
      properties: {
        refCatastral: { type: 'string', description: 'Referencia catastral (14-20 caracteres)' },
        provincia: { type: 'string', description: 'Provincia (para búsqueda por dirección)' },
        municipio: { type: 'string', description: 'Municipio' },
        via: { type: 'string', description: 'Nombre de la vía' },
        numero: { type: 'string', description: 'Número' },
      },
    },
  },
  {
    name: 'get_financial_summary',
    description:
      'Obtiene un resumen financiero de la empresa: ingresos, gastos, ocupación, morosidad, contratos próximos a vencer.',
    input_schema: {
      type: 'object',
      properties: {
        periodo: {
          type: 'string',
          description: 'Periodo: "mes_actual", "trimestre", "año"',
          enum: ['mes_actual', 'trimestre', 'año'],
        },
      },
    },
  },
  // === CRUD OPERATIONS ===
  {
    name: 'create_building',
    description:
      'Crear nuevo edificio. Necesita: nombre, dirección, ciudad. Opcional: codigoPostal, tipo.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        direccion: { type: 'string' },
        ciudad: { type: 'string' },
        codigoPostal: { type: 'string' },
        tipo: { type: 'string', enum: ['residencial', 'comercial', 'industrial', 'mixto'] },
      },
      required: ['nombre', 'direccion'],
    },
  },
  {
    name: 'update_building',
    description: 'Actualizar edificio existente por ID.',
    input_schema: {
      type: 'object',
      properties: {
        buildingId: { type: 'string' },
        nombre: { type: 'string' },
        direccion: { type: 'string' },
        ciudad: { type: 'string' },
      },
      required: ['buildingId'],
    },
  },
  {
    name: 'create_unit',
    description: 'Crear unidad en un edificio. Necesita: buildingId, numero, tipo, superficie.',
    input_schema: {
      type: 'object',
      properties: {
        buildingId: { type: 'string' },
        numero: { type: 'string' },
        tipo: {
          type: 'string',
          enum: ['vivienda', 'local', 'oficina', 'garaje', 'trastero', 'nave_industrial'],
        },
        superficie: { type: 'number' },
        habitaciones: { type: 'number' },
        banos: { type: 'number' },
        rentaMensual: { type: 'number' },
      },
      required: ['buildingId', 'numero', 'tipo', 'superficie'],
    },
  },
  {
    name: 'update_unit',
    description: 'Actualizar unidad por ID. Puede cambiar superficie, renta, estado, habitaciones.',
    input_schema: {
      type: 'object',
      properties: {
        unitId: { type: 'string' },
        superficie: { type: 'number' },
        rentaMensual: { type: 'number' },
        estado: { type: 'string', enum: ['disponible', 'ocupada', 'mantenimiento'] },
        habitaciones: { type: 'number' },
        banos: { type: 'number' },
      },
      required: ['unitId'],
    },
  },
  {
    name: 'create_tenant',
    description: 'Crear inquilino. Necesita: nombre, DNI, email, teléfono.',
    input_schema: {
      type: 'object',
      properties: {
        nombreCompleto: { type: 'string' },
        dni: { type: 'string' },
        email: { type: 'string' },
        telefono: { type: 'string' },
        iban: { type: 'string' },
        ciudad: { type: 'string' },
        metodoPago: { type: 'string' },
      },
      required: ['nombreCompleto', 'dni', 'email', 'telefono'],
    },
  },
  {
    name: 'update_tenant',
    description: 'Actualizar inquilino por ID.',
    input_schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string' },
        email: { type: 'string' },
        telefono: { type: 'string' },
        iban: { type: 'string' },
        direccionActual: { type: 'string' },
        ciudad: { type: 'string' },
      },
      required: ['tenantId'],
    },
  },
  {
    name: 'create_contract',
    description:
      'Crear contrato vinculando inquilino con unidad. Necesita: tenantId, unitId, fechaInicio, rentaMensual.',
    input_schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string' },
        unitId: { type: 'string' },
        fechaInicio: { type: 'string', description: 'YYYY-MM-DD' },
        fechaFin: { type: 'string', description: 'YYYY-MM-DD' },
        rentaMensual: { type: 'number' },
        deposito: { type: 'number' },
        tipo: { type: 'string', enum: ['residencial', 'comercial', 'temporal'] },
      },
      required: ['tenantId', 'unitId', 'fechaInicio', 'rentaMensual'],
    },
  },
  {
    name: 'update_contract',
    description: 'Actualizar contrato (renta, fechas, estado).',
    input_schema: {
      type: 'object',
      properties: {
        contractId: { type: 'string' },
        rentaMensual: { type: 'number' },
        fechaFin: { type: 'string' },
        estado: { type: 'string', enum: ['activo', 'vencido', 'cancelado'] },
      },
      required: ['contractId'],
    },
  },
  {
    name: 'terminate_contract',
    description: 'Finalizar un contrato activo marcándolo como vencido.',
    input_schema: {
      type: 'object',
      properties: { contractId: { type: 'string' }, motivo: { type: 'string' } },
      required: ['contractId'],
    },
  },
  {
    name: 'create_payment',
    description: 'Registrar un pago para un contrato.',
    input_schema: {
      type: 'object',
      properties: {
        contractId: { type: 'string' },
        monto: { type: 'number' },
        periodo: { type: 'string', description: 'YYYY-MM' },
        metodoPago: { type: 'string' },
        concepto: { type: 'string' },
        referencia: { type: 'string' },
      },
      required: ['contractId', 'monto', 'periodo'],
    },
  },
  {
    name: 'search_payments',
    description: 'Buscar pagos. Filtrar por estado, periodo, inquilino.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', enum: ['pendiente', 'pagado', 'atrasado'] },
        periodo: { type: 'string' },
        tenantId: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_pending_payments',
    description: 'Obtener todos los pagos pendientes o atrasados.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'create_expense',
    description: 'Registrar un gasto.',
    input_schema: {
      type: 'object',
      properties: {
        concepto: { type: 'string' },
        monto: { type: 'number' },
        categoria: {
          type: 'string',
          enum: [
            'mantenimiento',
            'impuestos',
            'seguros',
            'servicios',
            'reparaciones',
            'comunidad',
            'otro',
          ],
        },
        buildingId: { type: 'string' },
        fecha: { type: 'string' },
      },
      required: ['concepto', 'monto', 'categoria'],
    },
  },
  {
    name: 'search_expenses',
    description: 'Buscar gastos por categoría, edificio o periodo.',
    input_schema: {
      type: 'object',
      properties: {
        categoria: { type: 'string' },
        buildingId: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'search_documents',
    description: 'Buscar documentos por tipo, entidad o nombre.',
    input_schema: {
      type: 'object',
      properties: {
        tipo: { type: 'string' },
        unitId: { type: 'string' },
        tenantId: { type: 'string' },
        buildingId: { type: 'string' },
        nombre: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_expiring_contracts',
    description: 'Obtener contratos que vencen en los próximos N días.',
    input_schema: {
      type: 'object',
      properties: { dias: { type: 'number', description: 'Días hasta vencimiento (default 60)' } },
    },
  },
  {
    name: 'get_vacant_units',
    description: 'Obtener todas las unidades disponibles (sin contrato activo).',
    input_schema: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: ['vivienda', 'local', 'oficina', 'garaje', 'nave_industrial'],
        },
        buildingId: { type: 'string' },
      },
    },
  },
  {
    name: 'get_company_settings',
    description: 'Obtener configuración de la empresa (alertas, módulos activos, plan).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'update_company_settings',
    description: 'Actualizar configuración (días de alerta de contratos, etc.).',
    input_schema: {
      type: 'object',
      properties: { contractExpirationAlertDays: { type: 'number' } },
      required: [],
    },
  },
  {
    name: 'calculate_mortgage',
    description: 'Calcular cuota hipotecaria mensual.',
    input_schema: {
      type: 'object',
      properties: {
        importe: { type: 'number', description: 'Importe del préstamo en €' },
        plazoAnos: { type: 'number', description: 'Plazo en años' },
        tipoInteres: { type: 'number', description: 'Tipo de interés anual %' },
      },
      required: ['importe', 'plazoAnos', 'tipoInteres'],
    },
  },
  {
    name: 'calculate_roi',
    description: 'Calcular rentabilidad de inversión inmobiliaria.',
    input_schema: {
      type: 'object',
      properties: {
        precioCompra: { type: 'number' },
        rentaMensual: { type: 'number' },
        gastosMensuales: { type: 'number' },
        ibi: { type: 'number' },
        seguros: { type: 'number' },
        comunidad: { type: 'number' },
      },
      required: ['precioCompra', 'rentaMensual'],
    },
  },
  {
    name: 'generate_report',
    description: 'Generar reporte de la empresa (financiero, ocupación, morosidad, contratos).',
    input_schema: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: ['financiero', 'ocupacion', 'morosidad', 'contratos', 'completo'],
        },
        periodo: { type: 'string', description: 'YYYY o YYYY-MM' },
      },
      required: ['tipo'],
    },
  },
  {
    name: 'get_accounting_summary',
    description: 'Resumen contable: ingresos vs gastos por periodo.',
    input_schema: {
      type: 'object',
      properties: { periodo: { type: 'string', description: 'YYYY-MM o YYYY' } },
    },
  },
  // ========================================================================
  // AGENTES ESPECIALIZADOS — El asistente delega a estos agentes
  // ========================================================================
  {
    name: 'evaluate_investment_proposal',
    description:
      'Evalúa una propuesta de inversión inmobiliaria de un broker. Analiza precio, yields, riesgos y emite veredicto: COMPRAR/NEGOCIAR/DESCARTAR. Usar cuando el usuario pide analizar una oportunidad de compra.',
    input_schema: {
      type: 'object',
      properties: {
        proposalText: {
          type: 'string',
          description: 'Texto de la propuesta del broker o descripción del activo',
        },
      },
      required: ['proposalText'],
    },
  },
  {
    name: 'simulate_acquisition',
    description:
      'Simula la compra de un inmueble: calcula yield, cash-flow, ROI, impacto fiscal, proyección a 10 años. Usar cuando preguntan "qué pasaría si compramos X".',
    input_schema: {
      type: 'object',
      properties: {
        precioCompra: { type: 'number', description: 'Precio de compra en euros' },
        rentaMensualEstimada: { type: 'number', description: 'Renta mensual estimada en euros' },
        hipotecaCapital: { type: 'number', description: 'Capital hipoteca (0 si sin hipoteca)' },
        hipotecaInteres: { type: 'number', description: 'Tipo interés hipoteca (%)' },
      },
      required: ['precioCompra', 'rentaMensualEstimada'],
    },
  },
  {
    name: 'negotiate_deal',
    description:
      'Genera estrategia de negociación para una compra. Calcula contraoferta, argumentos, concesiones. Usar cuando piden "cómo negociar" o "qué ofrecer".',
    input_schema: {
      type: 'object',
      properties: {
        precioSolicitado: { type: 'number', description: 'Precio que pide el vendedor' },
        rentaMensualActual: { type: 'number', description: 'Renta mensual actual del activo' },
        ubicacion: { type: 'string', description: 'Dirección o zona' },
      },
      required: ['precioSolicitado'],
    },
  },
  {
    name: 'screen_tenant',
    description:
      'Analiza solvencia de un candidato a inquilino. Calcula score de riesgo y recomendación. Usar cuando piden "evaluar inquilino" o "verificar solvencia".',
    input_schema: {
      type: 'object',
      properties: {
        tenantName: { type: 'string', description: 'Nombre del candidato' },
        rentaMensual: { type: 'number', description: 'Renta mensual de la vivienda' },
        ingresosMensuales: { type: 'number', description: 'Ingresos mensuales del candidato' },
        tipoContrato: {
          type: 'string',
          description: 'Tipo contrato laboral: indefinido, temporal, autónomo',
        },
      },
      required: ['tenantName', 'rentaMensual'],
    },
  },
  {
    name: 'generate_rental_contract',
    description:
      'Genera un contrato de arrendamiento LAU personalizado. Usar cuando piden "crear contrato" o "generar contrato".',
    input_schema: {
      type: 'object',
      properties: {
        tenantName: { type: 'string' },
        tenantDni: { type: 'string' },
        address: { type: 'string' },
        unitNumber: { type: 'string' },
        rentaMensual: { type: 'number' },
        tipo: {
          type: 'string',
          description: 'vivienda_habitual, temporada, local_comercial, garaje',
        },
      },
      required: ['tenantName', 'address', 'rentaMensual'],
    },
  },
  {
    name: 'check_delinquency_risk',
    description:
      'Obtiene el score de riesgo de morosidad de los inquilinos. Usar cuando preguntan por morosos, riesgo de impago, o inquilinos problemáticos.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'optimize_rents',
    description:
      'Analiza qué unidades están rentando por debajo del mercado y calcula potencial de incremento. Usar cuando preguntan por "optimizar rentas" o "subir precios".',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'find_missing_documents',
    description:
      'Detecta documentación faltante: contratos sin PDF, DNIs caducados, seguros vencidos. Usar cuando preguntan por "documentos pendientes" o "qué falta".',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_market_data',
    description:
      'Obtiene datos de mercado (Idealista/Fotocasa) para una zona: precio venta/m², alquiler/m², tendencia. Usar cuando preguntan por "precios de mercado" o "comparar con zona".',
    input_schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Dirección o zona (ej: Chamberí, Silvela, Espronceda)',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_predictive_maintenance',
    description:
      'Analiza patrones de averías por edificio y predice próximas incidencias. Usar cuando preguntan por "mantenimiento preventivo" o "averías recurrentes".',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  // ========================================================================
  // NUEVAS TOOLS — Mejoras Grupo Vidaro
  // ========================================================================
  {
    name: 'get_rent_updates_pending',
    description:
      'Obtiene contratos con actualización de renta IPC pendiente (aniversario próximo). Muestra renta actual → nueva renta con % de incremento.',
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Días hacia adelante para buscar (default 30)' },
      },
    },
  },
  {
    name: 'apply_rent_update',
    description:
      'Aplica actualización de renta IPC a un contrato específico. Actualiza la renta mensual.',
    input_schema: {
      type: 'object',
      properties: {
        contractId: { type: 'string', description: 'ID del contrato' },
        newRent: { type: 'number', description: 'Nueva renta mensual en euros' },
      },
      required: ['contractId', 'newRent'],
    },
  },
  {
    name: 'get_fianzas_summary',
    description:
      'Resumen de fianzas/depósitos de todos los contratos activos. Muestra depositadas vs pendientes con importes.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_building_360',
    description:
      'Vista 360° completa de un edificio: unidades, contratos, pagos, gastos, seguros, ocupación, ingresos. Todo en una llamada.',
    input_schema: {
      type: 'object',
      properties: {
        buildingId: { type: 'string', description: 'ID del edificio' },
        buildingName: {
          type: 'string',
          description: 'Nombre del edificio (para buscar por nombre)',
        },
      },
    },
  },
  {
    name: 'get_patrimonio_summary',
    description:
      'Resumen del patrimonio total del grupo: inmobiliario, financiero, private equity, tesorería. Vista holding o consolidada.',
    input_schema: {
      type: 'object',
      properties: {
        view: {
          type: 'string',
          enum: ['holding', 'consolidated'],
          description: 'Vista holding (solo empresa raíz) o consolidated (todo el grupo)',
        },
      },
    },
  },
  {
    name: 'generate_monthly_invoices',
    description:
      'Genera facturas/recibos mensuales para todos los contratos activos que no tienen pago registrado este mes.',
    input_schema: {
      type: 'object',
      properties: {
        dryRun: {
          type: 'boolean',
          description: 'Si true, solo muestra lo que haría sin crear pagos reales',
        },
      },
    },
  },
  {
    name: 'bank_reconciliation',
    description:
      'Ejecuta reconciliación bancaria: compara cobros bancarios con pagos registrados, detecta impagos.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  // ─── Nuevos módulos Homming ───
  {
    name: 'search_liquidaciones',
    description:
      'Busca liquidaciones a propietarios. Filtra por propietario, inmueble, estado (pendiente/pagada/anulada), periodo.',
    input_schema: {
      type: 'object',
      properties: {
        propietario: { type: 'string', description: 'Nombre del propietario' },
        estado: { type: 'string', description: 'Estado: pendiente, pagada, anulada' },
        periodo: { type: 'string', description: 'Periodo: YYYY-MM o año' },
      },
    },
  },
  {
    name: 'create_liquidacion',
    description:
      'Crea una liquidación para un propietario. Calcula automáticamente neto = renta - honorarios - gastos.',
    input_schema: {
      type: 'object',
      properties: {
        propietarioId: { type: 'string', description: 'ID del propietario' },
        inmuebleId: { type: 'string', description: 'ID del inmueble' },
        rentaCobrada: { type: 'number', description: 'Renta cobrada en el periodo' },
        honorariosPorcentaje: { type: 'number', description: '% de honorarios de gestión' },
        gastosRepercutidos: { type: 'number', description: 'Gastos a descontar' },
      },
      required: ['propietarioId', 'inmuebleId', 'rentaCobrada'],
    },
  },
  {
    name: 'search_facturas',
    description:
      'Busca facturas emitidas. Filtra por serie, estado (borrador/emitida/pagada/anulada), destinatario, fechas.',
    input_schema: {
      type: 'object',
      properties: {
        serie: { type: 'string', description: 'Prefijo de serie (F-, P-, R-)' },
        estado: { type: 'string', description: 'Estado de la factura' },
        destinatario: { type: 'string', description: 'Nombre o NIF del destinatario' },
      },
    },
  },
  {
    name: 'search_candidates',
    description:
      'Busca candidatos/solicitantes de alquiler. Filtra por estado del pipeline (nuevo/contactado/visita_programada/reservado/descartado), scoring, inmueble.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', description: 'Estado en el pipeline' },
        scoringMin: { type: 'number', description: 'Scoring mínimo (0-100)' },
        inmueble: { type: 'string', description: 'Nombre del inmueble' },
      },
    },
  },
  {
    name: 'classify_incident',
    description:
      'Clasifica una incidencia automáticamente: determina tipo, prioridad, proveedor sugerido y coste estimado usando IA.',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string', description: 'Descripción de la incidencia' },
        ubicacion: { type: 'string', description: 'Ubicación en el inmueble' },
      },
      required: ['descripcion'],
    },
  },
  {
    name: 'get_rent_updates',
    description:
      'Obtiene actualizaciones de renta IPC pendientes o recientes. Muestra contratos con IPC por aplicar.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', description: 'Estado: pendiente, aplicada, comunicada' },
      },
    },
  },
  {
    name: 'get_advanced_report',
    description:
      'Genera un reporte avanzado. Tipos: inquilinos, contratos, incidencias, ingresos, gastos, liquidaciones, facturas, pagos, rentabilidad, inmuebles, propietarios, impagos, fiscal.',
    input_schema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', description: 'Tipo de reporte' },
        fechaDesde: { type: 'string', description: 'Fecha desde (YYYY-MM-DD)' },
        fechaHasta: { type: 'string', description: 'Fecha hasta (YYYY-MM-DD)' },
      },
      required: ['tipo'],
    },
  },
  {
    name: 'dispatch_specialized_agent',
    description:
      'Despacha la consulta a un agente IA especializado. Agentes: inversiones (análisis de oportunidades), family_office (patrimonio y PE), negociacion (estrategia de compra), soporte (tickets y FAQs), mantenimiento_predictivo (prevención averías), fiscal (optimización fiscal).',
    input_schema: {
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          description:
            'Nombre del agente: inversiones, family_office, negociacion, soporte, mantenimiento_predictivo, fiscal',
        },
        query: { type: 'string', description: 'Consulta para el agente especializado' },
      },
      required: ['agent', 'query'],
    },
  },
];

// ============================================================================
// IMPLEMENTACIÓN DE HERRAMIENTAS
// ============================================================================

/**
 * Delega ejecución a un agente especializado (API interna)
 */
async function delegateToAgent(
  apiPath: string,
  body: any,
  context: AssistantContext,
  method: 'POST' | 'GET' = 'POST'
): Promise<any> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}${apiPath}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-company-id': context.companyId,
    };

    const res = await fetch(url, {
      method,
      headers,
      ...(method === 'POST' && { body: JSON.stringify(body) }),
    });

    if (res.ok) {
      return await res.json();
    }

    const errorText = await res.text().catch(() => '');
    return {
      success: false,
      error: `Agent returned ${res.status}`,
      details: errorText.substring(0, 200),
    };
  } catch (error: any) {
    logger.warn(`[Agent Delegate] Error calling ${apiPath}:`, error.message);
    return { success: false, error: `Error connecting to agent: ${error.message}` };
  }
}

async function executeTool(
  toolName: string,
  toolInput: any,
  context: AssistantContext
): Promise<any> {
  logger.info(`🔧 Executing tool: ${toolName}`, { toolInput });

  try {
    switch (toolName) {
      case 'search_buildings':
        return await searchBuildings(toolInput, context);

      case 'search_tenants':
        return await searchTenants(toolInput, context);

      case 'get_building_details':
        return await getBuildingDetails(toolInput, context);

      case 'get_tenant_details':
        return await getTenantDetails(toolInput, context);

      case 'search_contracts':
        return await searchContracts(toolInput, context);

      case 'get_payment_status':
        return await getPaymentStatus(toolInput, context);

      case 'create_maintenance_request':
        return await createMaintenanceRequest(toolInput, context);

      case 'search_maintenance_requests':
        return await searchMaintenanceRequests(toolInput, context);

      case 'create_task':
        return await createTask(toolInput, context);

      case 'search_tasks':
        return await searchTasks(toolInput, context);

      case 'get_dashboard_stats':
        return await getDashboardStats(toolInput, context);

      case 'search_units':
        return await searchUnits(toolInput, context);

      case 'analyze_document':
        return await analyzeDocument(toolInput, context);

      case 'valuate_property':
        return await valuateProperty(toolInput, context);

      case 'search_catastro':
        return await searchCatastroTool(toolInput);

      case 'get_financial_summary':
        return await getFinancialSummary(toolInput, context);

      case 'create_building':
        return await createBuilding(toolInput, context);
      case 'update_building':
        return await updateBuilding(toolInput, context);
      case 'create_unit':
        return await createUnit(toolInput, context);
      case 'update_unit':
        return await updateUnit(toolInput, context);
      case 'create_tenant':
        return await createTenant(toolInput, context);
      case 'update_tenant':
        return await updateTenant(toolInput, context);
      case 'create_contract':
        return await createContract(toolInput, context);
      case 'update_contract':
        return await updateContract(toolInput, context);
      case 'terminate_contract':
        return await terminateContract(toolInput, context);
      case 'create_payment':
        return await createPayment(toolInput, context);
      case 'search_payments':
        return await searchPayments(toolInput, context);
      case 'get_pending_payments':
        return await getPendingPayments(toolInput, context);
      case 'create_expense':
        return await createExpense(toolInput, context);
      case 'search_expenses':
        return await searchExpenses(toolInput, context);
      case 'search_documents':
        return await searchDocuments(toolInput, context);
      case 'get_expiring_contracts':
        return await getExpiringContracts(toolInput, context);
      case 'get_vacant_units':
        return await getVacantUnits(toolInput, context);
      case 'get_company_settings':
        return await getCompanySettings(toolInput, context);
      case 'update_company_settings':
        return await updateCompanySettings(toolInput, context);
      case 'calculate_mortgage':
        return await calculateMortgage(toolInput);
      case 'calculate_roi':
        return await calculateRoi(toolInput);
      case 'generate_report':
        return await generateReport(toolInput, context);
      case 'get_accounting_summary':
        return await getAccountingSummary(toolInput, context);

      // ========== AGENTES ESPECIALIZADOS ==========
      case 'evaluate_investment_proposal':
        return await delegateToAgent(
          '/api/ai/evaluate-proposal',
          { proposalText: toolInput.proposalText },
          context
        );

      case 'simulate_acquisition':
        return await delegateToAgent(
          '/api/investment/simulate-acquisition',
          {
            precioCompra: toolInput.precioCompra,
            rentaMensualEstimada: toolInput.rentaMensualEstimada,
            hipoteca: toolInput.hipotecaCapital
              ? {
                  capitalInicial: toolInput.hipotecaCapital,
                  interes: toolInput.hipotecaInteres || 3,
                  plazoAnos: 25,
                }
              : undefined,
          },
          context
        );

      case 'negotiate_deal':
        return await delegateToAgent('/api/ai/negotiation-agent', toolInput, context);

      case 'screen_tenant':
        return await delegateToAgent('/api/ai/tenant-screening', toolInput, context);

      case 'generate_rental_contract':
        return await delegateToAgent(
          '/api/ai/generate-contract',
          {
            ...toolInput,
            buildingName: toolInput.address,
            deposito: (toolInput.rentaMensual || 0) * 2,
            duracionMeses: 12,
            fechaInicio: new Date().toISOString().split('T')[0],
            tipo: toolInput.tipo || 'vivienda_habitual',
          },
          context
        );

      case 'check_delinquency_risk':
        return await delegateToAgent('/api/ai/delinquency-risk', {}, context, 'GET');

      case 'optimize_rents':
        return await delegateToAgent('/api/ai/rent-optimization', {}, context, 'GET');

      case 'find_missing_documents':
        return await delegateToAgent('/api/ai/missing-documents', {}, context, 'GET');

      case 'get_market_data': {
        const { getMarketDataByAddress } = await import('@/lib/market-data-service');
        const mkt = getMarketDataByAddress(toolInput.address);
        if (mkt) {
          return {
            success: true,
            zona: mkt.zona,
            preciosReales: {
              ventaM2: mkt.precioRealVentaM2,
              alquilerM2: mkt.precioRealAlquilerM2,
              fuente: mkt.fuenteNotarial,
              nota: 'Precios de transacciones escrituradas reales (Notariado)',
            },
            askingPrices: {
              ventaM2: mkt.askingPriceVentaM2,
              alquilerM2: mkt.askingPriceAlquilerM2,
              fuente: mkt.fuente,
              nota: 'ATENCIÓN: Estos son precios de oferta (asking), NO de cierre. Son ~12% superiores al precio real.',
            },
            garajes: { venta: mkt.precioGarajeVenta, alquiler: mkt.precioGarajeAlquiler },
            tendencia: mkt.tendencia,
            demanda: mkt.demanda,
          };
        }
        return { success: false, message: 'No se encontraron datos de mercado para esa zona.' };
      }

      case 'get_predictive_maintenance':
        return await delegateToAgent('/api/ai/predictive-maintenance', {}, context, 'GET');

      // ── NUEVAS TOOLS — Mejoras Grupo Vidaro ──
      case 'get_rent_updates_pending': {
        const { detectPendingRentUpdates } = await import('@/lib/rent-ipc-update-service');
        const companyId = context.companyId;
        const company = await prisma.company.findUnique({
          where: { id: companyId },
          include: { childCompanies: { select: { id: true } } },
        });
        const allIds = company
          ? [company.id, ...company.childCompanies.map((c: any) => c.id)]
          : [companyId];
        return await detectPendingRentUpdates(allIds);
      }

      case 'apply_rent_update': {
        const { applyRentUpdate } = await import('@/lib/rent-ipc-update-service');
        return await applyRentUpdate(input.contractId, input.newRent);
      }

      case 'get_fianzas_summary': {
        const contracts = await prisma.contract.findMany({
          where: {
            estado: 'activo',
            unit: { building: { companyId: context.companyId, isDemo: false } },
          },
          select: {
            id: true,
            importeFianza: true,
            fianzaDepositada: true,
            mesesFianza: true,
            tenant: { select: { nombreCompleto: true } },
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        });
        const total = contracts.reduce((s, c) => s + (c.importeFianza || 0), 0);
        const depositadas = contracts.filter((c) => c.fianzaDepositada);
        const pendientes = contracts.filter(
          (c) => !c.fianzaDepositada && (c.importeFianza || 0) > 0
        );
        return {
          total,
          depositadas: depositadas.length,
          pendientes: pendientes.length,
          importeDepositado: depositadas.reduce((s, c) => s + (c.importeFianza || 0), 0),
          importePendiente: pendientes.reduce((s, c) => s + (c.importeFianza || 0), 0),
          detallePendientes: pendientes.slice(0, 10).map((c) => ({
            tenant: c.tenant?.nombreCompleto,
            unit: c.unit?.numero,
            building: c.unit?.building?.nombre,
            importe: c.importeFianza,
          })),
        };
      }

      case 'get_building_360': {
        let buildingId = input.buildingId;
        if (!buildingId && input.buildingName) {
          const found = await prisma.building.findFirst({
            where: { nombre: { contains: input.buildingName, mode: 'insensitive' }, isDemo: false },
            select: { id: true },
          });
          buildingId = found?.id;
        }
        if (!buildingId) return { error: 'Edificio no encontrado' };
        const res = await fetch(
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/buildings/${buildingId}/360`,
          { headers: { cookie: '' } }
        );
        if (res.ok) return await res.json();
        return { error: 'Error obteniendo datos del edificio' };
      }

      case 'get_patrimonio_summary': {
        const view = input.view || 'holding';
        const res = await fetch(
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/family-office/dashboard?view=${view}`
        );
        if (res.ok) return await res.json();
        return { error: 'Error obteniendo patrimonio' };
      }

      case 'generate_monthly_invoices':
        return {
          message:
            'Para generar facturas mensuales, ejecuta el cron: POST /api/cron/generate-monthly-invoices',
          dryRun: input.dryRun,
        };

      case 'bank_reconciliation':
        return {
          message:
            'Para reconciliación bancaria, ejecuta el cron: POST /api/cron/bank-reconciliation',
        };

      // ─── Nuevos módulos Homming ───
      case 'search_liquidaciones': {
        const where: any = { unit: { building: { companyId: context.companyId } } };
        // Liquidaciones use mock data for now
        return {
          success: true,
          message: `Búsqueda de liquidaciones${input.propietario ? ` para ${input.propietario}` : ''}${input.estado ? ` con estado ${input.estado}` : ''}. Accede a /liquidaciones para ver el listado completo.`,
          action: 'navigate:/liquidaciones',
        };
      }

      case 'create_liquidacion': {
        const honorarios = input.honorariosPorcentaje || 8;
        const gastos = input.gastosRepercutidos || 0;
        const neto = input.rentaCobrada - (input.rentaCobrada * honorarios) / 100 - gastos;
        return {
          success: true,
          message: `Liquidación calculada:\n- Renta cobrada: €${input.rentaCobrada}\n- Honorarios (${honorarios}%): -€${((input.rentaCobrada * honorarios) / 100).toFixed(2)}\n- Gastos: -€${gastos}\n- **Neto propietario: €${neto.toFixed(2)}**\n\nAccede a /liquidaciones/nueva para crear la liquidación.`,
          data: {
            rentaCobrada: input.rentaCobrada,
            honorarios,
            gastos,
            neto: Math.round(neto * 100) / 100,
          },
        };
      }

      case 'search_facturas':
        return {
          success: true,
          message: `Búsqueda de facturas${input.serie ? ` serie ${input.serie}` : ''}${input.estado ? ` estado ${input.estado}` : ''}. Accede a /facturacion para el listado completo.`,
          action: 'navigate:/facturacion',
        };

      case 'search_candidates': {
        const candidates = await prisma.candidate.findMany({
          where: {
            unit: { building: { companyId: context.companyId } },
            ...(input.estado && { estado: input.estado }),
            ...(input.scoringMin && { scoring: { gte: input.scoringMin } }),
          },
          select: { id: true, nombreCompleto: true, scoring: true, estado: true, createdAt: true },
          take: 10,
          orderBy: { scoring: 'desc' },
        });
        return {
          success: true,
          total: candidates.length,
          candidates: candidates.map((c) => ({
            nombre: c.nombreCompleto,
            scoring: c.scoring,
            estado: c.estado,
          })),
        };
      }

      case 'classify_incident':
        return {
          success: true,
          clasificacion: {
            tipo: input.descripcion.toLowerCase().includes('agua')
              ? 'fontanería'
              : input.descripcion.toLowerCase().includes('luz')
                ? 'electricidad'
                : 'general',
            prioridad: input.descripcion.toLowerCase().includes('urgente') ? 'alta' : 'media',
            proveedorSugerido: 'Proveedor genérico',
            costeEstimado: '150-300€',
          },
          message: `Incidencia clasificada. Accede a /incidencias para gestionarla.`,
        };

      case 'get_rent_updates':
        return {
          success: true,
          message: `Consulta de actualizaciones IPC${input.estado ? ` con estado ${input.estado}` : ''}. Accede a /actualizaciones-renta para ver el detalle.`,
          action: 'navigate:/actualizaciones-renta',
        };

      case 'get_advanced_report':
        return {
          success: true,
          message: `Reporte "${input.tipo}" generado. Accede a /reportes/avanzados para ver los datos con filtros y exportación.`,
          action: 'navigate:/reportes/avanzados',
        };

      case 'dispatch_specialized_agent': {
        const agentEndpoints: Record<string, string> = {
          inversiones: '/api/ai/investment-chat',
          family_office: '/api/family-office/ai-copilot',
          negociacion: '/api/ai/negotiation-agent',
          soporte: '/api/support/chatbot',
          mantenimiento_predictivo: '/api/ai/predictive-maintenance',
          fiscal: '/api/family-office/fiscal-optimization',
        };
        const endpoint = agentEndpoints[input.agent];
        if (!endpoint) {
          return {
            error: `Agente "${input.agent}" no disponible. Agentes disponibles: ${Object.keys(agentEndpoints).join(', ')}`,
          };
        }
        return {
          success: true,
          message: `Consulta despachada al agente especializado "${input.agent}". El agente analizará: "${input.query.substring(0, 100)}..."`,
          agent: input.agent,
          endpoint,
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    logger.error(`Error executing tool ${toolName}:`, error);
    return { error: `Error executing ${toolName}: ${error}` };
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL: CHAT CON CLAUDE
// ============================================================================
export async function chatWithClaude(
  userMessage: string,
  context: AssistantContext
): Promise<AssistantResponse> {
  try {
    const systemPrompt = `Eres el Asistente INMOVA, el asistente ejecutivo IA unificado de la plataforma de gestión inmobiliaria. Funcionas como un COWORKER INTELIGENTE y COORDINADOR DE AGENTES IA: el usuario te pide acciones y tú las EJECUTAS directamente usando las herramientas disponibles.

COMPORTAMIENTO CLAVE:
- Cuando el usuario pide "crea un inquilino..." → EJECUTA create_tenant inmediatamente, no preguntes si quiere hacerlo.
- Cuando pide "muéstrame los contratos que vencen" → EJECUTA get_expiring_contracts y muestra los resultados.
- Cuando pide "registra un pago de..." → EJECUTA create_payment directamente.
- Cuando pide datos → USA las herramientas de búsqueda y muestra resultados formateados.
- NUNCA digas "no puedo hacer eso" si hay una herramienta disponible para hacerlo.
- Si necesitas un dato que falta, pregunta SOLO ese dato específico, no toda una lista.
- Confirma BREVEMENTE después de ejecutar: "✅ Inquilino Juan García creado" no un párrafo largo.
- Puedes ejecutar MÚLTIPLES herramientas en secuencia si la tarea lo requiere.

Cuando el usuario pide algo que requiere un agente especializado, DEBES usar la herramienta correspondiente:
- Analizar propuesta de inversión → evaluate_investment_proposal
- Simular compra de inmueble → simulate_acquisition
- Estrategia de negociación → negotiate_deal
- Evaluar solvencia inquilino → screen_tenant
- Generar contrato → generate_rental_contract
- Ver riesgo de morosidad → check_delinquency_risk
- Optimizar rentas → optimize_rents
- Documentos faltantes → find_missing_documents
- Precios de mercado de una zona → get_market_data
- Mantenimiento predictivo → get_predictive_maintenance

REGLA FUNDAMENTAL: Si el usuario pregunta algo que un agente especializado puede resolver, SIEMPRE delega al agente. No intentes responder tú directamente con datos inventados.

Tus capacidades directas (sin agente):

CONSULTAS:
- Buscar y consultar edificios, unidades, inquilinos, contratos y pagos
- Obtener detalles de edificios e inquilinos
- Buscar contratos por estado, inquilino o edificio
- Consultar estado de pagos
- Buscar solicitudes de mantenimiento y tareas
- Obtener estadísticas del dashboard y resumen financiero

CRUD - EDIFICIOS Y UNIDADES:
- Crear, actualizar edificios (nombre, dirección, ciudad, tipo)
- Crear, actualizar unidades (numero, tipo, superficie, habitaciones, renta, estado)

CRUD - INQUILINOS:
- Crear, actualizar inquilinos (nombre, DNI, email, teléfono, IBAN, ciudad)

CRUD - CONTRATOS:
- Crear contratos vinculando inquilino con unidad (fechas, renta, depósito)
- Actualizar contratos (renta, fechas, estado)
- Finalizar contratos (marcar como vencido, liberar unidad)

CRUD - PAGOS Y GASTOS:
- Registrar pagos para contratos (monto, periodo, método)
- Buscar pagos por estado, periodo, inquilino
- Obtener pagos pendientes/atrasados
- Registrar gastos (concepto, monto, categoría, edificio)
- Buscar gastos por categoría o edificio

DOCUMENTOS:
- Buscar documentos por tipo, entidad (unidad, inquilino, edificio) o nombre

ALERTAS Y DISPONIBILIDAD:
- Obtener contratos que vencen en los próximos N días
- Obtener unidades disponibles/vacantes

CONFIGURACIÓN:
- Obtener y actualizar configuración de empresa (días de alerta de contratos, módulos, plan)

CÁLCULOS (sin BD):
- Calcular cuota hipotecaria mensual (importe, plazo, tipo interés)
- Calcular ROI de inversión inmobiliaria (precio compra, renta, gastos)

REPORTES:
- Generar reportes: financiero, ocupación, morosidad, contratos, completo
- Resumen contable: ingresos vs gastos por periodo

PREMIUM:
- ANALIZAR DOCUMENTOS: Extraer datos de PDF, Excel, imágenes
- VALORAR ACTIVOS: Estimar valor venta/alquiler por dirección o ref. catastral
- CONSULTAR CATASTRO: Datos catastrales (superficie, uso, año)

NUEVAS FUNCIONALIDADES DISPONIBLES EN LA PLATAFORMA (informar al usuario si pregunta):

📊 INTELIGENCIA ARTIFICIAL:
- Valoración automática de inmuebles con IA (/valoracion-ia) — estima valor de venta/alquiler
- Predicción de morosidad — anticipa qué inquilinos tienen riesgo de impago
- Renta óptima — sugiere el precio ideal basado en mercado y comparables
- Detección de anomalías financieras — identifica pagos duplicados o gastos inusuales
- Alertas de oportunidad — detecta propiedades con renta por debajo de mercado
- Clasificación automática de documentos con IA

💼 FAMILY OFFICE & HOLDING:
- Dashboard Patrimonial 360° (/family-office/dashboard) — visión consolidada del grupo
- Vista Ejecutiva (/dashboard/ejecutivo) — KPIs consolidados patrimonio+operativo+alertas
- P&L por sociedad (/inversiones/pyl-sociedades) — comparativa entre empresas del grupo
- Distribuciones PE (/inversiones/distribuciones) — tracker de fondos de Private Equity
- Informe trimestral PDF — generación automática para socios
- Informe patrimonial PDF descargable
- Portal del propietario read-only (/portal-propietario/dashboard)

⚡ AUTOMATIZACIÓN:
- Bandeja "Mi Día" (/hoy) — todo lo que necesitas hacer hoy en un solo lugar
- Cobro en 1 click — marcar pago como cobrado con envío automático de recibo
- Cobro masivo — cobrar todos los pagos pendientes de una vez
- Facturación automática (/facturas) — genera facturas con nº secuencial al cobrar
- Generación automática de pagos mensuales (cron)
- Escalado automático de impagos en 4 niveles (amable→firme→formal→legal)
- Resumen semanal por email al administrador
- Renovación de contratos con IPC (/contratos/actualizacion-ipc)
- Remesas SEPA para cobros bancarios (/api/payments/sepa-export)

📋 WORKFLOWS:
- Alta rápida de inquilino (/inquilinos/alta-rapida) — wizard de 4 pasos
- Workflow de salida (/contratos/[id]/finalizar) — liquidación + fianza + cierre
- Plantillas de contratos (/contratos/plantillas) — modelos predefinidos reutilizables
- Dashboard de vencimientos (/vencimientos) — calendario global de deadlines

📈 ANÁLISIS E INFORMES:
- Centro de Alertas (/alertas) — filtros por tipo y severidad
- Informe de Morosidad (/morosidad) — detalle por inquilino con días de retraso
- Yield Tracker (/inversiones/yield) — rentabilidad por propiedad
- Benchmark de Mercado (/inversiones/benchmark) — comparativa renta vs mercado
- Comparativa de Edificios (/inversiones/comparativa-edificios)
- Previsión de tesorería 12 meses (/finanzas/prevision)
- Estimación fiscal trimestral (/finanzas/fiscal-trimestral) — IVA, IRPF por modelo
- Scoring de inquilinos (/api/tenants/scoring) — Health Score 0-100
- Export CSV en cualquier tabla

🔧 OPERACIONES:
- Kanban de mantenimiento (/mantenimiento/kanban) — vista visual por columnas
- Checklist de inspección digital (/inspecciones/checklist) — entrada/salida inquilino
- Evaluación de proveedores (/proveedores/evaluacion) — rating y historial
- Gestión de fianzas (/fianzas) — depósitos y devoluciones
- Conciliación bancaria con auto-matching (/finanzas/conciliacion)
- Auditoría de cambios (/admin/auditoria) — quién cambió qué y cuándo

🎨 EXPERIENCIA:
- Modo oscuro (toggle en header)
- Selector de sociedad para admins con múltiples empresas
- Avatares coloridos por inquilino
- Indicador de conexión online/offline
- Semáforo de salud de la cartera

Cuando el usuario suba un documento, analízalo automáticamente y sugiere acciones.
Responde siempre en español. Sé conciso y útil.
Si el usuario pregunta por una funcionalidad, indícale la ruta exacta donde encontrarla.

Contexto del usuario:
- Nombre: ${context.userName}
- Tipo: ${context.userType}
- Email: ${context.userEmail}
- Empresa: ${context.companyId}

Normas:
1. Siempre ser amable, profesional y eficiente
2. Usar las herramientas disponibles para obtener datos precisos
3. Confirmar acciones críticas antes de ejecutarlas
4. Proporcionar respuestas claras y estructuradas
5. Si no tienes información suficiente, preguntar al usuario
6. Responder SIEMPRE en español

Cuando uses herramientas:
- Usa múltiples herramientas si es necesario para dar respuestas completas
- Presenta la información de forma clara y organizada
- Incluye IDs relevantes cuando sea útil para el usuario`;

    // Preparar mensajes
    const messages: Anthropic.Messages.MessageParam[] = [
      ...(context.conversationHistory?.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })) || []),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    logger.info(`🤖 Claude request - User: ${context.userName}`);

    // Primera llamada a Claude
    let response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      tools: tools,
      messages: messages,
    });

    logger.info(`💬 Claude response - Stop reason: ${response.stop_reason}`);

    // Iterar si Claude quiere usar herramientas
    const toolsUsed: string[] = [];
    let iterations = 0;
    const MAX_ITERATIONS = 5; // Prevenir loops infinitos

    while (response.stop_reason === 'tool_use' && iterations < MAX_ITERATIONS) {
      iterations++;

      // Procesar todas las tool calls
      const toolResults: Anthropic.Messages.MessageParam[] = [];

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          toolsUsed.push(block.name);
          const toolResult = await executeTool(block.name, block.input, context);

          toolResults.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(toolResult),
              },
            ],
          });
        }
      }

      // Continuar la conversación con los resultados de las herramientas
      messages.push(
        {
          role: 'assistant',
          content: response.content,
        },
        ...toolResults
      );

      // Llamar a Claude de nuevo
      response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        tools: tools,
        messages: messages,
      });

      logger.info(`🔄 Claude iteration ${iterations} - Stop reason: ${response.stop_reason}`);
    }

    // Extraer la respuesta final de texto
    let finalText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        finalText += block.text;
      }
    }

    const result: AssistantResponse = {
      type: toolsUsed.length > 0 ? 'action_executed' : 'text',
      content: finalText,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    };

    logger.info(`✅ Claude completed - Tools used: ${toolsUsed.join(', ') || 'none'}`);

    return result;
  } catch (error: any) {
    const errMsg = error?.message || error?.toString() || 'Unknown error';
    const errStack = error?.stack?.substring(0, 500) || '';
    const errStatus = error?.status || '';
    logger.error(`Error in chatWithClaude: ${errMsg}`, { status: errStatus, stack: errStack });
    return {
      type: 'text',
      content: `Error: ${errMsg.substring(0, 200)}. Por favor, inténtalo de nuevo.`,
    };
  }
}

// ============================================================================
// HELPER: Obtener todos los IDs del grupo (holding + filiales)
// ============================================================================
async function getGroupCompanyIds(companyId: string): Promise<string[]> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { childCompanies: { select: { id: true } } },
    });
    if (company?.childCompanies?.length) {
      return [company.id, ...company.childCompanies.map((c: any) => c.id)];
    }
    return [companyId];
  } catch {
    return [companyId];
  }
}

// ============================================================================
// IMPLEMENTACIONES DE TOOLS
// ============================================================================

async function searchBuildings(input: any, context: AssistantContext) {
  const { query, limit = 10 } = input;
  const groupIds = await getGroupCompanyIds(context.companyId);

  const buildings = await prisma.building.findMany({
    where: {
      companyId: { in: groupIds },
      isDemo: false,
      OR: [
        { nombre: { contains: query, mode: 'insensitive' } },
        { direccion: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
    select: {
      id: true,
      nombre: true,
      direccion: true,
      tipo: true,
      numeroUnidades: true,
      _count: {
        select: {
          units: true,
        },
      },
    },
  });

  return {
    success: true,
    count: buildings.length,
    buildings,
  };
}

async function searchTenants(input: any, context: AssistantContext) {
  const { query, buildingId, limit = 10 } = input;

  const where: any = {
    companyId: context.companyId,
    OR: [
      { nombreCompleto: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { telefono: { contains: query, mode: 'insensitive' } },
    ],
  };

  if (buildingId) {
    where.contracts = {
      some: {
        unit: {
          buildingId: buildingId,
        },
      },
    };
  }

  const tenants = await prisma.tenant.findMany({
    where,
    take: limit,
    select: {
      id: true,
      nombreCompleto: true,
      email: true,
      telefono: true,
      contracts: {
        where: {
          estado: 'activo',
        },
        select: {
          id: true,
          unit: {
            select: {
              numero: true,
              building: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
        take: 1,
      },
    },
  });

  return {
    success: true,
    count: tenants.length,
    tenants,
  };
}

async function getBuildingDetails(input: any, context: AssistantContext) {
  const { buildingId } = input;

  const building = await prisma.building.findFirst({
    where: {
      id: buildingId,
      companyId: context.companyId,
    },
    include: {
      units: {
        select: {
          id: true,
          numero: true,
          tipo: true,
          estado: true,
          superficie: true,
          contracts: {
            where: {
              estado: 'activo',
            },
            select: {
              id: true,
              tenant: {
                select: {
                  nombreCompleto: true,
                  email: true,
                },
              },
            },
            take: 1,
          },
        },
      },
      _count: {
        select: {
          units: true,
        },
      },
    },
  });

  if (!building) {
    return { success: false, error: 'Edificio no encontrado' };
  }

  return {
    success: true,
    building,
  };
}

async function getTenantDetails(input: any, context: AssistantContext) {
  const { tenantId } = input;

  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      companyId: context.companyId,
    },
    include: {
      contracts: {
        select: {
          id: true,
          fechaInicio: true,
          fechaFin: true,
          rentaMensual: true,
          estado: true,
          unit: {
            select: {
              numero: true,
              building: {
                select: {
                  nombre: true,
                  direccion: true,
                },
              },
            },
          },
          payments: {
            take: 10,
            orderBy: {
              fechaPago: 'desc',
            },
            select: {
              id: true,
              monto: true,
              fechaPago: true,
              estado: true,
              metodoPago: true,
            },
          },
        },
      },
    },
  });

  if (!tenant) {
    return { success: false, error: 'Inquilino no encontrado' };
  }

  return {
    success: true,
    tenant,
  };
}

async function searchContracts(input: any, context: AssistantContext) {
  const { status, tenantId, buildingId, limit = 10 } = input;
  const groupIds = await getGroupCompanyIds(context.companyId);

  const where: any = {
    companyId: { in: groupIds },
  };

  if (status) {
    where.estado = status;
  }

  if (tenantId) {
    where.tenantId = tenantId;
  }

  if (buildingId) {
    where.unit = {
      buildingId: buildingId,
    };
  }

  const contracts = await prisma.contract.findMany({
    where,
    take: limit,
    select: {
      id: true,
      fechaInicio: true,
      fechaFin: true,
      rentaMensual: true,
      estado: true,
      tenant: {
        select: {
          nombreCompleto: true,
          email: true,
        },
      },
      unit: {
        select: {
          numero: true,
          building: {
            select: {
              nombre: true,
            },
          },
        },
      },
    },
    orderBy: {
      fechaInicio: 'desc',
    },
  });

  return {
    success: true,
    count: contracts.length,
    contracts,
  };
}

async function getPaymentStatus(input: any, context: AssistantContext) {
  const { contractId, tenantId, includeHistory = true } = input;

  const where: any = {
    contract: {
      companyId: context.companyId,
    },
  };

  if (contractId) {
    where.contractId = contractId;
  }

  if (tenantId) {
    where.contract = {
      ...where.contract,
      tenantId: tenantId,
    };
  }

  const payments = await prisma.payment.findMany({
    where,
    take: includeHistory ? 50 : 10,
    orderBy: {
      fechaPago: 'desc',
    },
    select: {
      id: true,
      monto: true,
      fechaPago: true,
      fechaVencimiento: true,
      estado: true,
      periodo: true,
      metodoPago: true,
    },
  });

  // Calcular resumen
  const pending = payments.filter((p) => p.estado === 'pendiente');
  const totalPending = pending.reduce((sum, p) => sum + (p.monto || 0), 0);

  return {
    success: true,
    summary: {
      totalPayments: payments.length,
      pendingCount: pending.length,
      totalPending: totalPending,
    },
    payments: includeHistory ? payments : payments.slice(0, 5),
  };
}

async function createMaintenanceRequest(input: any, context: AssistantContext) {
  const { title, description, unitId, buildingId, priority = 'media', category = 'otro' } = input;

  const request = await prisma.maintenanceRequest.create({
    data: {
      titulo: title,
      descripcion: description,
      unitId: unitId,
      prioridad: priority,
      estado: 'pendiente',
    },
  });

  return {
    success: true,
    message: `Solicitud de mantenimiento creada exitosamente con ID: ${request.id}`,
    requestId: request.id,
    request,
  };
}

async function searchMaintenanceRequests(input: any, context: AssistantContext) {
  const { status, buildingId, priority, limit = 10 } = input;

  const where: any = {
    unit: {
      building: {
        companyId: context.companyId,
      },
    },
  };

  if (status) {
    where.estado = status;
  }

  if (buildingId) {
    where.unit = {
      ...where.unit,
      buildingId: buildingId,
    };
  }

  if (priority) {
    where.prioridad = priority;
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    take: limit,
    orderBy: {
      fechaSolicitud: 'desc',
    },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      estado: true,
      prioridad: true,
      fechaSolicitud: true,
      unit: {
        select: {
          numero: true,
          building: {
            select: {
              nombre: true,
            },
          },
        },
      },
    },
  });

  return {
    success: true,
    count: requests.length,
    requests,
  };
}

async function createTask(input: any, context: AssistantContext) {
  const { title, description, assignedTo, priority = 'media', dueDate } = input;

  const task = await prisma.task.create({
    data: {
      companyId: context.companyId,
      titulo: title,
      descripcion: description || '',
      estado: 'pendiente',
      prioridad: priority,
      asignadoA: assignedTo,
      creadoPor: context.userId,
      fechaLimite: dueDate ? new Date(dueDate) : undefined,
    },
  });

  return {
    success: true,
    message: `Tarea creada exitosamente con ID: ${task.id}`,
    taskId: task.id,
    task,
  };
}

async function searchTasks(input: any, context: AssistantContext) {
  const { status, assignedTo, priority, limit = 10 } = input;

  const where: any = {
    companyId: context.companyId,
  };

  if (status) {
    where.estado = status;
  }

  if (assignedTo) {
    where.asignadoA = assignedTo;
  }

  if (priority) {
    where.prioridad = priority;
  }

  const tasks = await prisma.task.findMany({
    where,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      estado: true,
      prioridad: true,
      fechaLimite: true,
      createdAt: true,
    },
  });

  return {
    success: true,
    count: tasks.length,
    tasks,
  };
}

async function getDashboardStats(input: any, context: AssistantContext) {
  const { includeFinancial = true, includeMaintenance = true } = input;
  const groupIds = await getGroupCompanyIds(context.companyId);

  const [buildingsCount, unitsCount, tenantsCount, contractsCount] = await Promise.all([
    prisma.building.count({ where: { companyId: { in: groupIds }, isDemo: false } }),
    prisma.unit.count({
      where: {
        building: {
          companyId: { in: groupIds },
          isDemo: false,
        },
      },
    }),
    prisma.tenant.count({ where: { companyId: { in: groupIds } } }),
    prisma.contract.count({
      where: {
        unit: {
          building: {
            companyId: context.companyId,
          },
        },
        estado: 'activo',
      },
    }),
  ]);

  const stats: any = {
    buildings: buildingsCount,
    units: unitsCount,
    tenants: tenantsCount,
    activeContracts: contractsCount,
  };

  if (includeFinancial) {
    const payments = await prisma.payment.groupBy({
      by: ['estado'],
      where: {
        contract: {
          unit: {
            building: {
              companyId: context.companyId,
            },
          },
        },
      },
      _sum: { monto: true },
      _count: true,
    });

    stats.payments = payments.reduce((acc: any, p) => {
      acc[p.estado] = {
        count: p._count,
        total: p._sum.monto || 0,
      };
      return acc;
    }, {});
  }

  if (includeMaintenance) {
    const maintenance = await prisma.maintenanceRequest.groupBy({
      by: ['estado'],
      where: {
        unit: {
          building: {
            companyId: context.companyId,
          },
        },
      },
      _count: true,
    });

    stats.maintenance = maintenance.reduce((acc: any, m) => {
      acc[m.estado] = m._count;
      return acc;
    }, {});
  }

  return {
    success: true,
    stats,
  };
}

async function searchUnits(input: any, context: AssistantContext) {
  const { buildingId, status, limit = 10 } = input;

  const where: any = {
    building: { companyId: context.companyId },
  };

  if (buildingId) {
    where.buildingId = buildingId;
  }

  if (status) {
    where.estado = status;
  }

  const units = await prisma.unit.findMany({
    where,
    take: limit,
    select: {
      id: true,
      numero: true,
      tipo: true,
      estado: true,
      superficie: true,
      rentaMensual: true,
      building: {
        select: {
          nombre: true,
          direccion: true,
        },
      },
      contracts: {
        where: {
          estado: 'activo',
        },
        select: {
          id: true,
          tenant: {
            select: {
              nombreCompleto: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  return {
    success: true,
    count: units.length,
    units,
  };
}

// ============================================================================
// HERRAMIENTAS DE ACCIÓN (Premium)
// ============================================================================

async function analyzeDocument(input: any, context: AssistantContext) {
  const { documentText, documentType, action = 'extract_data' } = input;

  // Use Claude to analyze the document content
  const analysisPrompt = `Analiza este documento de tipo "${documentType}" y extrae todos los datos estructurados relevantes para gestión inmobiliaria.

DOCUMENTO:
${documentText.substring(0, 8000)}

Extrae en formato JSON:
- Si es contrato: inquilino, dirección, renta, fechas inicio/fin, fianza, condiciones
- Si es factura: proveedor, importe, base, IVA, concepto, fecha
- Si es DNI: nombre, número, fecha nacimiento, nacionalidad
- Si es contabilidad: asientos con fecha, concepto, debe, haber, subcuenta
- Si es catastro: referencia, dirección, superficie, uso, año

Responde SOLO con JSON válido.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      success: true,
      documentType,
      action,
      extractedData: text,
      message: `Documento analizado. Tipo: ${documentType}. Datos extraídos del documento.`,
    };
  } catch (error) {
    return { success: false, error: 'Error analizando documento' };
  }
}

async function valuateProperty(input: any, context: AssistantContext) {
  const { direccion, ciudad, superficie, tipo, habitaciones, refCatastral } = input;

  // Get catastro data if reference provided
  let catastroInfo = '';
  if (refCatastral) {
    try {
      const res = await fetch(
        `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${refCatastral}`
      );
      if (res.ok) {
        const text = await res.text();
        const sfc = text.match(/<sfc>(\d+)<\/sfc>/)?.[1];
        const luso = text.match(/<luso>([^<]+)<\/luso>/)?.[1];
        const ant = text.match(/<ant>(\d+)<\/ant>/)?.[1];
        catastroInfo = `Datos catastro: ${sfc}m², uso: ${luso}, año: ${ant}`;
      }
    } catch {}
  }

  const valuationPrompt = `Eres un tasador inmobiliario experto en España. Valora este activo:

Dirección: ${direccion}
Ciudad: ${ciudad || 'Madrid'}
Tipo: ${tipo}
Superficie: ${superficie || 'desconocida'}m²
Habitaciones: ${habitaciones || 'N/A'}
${catastroInfo}

Proporciona estimación en JSON:
{
  "valorVenta": número en euros,
  "valorAlquiler": número euros/mes,
  "precioM2Venta": número,
  "precioM2Alquiler": número,
  "roi": porcentaje anual,
  "confianza": 0-100,
  "razonamiento": "explicación breve",
  "comparables": "zona y precios similares",
  "tendencia": "alcista/estable/bajista"
}`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: valuationPrompt }],
    });

    return {
      success: true,
      valuation: response.content[0].type === 'text' ? response.content[0].text : '',
      direccion,
      tipo,
    };
  } catch {
    return { success: false, error: 'Error valorando propiedad' };
  }
}

async function searchCatastroTool(input: any) {
  const { refCatastral, provincia, municipio, via, numero } = input;

  try {
    let url = '';
    if (refCatastral) {
      url = `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${refCatastral}`;
    } else if (provincia && municipio && via && numero) {
      url = `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaNumero?Provincia=${encodeURIComponent(provincia)}&Municipio=${encodeURIComponent(municipio)}&TipoVia=CL&NomVia=${encodeURIComponent(via)}&Numero=${encodeURIComponent(numero)}`;
    } else {
      return { success: false, error: 'Proporciona referencia catastral o dirección completa' };
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const text = await res.text();

    const direccion = text.match(/<ldt>([^<]+)<\/ldt>/)?.[1] || '';
    const superficie = text.match(/<sfc>(\d+)<\/sfc>/)?.[1] || '';
    const uso = text.match(/<luso>([^<]+)<\/luso>/)?.[1] || '';
    const ano = text.match(/<ant>(\d+)<\/ant>/)?.[1] || '';
    const cp = text.match(/<dp>(\d+)<\/dp>/)?.[1] || '';

    return {
      success: true,
      datos: {
        direccion,
        superficie: superficie + 'm²',
        uso,
        anoConstruccion: ano,
        codigoPostal: cp,
      },
    };
  } catch {
    return { success: false, error: 'Error consultando catastro' };
  }
}

async function getFinancialSummary(input: any, context: AssistantContext) {
  const contracts = await prisma.contract.findMany({
    where: { estado: 'activo', unit: { building: { companyId: context.companyId } } },
    select: { rentaMensual: true, fechaFin: true },
  });

  const payments = await prisma.payment.findMany({
    where: {
      contract: { unit: { building: { companyId: context.companyId } } },
      periodo: { startsWith: new Date().getFullYear().toString() },
    },
    select: { monto: true, estado: true },
  });

  const units = await prisma.unit.findMany({
    where: { building: { companyId: context.companyId } },
    select: { estado: true },
  });

  const ingresosMensuales = contracts.reduce((s, c) => s + (Number(c.rentaMensual) || 0), 0);
  const totalUnits = units.length;
  const ocupadas = units.filter((u) => u.estado === 'ocupada').length;
  const pagados = payments.filter((p) => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0);
  const pendientes = payments
    .filter((p) => p.estado === 'pendiente')
    .reduce((s, p) => s + p.monto, 0);

  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const proxVencer = contracts.filter(
    (c) => new Date(c.fechaFin) <= in60Days && new Date(c.fechaFin) >= now
  ).length;

  return {
    success: true,
    resumen: {
      ingresosMensuales: Math.round(ingresosMensuales),
      ingresosAnuales: Math.round(ingresosMensuales * 12),
      totalUnidades: totalUnits,
      ocupadas,
      disponibles: totalUnits - ocupadas,
      tasaOcupacion: totalUnits > 0 ? Math.round((ocupadas / totalUnits) * 100) : 0,
      pagadoEsteAño: Math.round(pagados),
      pendienteCobro: Math.round(pendientes),
      contratosProximosVencer: proxVencer,
      contratosActivos: contracts.length,
    },
  };
}

// ============================================================================
// CRUD HANDLERS (Platform Operator)
// ============================================================================

function mapBuildingType(tipo?: string): 'residencial' | 'mixto' | 'comercial' {
  if (!tipo) return 'residencial';
  if (tipo === 'industrial') return 'comercial';
  if (tipo === 'mixto' || tipo === 'comercial') return tipo;
  return 'residencial';
}

async function createBuilding(input: any, context: AssistantContext) {
  const { nombre, direccion, ciudad, codigoPostal, tipo } = input;
  const fullDireccion = ciudad ? `${direccion}, ${ciudad}` : direccion;
  const building = await prisma.building.create({
    data: {
      companyId: context.companyId,
      nombre,
      direccion: fullDireccion,
      tipo: mapBuildingType(tipo),
      anoConstructor: new Date().getFullYear(),
      numeroUnidades: 1,
    },
  });
  return { success: true, building, message: `Edificio "${nombre}" creado` };
}

async function updateBuilding(input: any, context: AssistantContext) {
  const { buildingId, nombre, direccion, ciudad } = input;
  const existing = await prisma.building.findFirst({
    where: { id: buildingId, companyId: context.companyId },
  });
  if (!existing) return { success: false, error: 'Edificio no encontrado' };
  const data: any = {};
  if (nombre) data.nombre = nombre;
  if (direccion) data.direccion = ciudad ? `${direccion}, ${ciudad}` : direccion;
  const building = await prisma.building.update({
    where: { id: buildingId },
    data,
  });
  return { success: true, building, message: 'Edificio actualizado' };
}

async function createUnit(input: any, context: AssistantContext) {
  const { buildingId, numero, tipo, superficie, habitaciones, banos, rentaMensual } = input;
  const building = await prisma.building.findFirst({
    where: { id: buildingId, companyId: context.companyId },
  });
  if (!building) return { success: false, error: 'Edificio no encontrado' };
  const unit = await prisma.unit.create({
    data: {
      buildingId,
      numero,
      tipo: tipo || 'vivienda',
      superficie,
      habitaciones: habitaciones ?? null,
      banos: banos ?? null,
      rentaMensual: rentaMensual ?? 0,
      estado: 'disponible',
    },
  });
  return { success: true, unit, message: `Unidad "${numero}" creada` };
}

async function updateUnit(input: any, context: AssistantContext) {
  const { unitId, superficie, rentaMensual, estado, habitaciones, banos } = input;
  const existing = await prisma.unit.findFirst({
    where: { id: unitId, building: { companyId: context.companyId } },
  });
  if (!existing) return { success: false, error: 'Unidad no encontrada' };
  const data: any = {};
  if (superficie != null) data.superficie = superficie;
  if (rentaMensual != null) data.rentaMensual = rentaMensual;
  if (estado) data.estado = estado === 'mantenimiento' ? 'en_mantenimiento' : estado;
  if (habitaciones != null) data.habitaciones = habitaciones;
  if (banos != null) data.banos = banos;
  const unit = await prisma.unit.update({
    where: { id: unitId },
    data,
  });
  return { success: true, unit, message: 'Unidad actualizada' };
}

async function createTenant(input: any, context: AssistantContext) {
  const { nombreCompleto, dni, email, telefono, iban, ciudad, metodoPago } = input;
  const tenant = await prisma.tenant.create({
    data: {
      companyId: context.companyId,
      nombreCompleto,
      dni,
      email,
      telefono,
      fechaNacimiento: new Date('1990-01-01'),
      iban: iban ?? null,
      ciudad: ciudad ?? null,
      metodoPago: metodoPago ?? null,
    },
  });
  return { success: true, tenant, message: `Inquilino "${nombreCompleto}" creado` };
}

async function updateTenant(input: any, context: AssistantContext) {
  const { tenantId, email, telefono, iban, direccionActual, ciudad } = input;
  const existing = await prisma.tenant.findFirst({
    where: { id: tenantId, companyId: context.companyId },
  });
  if (!existing) return { success: false, error: 'Inquilino no encontrado' };
  const data: any = {};
  if (email) data.email = email;
  if (telefono) data.telefono = telefono;
  if (iban != null) data.iban = iban;
  if (direccionActual != null) data.direccionActual = direccionActual;
  if (ciudad != null) data.ciudad = ciudad;
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data,
  });
  return { success: true, tenant, message: 'Inquilino actualizado' };
}

async function createContract(input: any, context: AssistantContext) {
  const { tenantId, unitId, fechaInicio, fechaFin, rentaMensual, deposito, tipo } = input;
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, building: { companyId: context.companyId } },
  });
  if (!unit) return { success: false, error: 'Unidad no encontrada' };
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, companyId: context.companyId },
  });
  if (!tenant) return { success: false, error: 'Inquilino no encontrado' };
  const startDate = new Date(fechaInicio);
  const endDate = fechaFin
    ? new Date(fechaFin)
    : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
  const dep = deposito ?? rentaMensual * 2;
  const contract = await prisma.contract.create({
    data: {
      unitId,
      tenantId,
      fechaInicio: startDate,
      fechaFin: endDate,
      rentaMensual,
      deposito: dep,
      estado: 'activo',
      tipo: (tipo as 'residencial' | 'comercial' | 'temporal') || 'residencial',
    },
  });
  await prisma.unit.update({
    where: { id: unitId },
    data: { estado: 'ocupada' },
  });
  return { success: true, contract, message: 'Contrato creado' };
}

async function updateContract(input: any, context: AssistantContext) {
  const { contractId, rentaMensual, fechaFin, estado } = input;
  const existing = await prisma.contract.findFirst({
    where: {
      id: contractId,
      unit: { building: { companyId: context.companyId } },
    },
  });
  if (!existing) return { success: false, error: 'Contrato no encontrado' };
  const data: any = {};
  if (rentaMensual != null) data.rentaMensual = rentaMensual;
  if (fechaFin) data.fechaFin = new Date(fechaFin);
  if (estado) data.estado = estado;
  const contract = await prisma.contract.update({
    where: { id: contractId },
    data,
  });
  return { success: true, contract, message: 'Contrato actualizado' };
}

async function terminateContract(input: any, context: AssistantContext) {
  const { contractId } = input;
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      unit: { building: { companyId: context.companyId } },
    },
    select: { unitId: true },
  });
  if (!contract) return { success: false, error: 'Contrato no encontrado' };
  await prisma.contract.update({
    where: { id: contractId },
    data: { estado: 'vencido' },
  });
  await prisma.unit.update({
    where: { id: contract.unitId },
    data: { estado: 'disponible' },
  });
  return { success: true, message: 'Contrato finalizado' };
}

async function createPayment(input: any, context: AssistantContext) {
  const { contractId, monto, periodo, metodoPago, concepto, referencia } = input;
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      unit: { building: { companyId: context.companyId } },
    },
  });
  if (!contract) return { success: false, error: 'Contrato no encontrado' };
  const [year, month] = periodo.split('-').map(Number);
  const fechaVencimiento = new Date(year, month, 0);
  const payment = await prisma.payment.create({
    data: {
      contractId,
      monto,
      periodo,
      fechaVencimiento,
      estado: 'pendiente',
      metodoPago: metodoPago ?? null,
      concepto: concepto ?? null,
      referencia: referencia ?? null,
    },
  });
  return { success: true, payment, message: 'Pago registrado' };
}

async function searchPayments(input: any, context: AssistantContext) {
  const where: any = {
    contract: {
      unit: { building: { companyId: context.companyId } },
    },
  };
  if (input.estado) where.estado = input.estado;
  if (input.periodo) where.periodo = { contains: input.periodo };
  if (input.tenantId) where.contract.tenantId = input.tenantId;
  const payments = await prisma.payment.findMany({
    where,
    take: input.limit || 20,
    orderBy: { fechaVencimiento: 'desc' },
    include: {
      contract: {
        include: {
          tenant: { select: { nombreCompleto: true } },
          unit: { select: { numero: true, building: { select: { nombre: true } } } },
        },
      },
    },
  });
  return { success: true, count: payments.length, payments };
}

async function getPendingPayments(_input: any, context: AssistantContext) {
  const payments = await prisma.payment.findMany({
    where: {
      estado: { in: ['pendiente', 'atrasado'] },
      contract: {
        unit: { building: { companyId: context.companyId } },
      },
    },
    take: 100,
    orderBy: { fechaVencimiento: 'asc' },
    include: {
      contract: {
        include: {
          tenant: { select: { nombreCompleto: true, email: true } },
          unit: { select: { numero: true, building: { select: { nombre: true } } } },
        },
      },
    },
  });
  const total = payments.reduce((s, p) => s + p.monto, 0);
  return {
    success: true,
    count: payments.length,
    totalPendiente: Math.round(total * 100) / 100,
    payments,
  };
}

async function createExpense(input: any, context: AssistantContext) {
  const { concepto, monto, categoria, buildingId, fecha } = input;
  if (buildingId) {
    const building = await prisma.building.findFirst({
      where: { id: buildingId, companyId: context.companyId },
    });
    if (!building) return { success: false, error: 'Edificio no encontrado' };
  }
  const expense = await prisma.expense.create({
    data: {
      concepto,
      monto,
      categoria: categoria || 'otro',
      fecha: fecha ? new Date(fecha) : new Date(),
      buildingId: buildingId ?? null,
    },
  });
  return { success: true, expense, message: 'Gasto registrado' };
}

async function searchExpenses(input: any, context: AssistantContext) {
  const where: any = {};
  if (input.buildingId) {
    const building = await prisma.building.findFirst({
      where: { id: input.buildingId, companyId: context.companyId },
    });
    if (!building) return { success: false, error: 'Edificio no encontrado', expenses: [] };
    where.buildingId = input.buildingId;
  } else {
    where.OR = [
      { building: { companyId: context.companyId } },
      { unit: { building: { companyId: context.companyId } } },
    ];
  }
  if (input.categoria) where.categoria = input.categoria;
  const expenses = await prisma.expense.findMany({
    where,
    take: input.limit || 20,
    orderBy: { fecha: 'desc' },
    include: { building: { select: { nombre: true } } },
  });
  return { success: true, count: expenses.length, expenses };
}

async function searchDocuments(input: any, context: AssistantContext) {
  const where: any = {
    OR: [
      { building: { companyId: context.companyId } },
      { tenant: { companyId: context.companyId } },
      { unit: { building: { companyId: context.companyId } } },
      { contract: { unit: { building: { companyId: context.companyId } } } },
    ],
  };
  if (input.tipo) where.tipo = input.tipo;
  if (input.unitId) where.unitId = input.unitId;
  if (input.tenantId) where.tenantId = input.tenantId;
  if (input.buildingId) where.buildingId = input.buildingId;
  if (input.nombre) where.nombre = { contains: input.nombre, mode: 'insensitive' };
  const documents = await prisma.document.findMany({
    where,
    take: input.limit || 20,
    orderBy: { fechaSubida: 'desc' },
    select: {
      id: true,
      nombre: true,
      tipo: true,
      fechaSubida: true,
      fechaVencimiento: true,
      tenantId: true,
      unitId: true,
      buildingId: true,
      contractId: true,
    },
  });
  return { success: true, count: documents.length, documents };
}

async function getExpiringContracts(input: any, context: AssistantContext) {
  const dias = input.dias ?? 300; // Default 300 days to cover end of year
  const now = new Date();
  const limitDate = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);
  const groupIds = await getGroupCompanyIds(context.companyId);
  const contracts = await prisma.contract.findMany({
    where: {
      estado: 'activo',
      fechaFin: { gte: now, lte: limitDate },
      unit: { building: { companyId: { in: groupIds }, isDemo: false } },
    },
    include: {
      tenant: { select: { nombreCompleto: true, email: true } },
      unit: { select: { numero: true, building: { select: { nombre: true, direccion: true } } } },
    },
    orderBy: { fechaFin: 'asc' },
    take: 50,
  });
  return { success: true, count: contracts.length, contracts };
}

async function getVacantUnits(input: any, context: AssistantContext) {
  const groupIds = await getGroupCompanyIds(context.companyId);
  const where: any = {
    building: { companyId: { in: groupIds }, isDemo: false },
    estado: 'disponible',
    contracts: {
      none: { estado: 'activo' },
    },
  };
  if (input.tipo) where.tipo = input.tipo;
  if (input.buildingId) where.buildingId = input.buildingId;
  const units = await prisma.unit.findMany({
    where,
    include: {
      building: { select: { nombre: true, direccion: true } },
    },
  });
  return { success: true, count: units.length, units };
}

async function getCompanySettings(_input: any, context: AssistantContext) {
  const company = await prisma.company.findUnique({
    where: { id: context.companyId },
    select: {
      nombre: true,
      contractExpirationAlertDays: true,
      category: true,
      maxEdificios: true,
      maxPropiedades: true,
      maxUsuarios: true,
      subscriptionPlanId: true,
    },
  });
  if (!company) return { success: false, error: 'Empresa no encontrada' };
  const modules = await prisma.companyModule.findMany({
    where: { companyId: context.companyId, activo: true },
    select: { moduloCodigo: true },
  });
  return {
    success: true,
    settings: {
      ...company,
      modulosActivos: modules.map((m) => m.moduloCodigo),
    },
  };
}

async function updateCompanySettings(input: any, context: AssistantContext) {
  const { contractExpirationAlertDays } = input;
  const data: any = {};
  if (contractExpirationAlertDays != null)
    data.contractExpirationAlertDays = contractExpirationAlertDays;
  if (Object.keys(data).length === 0)
    return { success: false, error: 'No hay datos para actualizar' };
  const company = await prisma.company.update({
    where: { id: context.companyId },
    data,
  });
  return { success: true, company, message: 'Configuración actualizada' };
}

async function calculateMortgage(input: any) {
  const { importe, plazoAnos, tipoInteres } = input;
  const r = tipoInteres / 100 / 12;
  const n = plazoAnos * 12;
  const cuota = (importe * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  return {
    success: true,
    cuotaMensual: Math.round(cuota * 100) / 100,
    totalPagado: Math.round(cuota * n * 100) / 100,
    interesTotal: Math.round((cuota * n - importe) * 100) / 100,
  };
}

async function calculateRoi(input: any) {
  const {
    precioCompra,
    rentaMensual,
    gastosMensuales = 0,
    ibi = 0,
    seguros = 0,
    comunidad = 0,
  } = input;
  const ingresosAnuales = rentaMensual * 12;
  const gastosAnuales = gastosMensuales * 12 + ibi + seguros + comunidad * 12;
  const beneficioNeto = ingresosAnuales - gastosAnuales;
  const roi = (beneficioNeto / precioCompra) * 100;
  const paybackAnos = beneficioNeto > 0 ? precioCompra / beneficioNeto : 0;
  return {
    success: true,
    roi: Math.round(roi * 100) / 100,
    beneficioNetoAnual: Math.round(beneficioNeto),
    ingresosAnuales: Math.round(ingresosAnuales),
    gastosAnuales: Math.round(gastosAnuales),
    paybackAnos: Math.round(paybackAnos * 10) / 10,
  };
}

async function generateReport(input: any, context: AssistantContext) {
  const { tipo, periodo } = input;
  const year = periodo ? parseInt(periodo.substring(0, 4), 10) : new Date().getFullYear();
  const month = periodo && periodo.length >= 7 ? parseInt(periodo.substring(5, 7), 10) : null;

  const contracts = await prisma.contract.findMany({
    where: {
      estado: 'activo',
      unit: { building: { companyId: context.companyId } },
    },
    include: {
      tenant: { select: { nombreCompleto: true } },
      unit: {
        select: { numero: true, rentaMensual: true, building: { select: { nombre: true } } },
      },
    },
  });

  const units = await prisma.unit.findMany({
    where: { building: { companyId: context.companyId } },
    select: { estado: true, tipo: true, superficie: true, rentaMensual: true },
  });

  const payments = await prisma.payment.findMany({
    where: {
      contract: { unit: { building: { companyId: context.companyId } } },
      periodo: { startsWith: year.toString() },
    },
    select: { monto: true, estado: true, periodo: true },
  });

  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { building: { companyId: context.companyId } },
        { unit: { building: { companyId: context.companyId } } },
      ],
    },
    select: { monto: true, fecha: true },
  });

  const ocupadas = units.filter((u) => u.estado === 'ocupada').length;
  const totalUnits = units.length;
  const ingresos = payments.filter((p) => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0);
  const pendientes = payments
    .filter((p) => p.estado === 'pendiente' || p.estado === 'atrasado')
    .reduce((s, p) => s + p.monto, 0);
  const gastos = expenses.reduce((s, e) => s + e.monto, 0);

  const report: any = {
    tipo,
    periodo: periodo || `${year}`,
    resumen: {
      totalUnidades: totalUnits,
      ocupadas,
      tasaOcupacion: totalUnits > 0 ? Math.round((ocupadas / totalUnits) * 100) : 0,
      ingresosCobrados: Math.round(ingresos),
      pendienteCobro: Math.round(pendientes),
      gastos: Math.round(gastos),
      contratosActivos: contracts.length,
    },
  };

  if (tipo === 'completo' || tipo === 'financiero') {
    report.financiero = { ingresos, gastos, pendientes };
  }
  if (tipo === 'completo' || tipo === 'ocupacion') {
    report.ocupacion = { totalUnidades: totalUnits, ocupadas, disponibles: totalUnits - ocupadas };
  }
  if (tipo === 'completo' || tipo === 'morosidad') {
    const atrasados = payments.filter((p) => p.estado === 'atrasado');
    report.morosidad = {
      count: atrasados.length,
      total: atrasados.reduce((s, p) => s + p.monto, 0),
    };
  }
  if (tipo === 'completo' || tipo === 'contratos') {
    report.contratos = contracts.slice(0, 20);
  }

  return { success: true, report };
}

async function getAccountingSummary(input: any, context: AssistantContext) {
  const periodo = input.periodo || new Date().getFullYear().toString();
  const isYear = periodo.length <= 4;
  const payments = await prisma.payment.findMany({
    where: {
      contract: { unit: { building: { companyId: context.companyId } } },
      periodo: isYear ? { startsWith: periodo } : { equals: periodo },
    },
    select: { monto: true, estado: true },
  });
  const dateFilter = isYear
    ? { gte: new Date(parseInt(periodo, 10), 0, 1), lt: new Date(parseInt(periodo, 10) + 1, 0, 1) }
    : {
        gte: new Date(
          parseInt(periodo.substring(0, 4), 10),
          parseInt(periodo.substring(5, 7), 10) - 1,
          1
        ),
        lt: new Date(
          parseInt(periodo.substring(0, 4), 10),
          parseInt(periodo.substring(5, 7), 10),
          1
        ),
      };
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { building: { companyId: context.companyId }, fecha: dateFilter },
        { unit: { building: { companyId: context.companyId } }, fecha: dateFilter },
      ],
    },
    select: { monto: true },
  });
  const ingresos = payments.filter((p) => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0);
  const gastos = expenses.reduce((s, e) => s + e.monto, 0);
  return {
    success: true,
    periodo,
    ingresos: Math.round(ingresos * 100) / 100,
    gastos: Math.round(gastos * 100) / 100,
    balance: Math.round((ingresos - gastos) * 100) / 100,
  };
}
