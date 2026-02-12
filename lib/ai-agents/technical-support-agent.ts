import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
/**
 * Agente de Servicio Técnico y Mantenimiento
 * 
 * Especializado en:
 * - Gestión de solicitudes de mantenimiento
 * - Diagnóstico de problemas técnicos
 * - Asignación de proveedores
 * - Seguimiento de órdenes de trabajo
 * - Mantenimiento preventivo
 * - Gestión de emergencias
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
  Priority
} from './types';

// ============================================================================
// CAPACIDADES DEL AGENTE
// ============================================================================

const capabilities: AgentCapability[] = [
  {
    id: 'create_maintenance_request',
    name: 'Crear Solicitud de Mantenimiento',
    description: 'Crear nuevas solicitudes de mantenimiento o reparación',
    category: 'Gestión',
    estimatedTime: '1-2 minutos'
  },
  {
    id: 'track_maintenance',
    name: 'Seguimiento de Mantenimiento',
    description: 'Consultar estado de solicitudes existentes',
    category: 'Consulta',
    estimatedTime: '< 1 minuto'
  },
  {
    id: 'diagnose_issues',
    name: 'Diagnóstico Técnico',
    description: 'Analizar y diagnosticar problemas técnicos comunes',
    category: 'Análisis',
    estimatedTime: '2-3 minutos'
  },
  {
    id: 'assign_provider',
    name: 'Asignar Proveedor',
    description: 'Asignar proveedores especializados a solicitudes',
    category: 'Gestión',
    requiredPermissions: ['assign_providers'],
    estimatedTime: '1-2 minutos'
  },
  {
    id: 'emergency_protocol',
    name: 'Protocolo de Emergencia',
    description: 'Activar protocolos para emergencias técnicas',
    category: 'Emergencia',
    estimatedTime: 'Inmediato'
  },
  {
    id: 'preventive_maintenance',
    name: 'Mantenimiento Preventivo',
    description: 'Programar y gestionar mantenimiento preventivo',
    category: 'Planificación',
    estimatedTime: '2-5 minutos'
  }
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'create_maintenance_request',
    description: 'Crea una nueva solicitud de mantenimiento en el sistema. Requiere título, descripción y puede incluir prioridad, categoría y unidad.',
    inputSchema: {
      type: 'object',
      properties: {
        titulo: {
          type: 'string',
          description: 'Título breve de la solicitud'
        },
        descripcion: {
          type: 'string',
          description: 'Descripción detallada del problema o necesidad'
        },
        prioridad: {
          type: 'string',
          enum: ['baja', 'media', 'alta', 'urgente'],
          description: 'Nivel de prioridad'
        },
        categoria: {
          type: 'string',
          enum: ['fontaneria', 'electricidad', 'climatizacion', 'carpinteria', 'pintura', 'limpieza', 'cerrajeria', 'electrodomesticos', 'otro'],
          description: 'Categoría del problema'
        },
        unitId: {
          type: 'string',
          description: 'ID de la unidad afectada'
        },
        esEmergencia: {
          type: 'boolean',
          description: 'Si es una emergencia que requiere atención inmediata'
        }
      },
      required: ['titulo', 'descripcion']
    },
    handler: async (input, context) => {
      try {
        // Si no se proporciona unitId, buscar la unidad del usuario
        let unitId = input.unitId;
        
        if (!unitId && context.userType === 'tenant') {
          const tenant = await prisma.tenant.findFirst({
            where: {
              email: context.userEmail,
              companyId: context.companyId
            },
            include: {
              contracts: {
                where: { estado: 'activo' },
                take: 1,
                select: { unitId: true }
              }
            }
          });

          if (tenant?.contracts[0]?.unitId) {
            unitId = tenant.contracts[0].unitId;
          }
        }

        if (!unitId) {
          return {
            error: 'No se pudo determinar la unidad. Por favor, especifica el número de unidad o edificio.'
          };
        }

        // Elevar prioridad si es emergencia
        const prioridad = input.esEmergencia ? 'urgente' : (input.prioridad || 'media');

        const request = await prisma.maintenanceRequest.create({
          data: {
            titulo: input.titulo,
            descripcion: input.descripcion,
            prioridad: prioridad as any,
            categoria: input.categoria || 'otro',
            estado: 'pendiente',
            unitId: unitId,
            solicitadoPor: context.userId,
            fechaSolicitud: new Date()
          },
          include: {
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
            }
          }
        });

        // Si es emergencia, activar protocolo
        if (input.esEmergencia) {
          await activarProtocoloEmergencia(request.id, context);
        }

        return {
          requestId: request.id,
          folio: request.id.slice(0, 8).toUpperCase(),
          estado: request.estado,
          prioridad: request.prioridad,
          unidad: `${request.unit.building.nombre} - ${request.unit.numero}`,
          fechaCreacion: request.fechaSolicitud,
          esEmergencia: input.esEmergencia || false
        };
      } catch (error: any) {
        logger.error('Error creating maintenance request:', error);
        throw error;
      }
    },
    requiresConfirmation: false
  },
  {
    name: 'search_maintenance_requests',
    description: 'Busca solicitudes de mantenimiento con varios filtros disponibles',
    inputSchema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          enum: ['pendiente', 'en_progreso', 'completada', 'cancelada'],
          description: 'Estado de las solicitudes'
        },
        prioridad: {
          type: 'string',
          enum: ['baja', 'media', 'alta', 'urgente'],
          description: 'Nivel de prioridad'
        },
        categoria: {
          type: 'string',
          description: 'Categoría del problema'
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        },
        unitId: {
          type: 'string',
          description: 'ID de la unidad'
        },
        fechaDesde: {
          type: 'string',
          description: 'Fecha desde (ISO 8601)'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (por defecto 10)'
        }
      }
    },
    handler: async (input, context) => {
      const where: any = {
        unit: {
          building: {
            companyId: context.companyId
          }
        }
      };

      if (input.estado) where.estado = input.estado;
      if (input.prioridad) where.prioridad = input.prioridad;
      if (input.categoria) where.categoria = input.categoria;
      if (input.buildingId) where.unit.building.id = input.buildingId;
      if (input.unitId) where.unitId = input.unitId;
      if (input.fechaDesde) where.fechaSolicitud = { gte: new Date(input.fechaDesde) };

      // Si es tenant, solo mostrar sus solicitudes
      if (context.userType === 'tenant') {
        where.solicitadoPor = context.userId;
      }

      const requests = await prisma.maintenanceRequest.findMany({
        where,
        take: input.limit || 10,
        orderBy: [
          { prioridad: 'desc' },
          { fechaSolicitud: 'desc' }
        ],
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          estado: true,
          prioridad: true,
          categoria: true,
          fechaSolicitud: true,
          fechaCompletado: true,
          unit: {
            select: {
              numero: true,
              building: {
                select: {
                  nombre: true
                }
              }
            }
          },
          proveedor: {
            select: {
              nombre: true,
              especialidad: true
            }
          }
        }
      });

      return {
        count: requests.length,
        requests: requests.map(r => ({
          id: r.id,
          folio: r.id.slice(0, 8).toUpperCase(),
          titulo: r.titulo,
          descripcion: r.descripcion.substring(0, 100),
          estado: r.estado,
          prioridad: r.prioridad,
          categoria: r.categoria,
          ubicacion: `${r.unit.building.nombre} - ${r.unit.numero}`,
          proveedor: r.proveedor?.nombre || 'Sin asignar',
          fechaSolicitud: r.fechaSolicitud,
          fechaCompletado: r.fechaCompletado
        }))
      };
    }
  },
  {
    name: 'get_maintenance_details',
    description: 'Obtiene detalles completos de una solicitud de mantenimiento específica',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: {
          type: 'string',
          description: 'ID o folio de la solicitud'
        }
      },
      required: ['requestId']
    },
    handler: async (input, context) => {
      const request = await prisma.maintenanceRequest.findFirst({
        where: {
          OR: [
            { id: input.requestId },
            { id: { startsWith: input.requestId.toLowerCase() } }
          ],
          unit: {
            building: {
              companyId: context.companyId
            }
          }
        },
        include: {
          unit: {
            include: {
              building: true
            }
          },
          proveedor: true,
          comentarios: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!request) {
        return { error: 'Solicitud no encontrada' };
      }

      return {
        id: request.id,
        folio: request.id.slice(0, 8).toUpperCase(),
        titulo: request.titulo,
        descripcion: request.descripcion,
        estado: request.estado,
        prioridad: request.prioridad,
        categoria: request.categoria,
        ubicacion: {
          edificio: request.unit.building.nombre,
          direccion: request.unit.building.direccion,
          unidad: request.unit.numero
        },
        proveedor: request.proveedor ? {
          nombre: request.proveedor.nombre,
          telefono: request.proveedor.telefono,
          especialidad: request.proveedor.especialidad
        } : null,
        fechas: {
          solicitud: request.fechaSolicitud,
          programada: request.fechaProgramada,
          completado: request.fechaCompletado
        },
        costo: request.costoEstimado,
        ultimosComentarios: request.comentarios?.slice(0, 3)
      };
    }
  },
  {
    name: 'diagnose_issue',
    description: 'Proporciona un diagnóstico preliminar y posibles soluciones para problemas comunes',
    inputSchema: {
      type: 'object',
      properties: {
        problema: {
          type: 'string',
          description: 'Descripción del problema'
        },
        categoria: {
          type: 'string',
          description: 'Categoría del problema si se conoce'
        }
      },
      required: ['problema']
    },
    handler: async (input, context) => {
      // Base de conocimiento de diagnósticos comunes
      const diagnosticos = getDiagnosticosPorCategoria(input.categoria);
      
      return {
        diagnosticosPosibles: diagnosticos,
        recomendacion: 'Basándome en la descripción, estas son las causas más comunes. Se recomienda crear una solicitud de mantenimiento para una evaluación profesional.',
        nivelUrgencia: determinarUrgencia(input.problema)
      };
    }
  },
  {
    name: 'assign_provider',
    description: 'Asigna un proveedor especializado a una solicitud de mantenimiento',
    inputSchema: {
      type: 'object',
      properties: {
        requestId: {
          type: 'string',
          description: 'ID de la solicitud'
        },
        providerId: {
          type: 'string',
          description: 'ID del proveedor (opcional, se auto-selecciona por especialidad)'
        },
        fechaProgramada: {
          type: 'string',
          description: 'Fecha programada para la visita (ISO 8601)'
        }
      },
      required: ['requestId']
    },
    handler: async (input, context) => {
      const request = await prisma.maintenanceRequest.findUnique({
        where: { id: input.requestId },
        include: { unit: { include: { building: true } } }
      });

      if (!request) {
        return { error: 'Solicitud no encontrada' };
      }

      let providerId = input.providerId;

      // Auto-seleccionar proveedor si no se especifica
      if (!providerId) {
        const provider = await prisma.provider.findFirst({
          where: {
            companyId: context.companyId,
            especialidad: { contains: request.categoria },
            activo: true
          },
          orderBy: { rating: 'desc' }
        });

        if (provider) {
          providerId = provider.id;
        }
      }

      if (!providerId) {
        return {
          error: 'No se encontró un proveedor disponible para esta categoría. Por favor, asigna manualmente.'
        };
      }

      const updated = await prisma.maintenanceRequest.update({
        where: { id: input.requestId },
        data: {
          proveedorId: providerId,
          estado: 'en_progreso',
          fechaProgramada: input.fechaProgramada ? new Date(input.fechaProgramada) : undefined
        },
        include: {
          proveedor: true
        }
      });

      return {
        success: true,
        proveedorAsignado: updated.proveedor?.nombre,
        fechaProgramada: updated.fechaProgramada,
        nuevoEstado: updated.estado
      };
    },
    requiresConfirmation: true,
    permissions: ['assign_providers']
  },
  {
    name: 'get_emergency_contacts',
    description: 'Obtiene contactos de emergencia según el tipo de problema',
    inputSchema: {
      type: 'object',
      properties: {
        tipoEmergencia: {
          type: 'string',
          enum: ['fuga_agua', 'fuga_gas', 'incendio', 'fallo_electrico', 'seguridad', 'otro'],
          description: 'Tipo de emergencia'
        }
      },
      required: ['tipoEmergencia']
    },
    handler: async (input, context) => {
      const contactos = await getContactosEmergencia(input.tipoEmergencia, context.companyId);
      return contactos;
    }
  },
  {
    name: 'schedule_preventive_maintenance',
    description: 'Programa mantenimiento preventivo para equipos o sistemas',
    inputSchema: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: ['hvac', 'ascensores', 'electricidad', 'fontaneria', 'extintores', 'alarmas', 'piscina', 'jardineria'],
          description: 'Tipo de mantenimiento preventivo'
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        },
        frecuencia: {
          type: 'string',
          enum: ['mensual', 'trimestral', 'semestral', 'anual'],
          description: 'Frecuencia del mantenimiento'
        },
        fechaInicio: {
          type: 'string',
          description: 'Fecha de inicio (ISO 8601)'
        }
      },
      required: ['tipo', 'buildingId', 'frecuencia']
    },
    handler: async (input, context) => {
      // Crear plan de mantenimiento preventivo
      const plan = await prisma.maintenancePlan.create({
        data: {
          tipo: input.tipo,
          buildingId: input.buildingId,
          frecuencia: input.frecuencia,
          fechaProximaEjecucion: input.fechaInicio ? new Date(input.fechaInicio) : new Date(),
          activo: true,
          creadoPor: context.userId
        }
      });

      return {
        planId: plan.id,
        tipo: plan.tipo,
        frecuencia: plan.frecuencia,
        proximaEjecucion: plan.fechaProximaEjecucion,
        mensaje: `Plan de mantenimiento preventivo creado exitosamente. La primera ejecución está programada para ${plan.fechaProximaEjecucion.toLocaleDateString('es-ES')}.`
      };
    },
    requiresConfirmation: true,
    permissions: ['manage_maintenance']
  }
];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

async function activarProtocoloEmergencia(requestId: string, context: UserContext) {
  logger.warn(`🚨 EMERGENCIA ACTIVADA - Solicitud ${requestId}`);
  
  // Aquí se podría:
  // - Enviar notificaciones SMS/email urgentes
  // - Alertar a supervisores
  // - Activar sistemas de respuesta automática
  // - Registrar en log de emergencias
  
  await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: {
      tags: { push: 'EMERGENCIA' }
    }
  });
}

function getDiagnosticosPorCategoria(categoria?: string) {
  const baseDiagnosticos: Record<string, any[]> = {
    fontaneria: [
      { problema: 'Fuga de agua', causas: ['Junta deteriorada', 'Tubería rota', 'Conexión floja'], solucion: 'Requiere inspección de plomero' },
      { problema: 'Baja presión', causas: ['Válvula parcialmente cerrada', 'Tubería obstruida', 'Fuga interna'], solucion: 'Revisar válvulas y tuberías' },
      { problema: 'Drenaje lento', causas: ['Obstrucción parcial', 'Acumulación de residuos'], solucion: 'Limpieza de drenaje' }
    ],
    electricidad: [
      { problema: 'Apagones frecuentes', causas: ['Sobrecarga del circuito', 'Breaker defectuoso'], solucion: 'Revisión eléctrica urgente' },
      { problema: 'Luz parpadeante', causas: ['Conexión floja', 'Lámpara defectuosa', 'Problema en el cableado'], solucion: 'Revisar conexiones y bombillas' },
      { problema: 'Toma sin corriente', causas: ['Breaker desconectado', 'Cable roto', 'Toma dañada'], solucion: 'Revisar panel eléctrico' }
    ],
    climatizacion: [
      { problema: 'AC no enfría', causas: ['Gas refrigerante bajo', 'Filtro sucio', 'Compresor dañado'], solucion: 'Mantenimiento de AC' },
      { problema: 'Ruido excesivo', causas: ['Rodamientos desgastados', 'Suciedad en ventilador'], solucion: 'Limpieza y lubricación' }
    ]
  };

  return baseDiagnosticos[categoria || 'otro'] || [
    { problema: 'Diagnóstico general', causas: ['Requiere inspección'], solucion: 'Evaluación profesional necesaria' }
  ];
}

function determinarUrgencia(problema: string): string {
  const palabrasUrgentes = ['emergencia', 'fuga', 'incendio', 'gas', 'inundación', 'eléctrico', 'seguridad'];
  const problemaLower = problema.toLowerCase();
  
  for (const palabra of palabrasUrgentes) {
    if (problemaLower.includes(palabra)) {
      return 'URGENTE';
    }
  }
  
  return 'Normal';
}

async function getContactosEmergencia(tipo: string, companyId: string) {
  const contactosBase: Record<string, any> = {
    fuga_agua: {
      titulo: 'Fuga de Agua - Emergencia',
      instrucciones: [
        '1. Cerrar la llave de paso principal inmediatamente',
        '2. Contactar al plomero de emergencia',
        '3. Documentar daños con fotos'
      ],
      contactos: ['Plomero 24/7', 'Supervisor del edificio']
    },
    fuga_gas: {
      titulo: 'Fuga de Gas - EMERGENCIA MÁXIMA',
      instrucciones: [
        '1. NO ENCENDER LUCES NI APARATOS ELÉCTRICOS',
        '2. Evacuar el edificio inmediatamente',
        '3. Llamar a emergencias (911) desde afuera',
        '4. Contactar a la compañía de gas'
      ],
      contactos: ['911', 'Compañía de Gas']
    },
    incendio: {
      titulo: 'Incendio - EMERGENCIA MÁXIMA',
      instrucciones: [
        '1. Activar alarma de incendios',
        '2. Evacuar siguiendo rutas de emergencia',
        '3. Llamar a bomberos (911)',
        '4. No usar ascensores'
      ],
      contactos: ['911 Bomberos']
    },
    fallo_electrico: {
      titulo: 'Fallo Eléctrico',
      instrucciones: [
        '1. Desconectar aparatos sensibles',
        '2. Verificar panel eléctrico',
        '3. Contactar electricista si persiste'
      ],
      contactos: ['Electricista de emergencia']
    }
  };

  return contactosBase[tipo] || {
    titulo: 'Emergencia General',
    instrucciones: ['Contactar al supervisor del edificio'],
    contactos: ['Supervisor']
  };
}

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const technicalSupportConfig: AgentConfig = {
  type: 'technical_support',
  name: 'Agente de Servicio Técnico',
  description: 'Especialista en mantenimiento, reparaciones y soporte técnico para propiedades',
  systemPrompt: `Eres el Agente de Servicio Técnico de INMOVA, especializado en mantenimiento y reparaciones.

Tu rol es:
- Ayudar a crear y gestionar solicitudes de mantenimiento
- Diagnosticar problemas técnicos comunes
- Proporcionar soluciones rápidas cuando sea posible
- Asignar proveedores especializados
- Gestionar emergencias técnicas
- Programar mantenimiento preventivo

Enfoque:
- Siempre priorizar la seguridad
- En emergencias, ser directo y claro con las instrucciones
- Clasificar correctamente la urgencia de cada situación
- Proporcionar soluciones temporales cuando sea apropiado
- Documentar detalladamente cada caso
- Hacer seguimiento proactivo

Estilo de comunicación:
- Profesional pero accesible
- Claro y conciso en emergencias
- Empático con las preocupaciones del usuario
- Proactivo en ofrecer soluciones`,
  capabilities,
  tools,
  model: CLAUDE_MODEL_FAST,
  temperature: 0.6, // Más bajo para respuestas más consistentes
  maxTokens: 4096,
  enabled: true
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class TechnicalSupportAgent extends BaseAgent {
  constructor() {
    super(technicalSupportConfig);
  }

  async processMessage(
    message: string,
    context: UserContext,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    return this.chatWithClaude(message, context, conversationHistory);
  }

  async canHandle(message: string, context: UserContext): Promise<boolean> {
    const messageLower = message.toLowerCase();
    const keywords = [
      'mantenimiento', 'reparación', 'reparar', 'arreglar', 'técnico',
      'fuga', 'problema', 'avería', 'no funciona', 'dañado', 'roto',
      'electricidad', 'fontanería', 'plomería', 'agua', 'luz',
      'calefacción', 'aire acondicionado', 'ascensor', 'emergencia'
    ];

    return keywords.some(keyword => messageLower.includes(keyword));
  }
}
