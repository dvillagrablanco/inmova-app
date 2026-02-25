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
  apiKey: process.env.ANTHROPIC_API_KEY || ''
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
    description: 'Busca edificios en el sistema. Puede filtrar por nombre, dirección, ciudad o estado.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda para nombre, dirección o ciudad'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_tenants',
    description: 'Busca inquilinos en el sistema. Puede filtrar por nombre, email o teléfono.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda para nombre, email o teléfono'
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio para filtrar inquilinos'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_building_details',
    description: 'Obtiene detalles completos de un edificio específico incluyendo unidades, inquilinos y contratos.',
    input_schema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        }
      },
      required: ['buildingId']
    }
  },
  {
    name: 'get_tenant_details',
    description: 'Obtiene detalles completos de un inquilino incluyendo contratos activos, pagos y solicitudes de mantenimiento.',
    input_schema: {
      type: 'object',
      properties: {
        tenantId: {
          type: 'string',
          description: 'ID del inquilino'
        }
      },
      required: ['tenantId']
    }
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
          enum: ['activo', 'vencido', 'próximo_vencer']
        },
        tenantId: {
          type: 'string',
          description: 'ID del inquilino'
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)'
        }
      }
    }
  },
  {
    name: 'get_payment_status',
    description: 'Obtiene el estado de pagos de un inquilino o contrato específico.',
    input_schema: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'ID del contrato'
        },
        tenantId: {
          type: 'string',
          description: 'ID del inquilino'
        },
        includeHistory: {
          type: 'boolean',
          description: 'Incluir historial de pagos'
        }
      }
    }
  },
  {
    name: 'create_maintenance_request',
    description: 'Crea una nueva solicitud de mantenimiento para una unidad o edificio.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título de la solicitud'
        },
        description: {
          type: 'string',
          description: 'Descripción detallada del problema'
        },
        unitId: {
          type: 'string',
          description: 'ID de la unidad'
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        },
        priority: {
          type: 'string',
          description: 'Prioridad (baja, media, alta, urgente)',
          enum: ['baja', 'media', 'alta', 'urgente']
        },
        category: {
          type: 'string',
          description: 'Categoría (fontanería, electricidad, carpintería, limpieza, otro)'
        }
      },
      required: ['title', 'description']
    }
  },
  {
    name: 'search_maintenance_requests',
    description: 'Busca solicitudes de mantenimiento con filtros.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Estado (pendiente, en_progreso, completada, cancelada)'
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        },
        priority: {
          type: 'string',
          description: 'Prioridad (baja, media, alta, urgente)'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)'
        }
      }
    }
  },
  {
    name: 'create_task',
    description: 'Crea una nueva tarea en el sistema.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título de la tarea'
        },
        description: {
          type: 'string',
          description: 'Descripción de la tarea'
        },
        assignedTo: {
          type: 'string',
          description: 'ID del usuario asignado'
        },
        priority: {
          type: 'string',
          description: 'Prioridad (baja, media, alta, urgente)',
          enum: ['baja', 'media', 'alta', 'urgente']
        },
        dueDate: {
          type: 'string',
          description: 'Fecha de vencimiento (ISO 8601)'
        }
      },
      required: ['title']
    }
  },
  {
    name: 'search_tasks',
    description: 'Busca tareas en el sistema.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Estado de la tarea (pendiente, en_progreso, completada)'
        },
        assignedTo: {
          type: 'string',
          description: 'ID del usuario asignado'
        },
        priority: {
          type: 'string',
          description: 'Prioridad'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)'
        }
      }
    }
  },
  {
    name: 'get_dashboard_stats',
    description: 'Obtiene estadísticas del dashboard como número de edificios, inquilinos, contratos activos, pagos pendientes, etc.',
    input_schema: {
      type: 'object',
      properties: {
        includeFinancial: {
          type: 'boolean',
          description: 'Incluir datos financieros'
        },
        includeMaintenance: {
          type: 'boolean',
          description: 'Incluir datos de mantenimiento'
        }
      }
    }
  },
  {
    name: 'search_units',
    description: 'Busca unidades/propiedades en el sistema.',
    input_schema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        },
        status: {
          type: 'string',
          description: 'Estado (disponible, ocupada, mantenimiento)',
          enum: ['disponible', 'ocupada', 'mantenimiento']
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)'
        }
      }
    }
  },
  // === HERRAMIENTAS DE ACCIÓN (Premium) ===
  {
    name: 'analyze_document',
    description: 'Analiza un documento (PDF, Excel, imagen) subido por el usuario. Extrae datos como inquilinos, contratos, importes, fechas, direcciones. Usar cuando el usuario sube un archivo.',
    input_schema: {
      type: 'object',
      properties: {
        documentText: {
          type: 'string',
          description: 'Texto extraído del documento'
        },
        documentType: {
          type: 'string',
          description: 'Tipo de documento detectado',
          enum: ['contrato', 'factura', 'dni', 'escritura', 'certificado', 'contabilidad', 'catastro', 'otro']
        },
        action: {
          type: 'string',
          description: 'Qué hacer con los datos extraídos',
          enum: ['extract_data', 'import_to_system', 'summarize', 'validate']
        }
      },
      required: ['documentText', 'documentType']
    }
  },
  {
    name: 'valuate_property',
    description: 'Valora un activo inmobiliario por dirección o referencia catastral. Estima valor de venta, alquiler, ROI. Usar cuando el usuario pide valorar un inmueble.',
    input_schema: {
      type: 'object',
      properties: {
        direccion: { type: 'string', description: 'Dirección del inmueble' },
        ciudad: { type: 'string', description: 'Ciudad' },
        superficie: { type: 'number', description: 'Superficie en m²' },
        tipo: { type: 'string', description: 'Tipo de activo', enum: ['vivienda', 'local', 'oficina', 'nave', 'garaje', 'edificio'] },
        habitaciones: { type: 'number', description: 'Número de habitaciones (si vivienda)' },
        refCatastral: { type: 'string', description: 'Referencia catastral (si disponible)' },
      },
      required: ['direccion', 'tipo']
    }
  },
  {
    name: 'search_catastro',
    description: 'Consulta el Catastro público español por referencia catastral o dirección. Devuelve superficie, uso, año de construcción.',
    input_schema: {
      type: 'object',
      properties: {
        refCatastral: { type: 'string', description: 'Referencia catastral (14-20 caracteres)' },
        provincia: { type: 'string', description: 'Provincia (para búsqueda por dirección)' },
        municipio: { type: 'string', description: 'Municipio' },
        via: { type: 'string', description: 'Nombre de la vía' },
        numero: { type: 'string', description: 'Número' },
      }
    }
  },
  {
    name: 'get_financial_summary',
    description: 'Obtiene un resumen financiero de la empresa: ingresos, gastos, ocupación, morosidad, contratos próximos a vencer.',
    input_schema: {
      type: 'object',
      properties: {
        periodo: { type: 'string', description: 'Periodo: "mes_actual", "trimestre", "año"', enum: ['mes_actual', 'trimestre', 'año'] }
      }
    }
  },
];

// ============================================================================
// IMPLEMENTACIÓN DE HERRAMIENTAS
// ============================================================================

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
    const systemPrompt = `Eres un asistente IA experto en gestión inmobiliaria llamado INMOVA Assistant.

Tus capacidades:
- Responder preguntas sobre edificios, inquilinos, contratos y pagos
- Crear y gestionar solicitudes de mantenimiento
- Crear tareas y recordatorios
- Proporcionar estadísticas y reportes financieros
- Ayudar con consultas administrativas
- ANALIZAR DOCUMENTOS: Si el usuario sube un PDF, Excel o imagen, extrae datos automáticamente
- VALORAR ACTIVOS: Estima valor de venta/alquiler de cualquier inmueble por dirección o ref. catastral
- CONSULTAR CATASTRO: Busca datos catastrales (superficie, uso, año) por referencia o dirección
- IMPORTAR DATOS: Analiza archivos de contabilidad, facturación o contratos y extrae información

Cuando el usuario suba un documento, analízalo automáticamente y sugiere acciones.
Responde siempre en español. Sé conciso y útil.

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
      ...(context.conversationHistory?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })) || []),
      {
        role: 'user' as const,
        content: userMessage
      }
    ];

    logger.info(`🤖 Claude request - User: ${context.userName}`);

    // Primera llamada a Claude
    let response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      tools: tools,
      messages: messages
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
          const toolResult = await executeTool(
            block.name,
            block.input,
            context
          );

          toolResults.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(toolResult)
              }
            ]
          });
        }
      }

      // Continuar la conversación con los resultados de las herramientas
      messages.push(
        {
          role: 'assistant',
          content: response.content
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
        messages: messages
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
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined
    };

    logger.info(`✅ Claude completed - Tools used: ${toolsUsed.join(', ') || 'none'}`);

    return result;
  } catch (error) {
    logger.error('Error in chatWithClaude:', error);
    return {
      type: 'text',
      content: 'Lo siento, hubo un error procesando tu solicitud. Por favor, inténtalo de nuevo.'
    };
  }
}

// ============================================================================
// IMPLEMENTACIONES DE TOOLS
// ============================================================================

async function searchBuildings(input: any, context: AssistantContext) {
  const { query, limit = 10 } = input;
  
  const buildings = await prisma.building.findMany({
    where: {
      companyId: context.companyId,
      OR: [
        { nombre: { contains: query, mode: 'insensitive' } },
        { direccion: { contains: query, mode: 'insensitive' } }
      ]
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
          units: true
        }
      }
    }
  });

  return {
    success: true,
    count: buildings.length,
    buildings
  };
}

async function searchTenants(input: any, context: AssistantContext) {
  const { query, buildingId, limit = 10 } = input;
  
  const where: any = {
    companyId: context.companyId,
    OR: [
      { nombreCompleto: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { telefono: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (buildingId) {
    where.contracts = {
      some: {
        unit: {
          buildingId: buildingId
        }
      }
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
          estado: 'activo'
        },
        select: {
          id: true,
          unit: {
            select: {
              numero: true,
              building: {
                select: {
                  nombre: true
                }
              }
            }
          }
        },
        take: 1
      }
    }
  });

  return {
    success: true,
    count: tenants.length,
    tenants
  };
}

async function getBuildingDetails(input: any, context: AssistantContext) {
  const { buildingId } = input;
  
  const building = await prisma.building.findFirst({
    where: {
      id: buildingId,
      companyId: context.companyId
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
              estado: 'activo'
            },
            select: {
              id: true,
              tenant: {
                select: {
                  nombreCompleto: true,
                  email: true
                }
              }
            },
            take: 1
          }
        }
      },
      _count: {
        select: {
          units: true
        }
      }
    }
  });

  if (!building) {
    return { success: false, error: 'Edificio no encontrado' };
  }

  return {
    success: true,
    building
  };
}

async function getTenantDetails(input: any, context: AssistantContext) {
  const { tenantId } = input;
  
  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      companyId: context.companyId
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
                  direccion: true
                }
              }
            }
          },
          payments: {
            take: 10,
            orderBy: {
              fechaPago: 'desc'
            },
            select: {
              id: true,
              monto: true,
              fechaPago: true,
              estado: true,
              metodoPago: true
            }
          }
        }
      }
    }
  });

  if (!tenant) {
    return { success: false, error: 'Inquilino no encontrado' };
  }

  return {
    success: true,
    tenant
  };
}

async function searchContracts(input: any, context: AssistantContext) {
  const { status, tenantId, buildingId, limit = 10 } = input;
  
  const where: any = {
    companyId: context.companyId
  };

  if (status) {
    where.estado = status;
  }

  if (tenantId) {
    where.tenantId = tenantId;
  }

  if (buildingId) {
    where.unit = {
      buildingId: buildingId
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
          email: true
        }
      },
      unit: {
        select: {
          numero: true,
          building: {
            select: {
              nombre: true
            }
          }
        }
      }
    },
    orderBy: {
      fechaInicio: 'desc'
    }
  });

  return {
    success: true,
    count: contracts.length,
    contracts
  };
}

async function getPaymentStatus(input: any, context: AssistantContext) {
  const { contractId, tenantId, includeHistory = true } = input;
  
  const where: any = {
    contract: {
      companyId: context.companyId
    }
  };

  if (contractId) {
    where.contractId = contractId;
  }

  if (tenantId) {
    where.contract = {
      ...where.contract,
      tenantId: tenantId
    };
  }

  const payments = await prisma.payment.findMany({
    where,
    take: includeHistory ? 50 : 10,
    orderBy: {
      fechaPago: 'desc'
    },
    select: {
      id: true,
      monto: true,
      fechaPago: true,
      fechaVencimiento: true,
      estado: true,
      periodo: true,
      metodoPago: true
    }
  });

  // Calcular resumen
  const pending = payments.filter(p => p.estado === 'pendiente');
  const totalPending = pending.reduce((sum, p) => sum + (p.monto || 0), 0);

  return {
    success: true,
    summary: {
      totalPayments: payments.length,
      pendingCount: pending.length,
      totalPending: totalPending
    },
    payments: includeHistory ? payments : payments.slice(0, 5)
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
      estado: 'pendiente'
    }
  });

  return {
    success: true,
    message: `Solicitud de mantenimiento creada exitosamente con ID: ${request.id}`,
    requestId: request.id,
    request
  };
}

async function searchMaintenanceRequests(input: any, context: AssistantContext) {
  const { status, buildingId, priority, limit = 10 } = input;
  
  const where: any = {
    unit: {
      building: {
        companyId: context.companyId
      }
    }
  };

  if (status) {
    where.estado = status;
  }

  if (buildingId) {
    where.unit = {
      ...where.unit,
      buildingId: buildingId
    };
  }

  if (priority) {
    where.prioridad = priority;
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    take: limit,
    orderBy: {
      fechaSolicitud: 'desc'
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
              nombre: true
            }
          }
        }
      }
    }
  });

  return {
    success: true,
    count: requests.length,
    requests
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
      fechaLimite: dueDate ? new Date(dueDate) : undefined
    }
  });

  return {
    success: true,
    message: `Tarea creada exitosamente con ID: ${task.id}`,
    taskId: task.id,
    task
  };
}

async function searchTasks(input: any, context: AssistantContext) {
  const { status, assignedTo, priority, limit = 10 } = input;
  
  const where: any = {
    companyId: context.companyId
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
      createdAt: 'desc'
    },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      estado: true,
      prioridad: true,
      fechaLimite: true,
      createdAt: true
    }
  });

  return {
    success: true,
    count: tasks.length,
    tasks
  };
}

async function getDashboardStats(input: any, context: AssistantContext) {
  const { includeFinancial = true, includeMaintenance = true } = input;
  
  const [buildingsCount, unitsCount, tenantsCount, contractsCount] = await Promise.all([
    prisma.building.count({ where: { companyId: context.companyId } }),
    prisma.unit.count({ 
      where: { 
        building: {
          companyId: context.companyId
        }
      } 
    }),
    prisma.tenant.count({ where: { companyId: context.companyId } }),
    prisma.contract.count({ 
      where: { 
        unit: {
          building: {
            companyId: context.companyId
          }
        },
        estado: 'activo'
      } 
    })
  ]);

  const stats: any = {
    buildings: buildingsCount,
    units: unitsCount,
    tenants: tenantsCount,
    activeContracts: contractsCount
  };

  if (includeFinancial) {
    const payments = await prisma.payment.groupBy({
      by: ['estado'],
      where: {
        contract: {
          unit: {
            building: {
              companyId: context.companyId
            }
          }
        }
      },
      _sum: { monto: true },
      _count: true
    });

    stats.payments = payments.reduce((acc: any, p) => {
      acc[p.estado] = {
        count: p._count,
        total: p._sum.monto || 0
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
            companyId: context.companyId
          }
        }
      },
      _count: true
    });

    stats.maintenance = maintenance.reduce((acc: any, m) => {
      acc[m.estado] = m._count;
      return acc;
    }, {});
  }

  return {
    success: true,
    stats
  };
}

async function searchUnits(input: any, context: AssistantContext) {
  const { buildingId, status, limit = 10 } = input;
  
  const where: any = {
    companyId: context.companyId
  };

  if (buildingId) {
    where.edificioId = buildingId;
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
          direccion: true
        }
      },
      contracts: {
        where: {
          estado: 'activo'
        },
        select: {
          id: true,
          tenant: {
            select: {
              nombreCompleto: true
            }
          }
        },
        take: 1
      }
    }
  });

  return {
    success: true,
    count: units.length,
    units
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
      const res = await fetch(`http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${refCatastral}`);
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
      datos: { direccion, superficie: superficie + 'm²', uso, anoConstruccion: ano, codigoPostal: cp },
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
    where: { contract: { unit: { building: { companyId: context.companyId } } }, periodo: { startsWith: new Date().getFullYear().toString() } },
    select: { monto: true, estado: true },
  });

  const units = await prisma.unit.findMany({
    where: { building: { companyId: context.companyId } },
    select: { estado: true },
  });

  const ingresosMensuales = contracts.reduce((s, c) => s + (Number(c.rentaMensual) || 0), 0);
  const totalUnits = units.length;
  const ocupadas = units.filter(u => u.estado === 'ocupada').length;
  const pagados = payments.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0);
  const pendientes = payments.filter(p => p.estado === 'pendiente').reduce((s, p) => s + p.monto, 0);
  
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const proxVencer = contracts.filter(c => new Date(c.fechaFin) <= in60Days && new Date(c.fechaFin) >= now).length;

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
