// @ts-nocheck
import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
/**
 * Agente de Atención al Cliente
 *
 * Especializado en:
 * - Consultas generales de inquilinos y propietarios
 * - Gestión de quejas y reclamos
 * - Información sobre contratos y pagos
 * - Programación de visitas
 * - Resolución de dudas administrativas
 * - Seguimiento de solicitudes
 * - Escalación a agentes humanos cuando sea necesario
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

// ============================================================================
// CAPACIDADES DEL AGENTE
// ============================================================================

const capabilities: AgentCapability[] = [
  {
    id: 'answer_inquiries',
    name: 'Responder Consultas',
    description: 'Responder consultas generales sobre servicios, procesos y políticas',
    category: 'Información',
    estimatedTime: '< 1 minuto',
  },
  {
    id: 'contract_info',
    name: 'Información de Contratos',
    description: 'Proporcionar información sobre contratos de arrendamiento',
    category: 'Consulta',
    estimatedTime: '1 minuto',
  },
  {
    id: 'payment_inquiries',
    name: 'Consultas de Pagos',
    description: 'Información sobre pagos, fechas de vencimiento y métodos de pago',
    category: 'Financiero',
    estimatedTime: '1 minuto',
  },
  {
    id: 'schedule_visit',
    name: 'Programar Visitas',
    description: 'Agendar visitas a propiedades o con el equipo de gestión',
    category: 'Agenda',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'handle_complaints',
    name: 'Gestionar Quejas',
    description: 'Registrar y dar seguimiento a quejas y reclamos',
    category: 'Resolución',
    estimatedTime: '3-5 minutos',
  },
  {
    id: 'document_requests',
    name: 'Solicitar Documentos',
    description: 'Gestionar solicitudes de documentos (recibos, certificados, etc.)',
    category: 'Documentación',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'escalate_to_human',
    name: 'Escalar a Humano',
    description: 'Transferir casos complejos a agentes humanos',
    category: 'Escalación',
    estimatedTime: 'Inmediato',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'get_user_profile',
    description:
      'Obtiene el perfil completo del usuario con sus contratos, pagos y solicitudes activas',
    inputSchema: {
      type: 'object',
      properties: {
        includeHistory: {
          type: 'boolean',
          description: 'Incluir historial completo de interacciones',
        },
      },
    },
    handler: async (input, context) => {
      let profile: any = {};

      // Si es tenant
      if (context.userType === 'tenant') {
        const tenant = await prisma.tenant.findFirst({
          where: {
            email: context.userEmail,
            companyId: context.companyId,
          },
          include: {
            contracts: {
              where: { estado: 'activo' },
              include: {
                unit: {
                  include: {
                    building: true,
                  },
                },
                payments: {
                  where: { estado: 'pendiente' },
                  orderBy: { fechaVencimiento: 'asc' },
                  take: 3,
                },
              },
            },
          },
        });

        if (tenant) {
          const contract = tenant.contracts[0];
          profile = {
            tipo: 'inquilino',
            nombre: tenant.nombreCompleto,
            email: tenant.email,
            telefono: tenant.telefono,
            contratoActivo: contract
              ? {
                  id: contract.id,
                  propiedad: `${contract.unit.building.nombre} - ${contract.unit.numero}`,
                  direccion: contract.unit.building.direccion,
                  rentaMensual: contract.rentaMensual,
                  fechaInicio: contract.fechaInicio,
                  fechaFin: contract.fechaFin,
                  pagosPendientes: contract.payments.length,
                  proximoPago: contract.payments[0],
                }
              : null,
          };
        }
      }

      // Si es landlord
      if (context.userType === 'landlord') {
        const user = await prisma.user.findUnique({
          where: { id: context.userId },
          select: {
            name: true,
            email: true,
            role: true,
          },
        });

        if (user) {
          const properties = await prisma.building.count({
            where: { companyId: context.companyId },
          });

          const activeContracts = await prisma.contract.count({
            where: {
              unit: {
                building: {
                  companyId: context.companyId,
                },
              },
              estado: 'activo',
            },
          });

          profile = {
            tipo: 'propietario',
            nombre: user.name,
            email: user.email,
            role: user.role,
            propiedades: properties,
            contratosActivos: activeContracts,
          };
        }
      }

      return profile;
    },
  },
  {
    name: 'get_contract_details',
    description: 'Obtiene información detallada del contrato de arrendamiento del usuario',
    inputSchema: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'ID del contrato (opcional si el usuario tiene solo uno)',
        },
      },
    },
    handler: async (input, context) => {
      let whereClause: any = {
        unit: {
          building: {
            companyId: context.companyId,
          },
        },
      };

      if (input.contractId) {
        whereClause.id = input.contractId;
      } else if (context.userType === 'tenant') {
        const tenant = await prisma.tenant.findFirst({
          where: { email: context.userEmail, companyId: context.companyId },
        });
        if (tenant) {
          whereClause.tenantId = tenant.id;
          whereClause.estado = 'activo';
        }
      }

      const contract = await prisma.contract.findFirst({
        where: whereClause,
        include: {
          tenant: {
            select: {
              nombreCompleto: true,
              email: true,
              telefono: true,
            },
          },
          unit: {
            include: {
              building: true,
            },
          },
        },
      });

      if (!contract) {
        return { error: 'No se encontró información del contrato' };
      }

      const diasRestantes = Math.ceil(
        (new Date(contract.fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return {
        contratoId: contract.id,
        inquilino: contract.tenant.nombreCompleto,
        propiedad: {
          nombre: contract.unit.building.nombre,
          direccion: contract.unit.building.direccion,
          unidad: contract.unit.numero,
          tipo: contract.unit.tipo,
          superficie: contract.unit.superficie,
        },
        terminos: {
          rentaMensual: contract.rentaMensual,
          deposito: contract.deposito,
          fechaInicio: contract.fechaInicio,
          fechaFin: contract.fechaFin,
          diasRestantes: diasRestantes,
          estado: contract.estado,
        },
        clausulas: contract.clausulasEspeciales || 'Ninguna cláusula especial',
        documentos: {
          contratoPDF: contract.documentUrl || 'Disponible en sección de Documentos',
          inventarioInicial: contract.inventarioUrl || 'No disponible',
        },
      };
    },
  },
  {
    name: 'check_payment_status',
    description: 'Consulta el estado de pagos del usuario, próximos vencimientos e historial',
    inputSchema: {
      type: 'object',
      properties: {
        includeHistory: {
          type: 'boolean',
          description: 'Incluir historial de pagos',
        },
        contractId: {
          type: 'string',
          description: 'ID del contrato específico',
        },
      },
    },
    handler: async (input, context) => {
      // Encontrar tenant
      const tenant = await prisma.tenant.findFirst({
        where: {
          email: context.userEmail,
          companyId: context.companyId,
        },
      });

      if (!tenant) {
        return { error: 'No se encontró información de pagos' };
      }

      const whereClause: any = {
        contract: {
          tenantId: tenant.id,
          estado: 'activo',
        },
      };

      if (input.contractId) {
        whereClause.contractId = input.contractId;
      }

      // Pagos pendientes
      const pagosPendientes = await prisma.payment.findMany({
        where: {
          ...whereClause,
          estado: 'pendiente',
        },
        orderBy: { fechaVencimiento: 'asc' },
        take: 5,
        include: {
          contract: {
            include: {
              unit: {
                select: {
                  numero: true,
                  building: {
                    select: { nombre: true },
                  },
                },
              },
            },
          },
        },
      });

      // Historial si se solicita
      let historial = null;
      if (input.includeHistory) {
        historial = await prisma.payment.findMany({
          where: {
            ...whereClause,
            estado: 'pagado',
          },
          orderBy: { fechaPago: 'desc' },
          take: 10,
          select: {
            id: true,
            monto: true,
            fechaPago: true,
            metodoPago: true,
            periodo: true,
          },
        });
      }

      const totalPendiente = pagosPendientes.reduce((sum, p) => sum + (p.monto || 0), 0);

      // Calcular días hasta próximo vencimiento
      const proximoVencimiento = pagosPendientes[0];
      let diasHastaVencimiento = null;
      if (proximoVencimiento) {
        diasHastaVencimiento = Math.ceil(
          (new Date(proximoVencimiento.fechaVencimiento).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );
      }

      return {
        resumen: {
          pagosPendientes: pagosPendientes.length,
          totalPendiente: totalPendiente,
          proximoVencimiento: proximoVencimiento?.fechaVencimiento,
          diasHastaVencimiento: diasHastaVencimiento,
          estadoCuenta:
            pagosPendientes.length === 0
              ? 'Al día'
              : diasHastaVencimiento && diasHastaVencimiento < 0
                ? 'Atrasado'
                : 'Pendiente',
        },
        pendientes: pagosPendientes.map((p) => ({
          id: p.id,
          monto: p.monto,
          concepto: p.concepto || 'Renta mensual',
          periodo: p.periodo,
          fechaVencimiento: p.fechaVencimiento,
          diasRestantes: Math.ceil(
            (new Date(p.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
          propiedad: `${p.contract.unit.building.nombre} - ${p.contract.unit.numero}`,
        })),
        historial: historial,
        metodosDisponibles: [
          'Transferencia bancaria',
          'Tarjeta de crédito/débito',
          'Domiciliación bancaria',
        ],
      };
    },
  },
  {
    name: 'create_complaint',
    description: 'Registra una queja o reclamo formal en el sistema',
    inputSchema: {
      type: 'object',
      properties: {
        titulo: {
          type: 'string',
          description: 'Título de la queja',
        },
        descripcion: {
          type: 'string',
          description: 'Descripción detallada',
        },
        categoria: {
          type: 'string',
          enum: [
            'servicio',
            'mantenimiento',
            'vecinos',
            'facturacion',
            'contrato',
            'instalaciones',
            'otro',
          ],
          description: 'Categoría de la queja',
        },
        prioridad: {
          type: 'string',
          enum: ['baja', 'media', 'alta'],
          description: 'Nivel de prioridad',
        },
      },
      required: ['titulo', 'descripcion'],
    },
    handler: async (input, context) => {
      const complaint = await prisma.complaint.create({
        data: {
          titulo: input.titulo,
          descripcion: input.descripcion,
          categoria: input.categoria || 'otro',
          prioridad: input.prioridad || 'media',
          estado: 'abierta',
          companyId: context.companyId,
          reportadoPor: context.userId,
          fechaReporte: new Date(),
        },
      });

      // Enviar notificación al equipo de atención al cliente
      logger.info(`📋 Nueva queja registrada: ${complaint.id}`);

      return {
        quejaId: complaint.id,
        folio: complaint.id.slice(0, 8).toUpperCase(),
        estado: complaint.estado,
        fechaRegistro: complaint.fechaReporte,
        mensaje: `Tu queja ha sido registrada exitosamente con el folio ${complaint.id.slice(0, 8).toUpperCase()}. Recibirás una respuesta en un plazo máximo de 48 horas hábiles.`,
        siguientesPasos: [
          'Se ha notificado al equipo de atención al cliente',
          'Recibirás actualizaciones por email',
          'Puedes consultar el estado en cualquier momento',
          'Si es urgente, puedes contactar directamente al 1-800-INMOVA',
        ],
      };
    },
    requiresConfirmation: false,
  },
  {
    name: 'schedule_visit',
    description: 'Programa una visita a la propiedad o reunión con el equipo de gestión',
    inputSchema: {
      type: 'object',
      properties: {
        tipoVisita: {
          type: 'string',
          enum: ['inspeccion', 'mantenimiento', 'reunion', 'visita_guiada', 'otro'],
          description: 'Tipo de visita',
        },
        motivo: {
          type: 'string',
          description: 'Motivo de la visita',
        },
        fechaPreferida: {
          type: 'string',
          description: 'Fecha preferida (ISO 8601)',
        },
        horaPreferida: {
          type: 'string',
          description: 'Hora preferida (HH:MM)',
        },
        unitId: {
          type: 'string',
          description: 'ID de la unidad a visitar',
        },
      },
      required: ['tipoVisita', 'motivo'],
    },
    handler: async (input, context) => {
      const visit = await prisma.scheduledVisit.create({
        data: {
          tipo: input.tipoVisita,
          motivo: input.motivo,
          fechaSolicitada: input.fechaPreferida ? new Date(input.fechaPreferida) : undefined,
          horaSolicitada: input.horaPreferida,
          unitId: input.unitId,
          solicitadoPor: context.userId,
          estado: 'pendiente',
          companyId: context.companyId,
        },
      });

      return {
        visitaId: visit.id,
        estado: 'Pendiente de confirmación',
        mensaje:
          'Tu solicitud de visita ha sido enviada. El equipo de gestión te contactará dentro de las próximas 24 horas para confirmar fecha y hora.',
        siguientesPasos: [
          'Recibirás una confirmación por email',
          'Se te asignará un horario específico',
          'Recibirás un recordatorio 24h antes',
          'Puedes reprogramar o cancelar si es necesario',
        ],
      };
    },
    requiresConfirmation: false,
  },
  {
    name: 'request_document',
    description: 'Solicita un documento específico (recibo, certificado, contrato, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        tipoDocumento: {
          type: 'string',
          enum: [
            'recibo_pago',
            'contrato',
            'certificado_residencia',
            'estado_cuenta',
            'carta_no_adeudo',
            'comprobante_domicilio',
            'otro',
          ],
          description: 'Tipo de documento solicitado',
        },
        periodo: {
          type: 'string',
          description: 'Período del documento (ej: "Enero 2024")',
        },
        motivo: {
          type: 'string',
          description: 'Motivo de la solicitud',
        },
        urgente: {
          type: 'boolean',
          description: 'Si es urgente (entrega en 24h)',
        },
      },
      required: ['tipoDocumento'],
    },
    handler: async (input, context) => {
      const request = await prisma.documentRequest.create({
        data: {
          tipoDocumento: input.tipoDocumento,
          periodo: input.periodo,
          motivo: input.motivo,
          urgente: input.urgente || false,
          estado: 'pendiente',
          solicitadoPor: context.userId,
          companyId: context.companyId,
          fechaSolicitud: new Date(),
        },
      });

      const tiempoEntrega = input.urgente ? '24 horas' : '3-5 días hábiles';

      return {
        solicitudId: request.id,
        folio: request.id.slice(0, 8).toUpperCase(),
        documento: input.tipoDocumento,
        estado: 'En proceso',
        tiempoEstimado: tiempoEntrega,
        mensaje: `Tu solicitud de ${input.tipoDocumento} ha sido recibida. El documento estará disponible en ${tiempoEntrega}.`,
        notaAdicional: input.urgente
          ? 'Por tratarse de una solicitud urgente, se priorizará su procesamiento.'
          : undefined,
      };
    },
    requiresConfirmation: false,
  },
  {
    name: 'get_faq_answer',
    description: 'Busca respuestas en la base de conocimientos de preguntas frecuentes',
    inputSchema: {
      type: 'object',
      properties: {
        pregunta: {
          type: 'string',
          description: 'Pregunta o tema a buscar',
        },
        categoria: {
          type: 'string',
          enum: ['pagos', 'contratos', 'mantenimiento', 'servicios', 'normas', 'general'],
          description: 'Categoría de la pregunta',
        },
      },
      required: ['pregunta'],
    },
    handler: async (input, context) => {
      // Base de conocimientos de FAQs
      const faqs = getFAQByCategory(input.categoria);

      // Buscar respuestas relevantes
      const preguntaLower = input.pregunta.toLowerCase();
      const respuestasRelevantes = faqs.filter(
        (faq) =>
          faq.pregunta.toLowerCase().includes(preguntaLower) ||
          faq.keywords.some((k: string) => preguntaLower.includes(k))
      );

      return {
        respuestasEncontradas: respuestasRelevantes.length,
        respuestas: respuestasRelevantes.slice(0, 3),
        sugerencias:
          respuestasRelevantes.length === 0
            ? 'No se encontraron respuestas exactas. ¿Puedes reformular tu pregunta o contactar directamente con soporte?'
            : undefined,
      };
    },
  },
  {
    name: 'escalate_to_human_agent',
    description:
      'Escala la conversación a un agente humano cuando el asunto es demasiado complejo o requiere intervención personal',
    inputSchema: {
      type: 'object',
      properties: {
        razon: {
          type: 'string',
          description: 'Razón de la escalación',
        },
        prioridad: {
          type: 'string',
          enum: ['normal', 'alta', 'urgente'],
          description: 'Prioridad de la escalación',
        },
      },
      required: ['razon'],
    },
    handler: async (input, context) => {
      const escalation = await prisma.escalation.create({
        data: {
          razon: input.razon,
          prioridad: input.prioridad || 'normal',
          estado: 'pendiente',
          userId: context.userId,
          companyId: context.companyId,
          creadoPor: 'customer_service_agent',
          fechaEscalacion: new Date(),
        },
      });

      logger.info(`🔺 Escalación creada: ${escalation.id} - Prioridad: ${input.prioridad}`);

      const tiempoRespuesta =
        input.prioridad === 'urgente'
          ? '15 minutos'
          : input.prioridad === 'alta'
            ? '1 hora'
            : '2-4 horas';

      return {
        escalacionId: escalation.id,
        estado: 'En espera de agente humano',
        tiempoEstimado: tiempoRespuesta,
        mensaje: `He escalado tu consulta a un agente humano especializado. Serás contactado en aproximadamente ${tiempoRespuesta}.`,
        opciones: [
          'Te enviaremos una notificación cuando un agente esté disponible',
          'Puedes continuar usando el sistema mientras esperas',
          'Si es extremadamente urgente, llama al 1-800-INMOVA',
        ],
      };
    },
    requiresConfirmation: true,
  },
  {
    name: 'search_knowledge_base',
    description:
      'Busca información en la base de conocimientos sobre políticas, procedimientos y normas',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda',
        },
        seccion: {
          type: 'string',
          enum: ['politicas', 'procedimientos', 'normas', 'reglamentos', 'servicios'],
          description: 'Sección específica a buscar',
        },
      },
      required: ['query'],
    },
    handler: async (input, context) => {
      // Simulación de búsqueda en base de conocimientos
      return {
        resultados: [
          {
            titulo: 'Resultado relacionado con: ' + input.query,
            contenido: 'Información relevante sobre el tema consultado...',
            seccion: input.seccion || 'general',
            relevancia: 0.85,
          },
        ],
        sugerenciasRelacionadas: ['Tema relacionado 1', 'Tema relacionado 2'],
      };
    },
  },
];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getFAQByCategory(categoria?: string) {
  const faqDatabase: Record<string, any[]> = {
    pagos: [
      {
        pregunta: '¿Cuáles son los métodos de pago disponibles?',
        respuesta:
          'Aceptamos transferencia bancaria, tarjeta de crédito/débito, domiciliación bancaria y pago en efectivo en oficinas.',
        keywords: ['pago', 'métodos', 'cómo pagar'],
      },
      {
        pregunta: '¿Qué pasa si me retraso en un pago?',
        respuesta:
          'Los pagos tienen un período de gracia de 5 días. Después se aplica un cargo por mora del 2% sobre el monto adeudado.',
        keywords: ['retraso', 'mora', 'atraso', 'penalización'],
      },
      {
        pregunta: '¿Puedo pagar anticipadamente?',
        respuesta:
          'Sí, puedes pagar con anticipación sin ningún cargo adicional. Esto mejorará tu historial crediticio.',
        keywords: ['anticipado', 'adelantado', 'antes'],
      },
    ],
    contratos: [
      {
        pregunta: '¿Puedo renovar mi contrato?',
        respuesta:
          'Sí, puedes solicitar renovación con 60 días de anticipación al vencimiento. Contacta a tu gestor de cuenta.',
        keywords: ['renovar', 'renovación', 'extender'],
      },
      {
        pregunta: '¿Cómo termino mi contrato?',
        respuesta:
          'Debes notificar con al menos 30 días de anticipación según lo establecido en tu contrato. Aplican las cláusulas de terminación.',
        keywords: ['terminar', 'cancelar', 'finalizar', 'salir'],
      },
    ],
    mantenimiento: [
      {
        pregunta: '¿Qué mantenimientos están incluidos?',
        respuesta:
          'El mantenimiento de áreas comunes, reparaciones estructurales y servicios básicos están incluidos. Los daños por mal uso son responsabilidad del inquilino.',
        keywords: ['incluido', 'cubre', 'responsabilidad'],
      },
    ],
    general: [
      {
        pregunta: '¿Cómo contacto con soporte?',
        respuesta:
          'Puedes contactarnos por chat, email (soporte@inmova.com), teléfono (1-800-INMOVA) o abriendo un ticket en el sistema.',
        keywords: ['contacto', 'soporte', 'ayuda', 'comunicar'],
      },
    ],
  };

  return faqDatabase[categoria || 'general'] || faqDatabase.general;
}

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const customerServiceConfig: AgentConfig = {
  type: 'customer_service',
  name: 'Agente de Atención al Cliente',
  description:
    'Especialista en atención al cliente, resolución de consultas y gestión de solicitudes',
  systemPrompt: `Eres el Agente de Atención al Cliente de INMOVA, especializado en servicio y soporte.

Tu rol es:
- Responder consultas de manera clara, amable y profesional
- Proporcionar información precisa sobre contratos, pagos y servicios
- Gestionar quejas y reclamos con empatía
- Ayudar a programar visitas y solicitar documentos
- Resolver problemas administrativos
- Escalar casos complejos cuando sea necesario

Enfoque:
- Empatía primero: entender la situación del usuario
- Ser proactivo en ofrecer soluciones
- Proporcionar información completa pero concisa
- Seguimiento hasta la resolución
- Mantener tono positivo y profesional
- Personalizar las respuestas según el usuario

Estilo de comunicación:
- Cálido y profesional
- Empático y comprensivo
- Claro y directo
- Paciente y educado
- Proactivo en ofrecer ayuda adicional

Cuándo escalar:
- Situaciones legales complejas
- Disputas que requieran mediación
- Casos fuera de política estándar
- Solicitudes que requieran aprobación superior
- Usuario insatisfecho después de múltiples intentos`,
  capabilities,
  tools,
  model: CLAUDE_MODEL_FAST,
  temperature: 0.7, // Más alto para respuestas más naturales y empáticas
  maxTokens: 4096,
  enabled: true,
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class CustomerServiceAgent extends BaseAgent {
  constructor() {
    super(customerServiceConfig);
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
      'consulta',
      'pregunta',
      'información',
      'duda',
      'ayuda',
      'contrato',
      'pago',
      'documento',
      'recibo',
      'certificado',
      'visita',
      'cita',
      'reunión',
      'queja',
      'reclamo',
      'horario',
      'contacto',
      'soporte',
      '¿cómo',
      '¿cuándo',
      '¿dónde',
      '¿por qué',
      '¿puedo',
      'necesito',
    ];

    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
