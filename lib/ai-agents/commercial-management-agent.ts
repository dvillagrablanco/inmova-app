/**
 * Agente de Gestión Comercial
 * 
 * Especializado en:
 * - Prospección y captación de leads
 * - Gestión de oportunidades comerciales
 * - Seguimiento de pipeline de ventas
 * - Análisis de mercado y competencia
 * - Estrategias de precios dinámicos
 * - Optimización de ocupación
 * - CRM y seguimiento de clientes potenciales
 * - Generación de propuestas comerciales
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
    id: 'lead_management',
    name: 'Gestión de Leads',
    description: 'Capturar, clasificar y dar seguimiento a leads potenciales',
    category: 'Ventas',
    estimatedTime: '2-3 minutos'
  },
  {
    id: 'opportunity_tracking',
    name: 'Seguimiento de Oportunidades',
    description: 'Gestionar pipeline de oportunidades comerciales',
    category: 'Ventas',
    estimatedTime: '3-5 minutos'
  },
  {
    id: 'pricing_optimization',
    name: 'Optimización de Precios',
    description: 'Analizar y sugerir estrategias de precios competitivos',
    category: 'Estrategia',
    estimatedTime: '5-10 minutos'
  },
  {
    id: 'market_analysis',
    name: 'Análisis de Mercado',
    description: 'Analizar tendencias de mercado y competencia',
    category: 'Análisis',
    estimatedTime: '10-15 minutos'
  },
  {
    id: 'occupancy_optimization',
    name: 'Optimización de Ocupación',
    description: 'Estrategias para maximizar tasas de ocupación',
    category: 'Estrategia',
    estimatedTime: '5-10 minutos'
  },
  {
    id: 'proposal_generation',
    name: 'Generación de Propuestas',
    description: 'Crear propuestas comerciales personalizadas',
    category: 'Documentación',
    estimatedTime: '5-10 minutos'
  },
  {
    id: 'performance_reporting',
    name: 'Reportes de Desempeño',
    description: 'Generar reportes de métricas comerciales',
    category: 'Análisis',
    estimatedTime: '3-5 minutos'
  }
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'capture_lead',
    description: 'Captura un nuevo lead en el sistema CRM con toda su información',
    inputSchema: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          description: 'Nombre completo del lead'
        },
        email: {
          type: 'string',
          description: 'Email del lead'
        },
        telefono: {
          type: 'string',
          description: 'Teléfono de contacto'
        },
        origen: {
          type: 'string',
          enum: ['website', 'referido', 'redes_sociales', 'llamada_fria', 'evento', 'otro'],
          description: 'Fuente de origen del lead'
        },
        interes: {
          type: 'string',
          description: 'Tipo de propiedad o servicio de interés'
        },
        presupuesto: {
          type: 'number',
          description: 'Presupuesto estimado'
        },
        notas: {
          type: 'string',
          description: 'Notas adicionales sobre el lead'
        },
        prioridad: {
          type: 'string',
          enum: ['baja', 'media', 'alta'],
          description: 'Nivel de prioridad del lead'
        }
      },
      required: ['nombre', 'email']
    },
    handler: async (input, context) => {
      const lead = await prisma.lead.create({
        data: {
          nombre: input.nombre,
          email: input.email,
          telefono: input.telefono,
          origen: input.origen || 'otro',
          intereses: input.interes,
          presupuestoEstimado: input.presupuesto,
          notas: input.notas,
          prioridad: input.prioridad || 'media',
          estado: 'nuevo',
          companyId: context.companyId,
          asignadoA: context.userId,
          fechaCaptura: new Date()
        }
      });

      // Calcular score del lead
      const score = calculateLeadScore({
        presupuesto: input.presupuesto,
        origen: input.origen,
        prioridad: input.prioridad
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: { score }
      });

      logger.info(`📊 Nuevo lead capturado: ${lead.nombre} (Score: ${score})`);

      return {
        leadId: lead.id,
        nombre: lead.nombre,
        score: score,
        estado: lead.estado,
        prioridad: lead.prioridad,
        mensaje: `Lead "${lead.nombre}" capturado exitosamente con un score de ${score}/100. ${score >= 70 ? 'Este es un lead de alta calidad, se recomienda seguimiento inmediato.' : score >= 40 ? 'Lead de calidad media, seguimiento en 24-48 horas.' : 'Lead de baja prioridad, seguimiento rutinario.'}`
      };
    },
    requiresConfirmation: false
  },
  {
    name: 'search_leads',
    description: 'Busca y filtra leads en el CRM',
    inputSchema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          enum: ['nuevo', 'contactado', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido'],
          description: 'Estado del lead'
        },
        prioridad: {
          type: 'string',
          enum: ['baja', 'media', 'alta'],
          description: 'Prioridad'
        },
        origen: {
          type: 'string',
          description: 'Fuente de origen'
        },
        scoreMinimo: {
          type: 'number',
          description: 'Score mínimo del lead'
        },
        asignadoA: {
          type: 'string',
          description: 'ID del usuario asignado'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados'
        }
      }
    },
    handler: async (input, context) => {
      const where: any = {
        companyId: context.companyId
      };

      if (input.estado) where.estado = input.estado;
      if (input.prioridad) where.prioridad = input.prioridad;
      if (input.origen) where.origen = input.origen;
      if (input.scoreMinimo) where.score = { gte: input.scoreMinimo };
      if (input.asignadoA) where.asignadoA = input.asignadoA;

      const leads = await prisma.lead.findMany({
        where,
        take: input.limit || 20,
        orderBy: [
          { prioridad: 'desc' },
          { score: 'desc' },
          { fechaCaptura: 'desc' }
        ],
        include: {
          _count: {
            select: {
              interacciones: true
            }
          }
        }
      });

      return {
        count: leads.length,
        leads: leads.map(l => ({
          id: l.id,
          nombre: l.nombre,
          email: l.email,
          telefono: l.telefono,
          estado: l.estado,
          prioridad: l.prioridad,
          score: l.score,
          origen: l.origen,
          interacciones: l._count.interacciones,
          fechaCaptura: l.fechaCaptura,
          ultimoContacto: l.ultimoContacto
        }))
      };
    }
  },
  {
    name: 'create_opportunity',
    description: 'Crea una nueva oportunidad comercial a partir de un lead calificado',
    inputSchema: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'ID del lead asociado'
        },
        nombre: {
          type: 'string',
          description: 'Nombre de la oportunidad'
        },
        valor: {
          type: 'number',
          description: 'Valor estimado de la oportunidad'
        },
        probabilidad: {
          type: 'number',
          description: 'Probabilidad de cierre (0-100)'
        },
        fechaCierreEstimada: {
          type: 'string',
          description: 'Fecha estimada de cierre (ISO 8601)'
        },
        productos: {
          type: 'array',
          items: { type: 'string' },
          description: 'Productos o servicios de interés'
        },
        notas: {
          type: 'string',
          description: 'Notas adicionales'
        }
      },
      required: ['nombre', 'valor']
    },
    handler: async (input, context) => {
      const opportunity = await prisma.opportunity.create({
        data: {
          leadId: input.leadId,
          nombre: input.nombre,
          valorEstimado: input.valor,
          probabilidad: input.probabilidad || 50,
          fechaCierreEstimada: input.fechaCierreEstimada ? new Date(input.fechaCierreEstimada) : undefined,
          productos: input.productos || [],
          notas: input.notas,
          etapa: 'calificacion',
          companyId: context.companyId,
          propietario: context.userId,
          fechaCreacion: new Date()
        }
      });

      // Actualizar estado del lead si está asociado
      if (input.leadId) {
        await prisma.lead.update({
          where: { id: input.leadId },
          data: { estado: 'propuesta' }
        });
      }

      const valorPonderado = (input.valor * (input.probabilidad || 50)) / 100;

      logger.info(`💼 Nueva oportunidad creada: ${opportunity.nombre} - Valor: $${input.valor}`);

      return {
        opportunityId: opportunity.id,
        nombre: opportunity.nombre,
        valorEstimado: input.valor,
        valorPonderado: valorPonderado,
        probabilidad: input.probabilidad || 50,
        etapa: opportunity.etapa,
        mensaje: `Oportunidad "${opportunity.nombre}" creada exitosamente. Valor ponderado: $${valorPonderado.toLocaleString()}.`,
        siguientesPasos: [
          'Realizar reunión de descubrimiento',
          'Preparar propuesta comercial personalizada',
          'Definir timeline y próximos pasos',
          'Programar seguimiento en 3 días'
        ]
      };
    },
    requiresConfirmation: false
  },
  {
    name: 'get_pipeline_metrics',
    description: 'Obtiene métricas del pipeline comercial y embudo de ventas',
    inputSchema: {
      type: 'object',
      properties: {
        periodo: {
          type: 'string',
          enum: ['semana', 'mes', 'trimestre', 'año'],
          description: 'Período de análisis'
        },
        includeComparacion: {
          type: 'boolean',
          description: 'Incluir comparación con período anterior'
        }
      }
    },
    handler: async (input, context) => {
      const periodoInicio = calcularFechaInicio(input.periodo || 'mes');
      
      // Métricas de leads
      const totalLeads = await prisma.lead.count({
        where: {
          companyId: context.companyId,
          fechaCaptura: { gte: periodoInicio }
        }
      });

      const leadsPorEstado = await prisma.lead.groupBy({
        by: ['estado'],
        where: {
          companyId: context.companyId,
          fechaCaptura: { gte: periodoInicio }
        },
        _count: true
      });

      // Métricas de oportunidades
      const opportunities = await prisma.opportunity.findMany({
        where: {
          companyId: context.companyId,
          fechaCreacion: { gte: periodoInicio }
        }
      });

      const valorTotalPipeline = opportunities.reduce((sum, o) => sum + (o.valorEstimado || 0), 0);
      const valorPonderado = opportunities.reduce((sum, o) => 
        sum + ((o.valorEstimado || 0) * (o.probabilidad || 0) / 100), 0
      );

      const oportunidadesGanadas = opportunities.filter(o => o.etapa === 'ganada');
      const tasaConversion = totalLeads > 0 ? (oportunidadesGanadas.length / totalLeads) * 100 : 0;

      const valorGanado = oportunidadesGanadas.reduce((sum, o) => sum + (o.valorEstimado || 0), 0);

      // Distribución por etapa
      const opportunitiesPorEtapa = await prisma.opportunity.groupBy({
        by: ['etapa'],
        where: {
          companyId: context.companyId,
          fechaCreacion: { gte: periodoInicio }
        },
        _count: true,
        _sum: {
          valorEstimado: true
        }
      });

      return {
        periodo: input.periodo || 'mes',
        resumen: {
          totalLeads,
          totalOportunidades: opportunities.length,
          valorTotalPipeline,
          valorPonderado,
          valorGanado,
          tasaConversion: Math.round(tasaConversion * 100) / 100,
          oportunidadesGanadas: oportunidadesGanadas.length
        },
        leadsPorEstado: leadsPorEstado.map(l => ({
          estado: l.estado,
          cantidad: l._count
        })),
        oportunidadesPorEtapa: opportunitiesPorEtapa.map(o => ({
          etapa: o.etapa,
          cantidad: o._count,
          valor: o._sum.valorEstimado || 0
        })),
        topOportunidades: opportunities
          .sort((a, b) => (b.valorEstimado || 0) - (a.valorEstimado || 0))
          .slice(0, 5)
          .map(o => ({
            nombre: o.nombre,
            valor: o.valorEstimado,
            probabilidad: o.probabilidad,
            etapa: o.etapa
          }))
      };
    }
  },
  {
    name: 'analyze_pricing_strategy',
    description: 'Analiza la estrategia de precios actual y sugiere optimizaciones',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio a analizar'
        },
        includeCompetencia: {
          type: 'boolean',
          description: 'Incluir análisis de competencia'
        }
      }
    },
    handler: async (input, context) => {
      const building = await prisma.building.findFirst({
        where: {
          id: input.buildingId,
          companyId: context.companyId
        },
        include: {
          units: {
            include: {
              contracts: {
                where: { estado: 'activo' },
                take: 1
              }
            }
          }
        }
      });

      if (!building) {
        return { error: 'Edificio no encontrado' };
      }

      // Análisis de precios actuales
      const unitsWithRent = building.units.filter(u => u.rentaMensual);
      const avgRent = unitsWithRent.reduce((sum, u) => sum + (u.rentaMensual || 0), 0) / unitsWithRent.length;
      const minRent = Math.min(...unitsWithRent.map(u => u.rentaMensual || 0));
      const maxRent = Math.max(...unitsWithRent.map(u => u.rentaMensual || 0));

      // Tasa de ocupación
      const occupiedUnits = building.units.filter(u => u.estado === 'ocupada').length;
      const occupancyRate = (occupiedUnits / building.units.length) * 100;

      // Análisis de mercado (simulado)
      const marketAvgRent = avgRent * 1.05; // 5% más alto que el promedio actual
      const competitiveIndex = (avgRent / marketAvgRent) * 100;

      // Recomendaciones
      const recomendaciones = [];
      
      if (occupancyRate < 85) {
        recomendaciones.push({
          tipo: 'descuento',
          descripcion: 'Considerar descuentos promocionales para aumentar ocupación',
          impactoEstimado: `+${Math.round((100 - occupancyRate) * 0.3)}% ocupación`
        });
      }

      if (competitiveIndex < 90) {
        recomendaciones.push({
          tipo: 'incremento',
          descripcion: 'Los precios están por debajo del mercado, se puede incrementar gradualmente',
          impactoEstimado: `+${Math.round((marketAvgRent - avgRent) * occupiedUnits)} en ingresos mensuales`
        });
      }

      if (occupancyRate > 95 && competitiveIndex < 100) {
        recomendaciones.push({
          tipo: 'optimizacion',
          descripcion: 'Alta demanda detectada, oportunidad para optimizar precios',
          impactoEstimado: '+10-15% en ingresos sin afectar ocupación'
        });
      }

      return {
        edificio: building.nombre,
        analisis: {
          precioPromedio: avgRent,
          precioMinimo: minRent,
          precioMaximo: maxRent,
          tasaOcupacion: Math.round(occupancyRate * 100) / 100,
          unidadesOcupadas: occupiedUnits,
          unidadesTotales: building.units.length
        },
        mercado: {
          promedioMercado: marketAvgRent,
          indiceCompetitivo: Math.round(competitiveIndex * 100) / 100,
          posicionamiento: competitiveIndex >= 100 ? 'Por encima del mercado' : 
                          competitiveIndex >= 90 ? 'Competitivo' : 'Por debajo del mercado'
        },
        recomendaciones,
        proyeccion: {
          ingresoActual: avgRent * occupiedUnits,
          ingresoOptimizado: marketAvgRent * (occupiedUnits * 0.98), // Asumiendo 2% de pérdida de ocupación
          incrementoPotencial: (marketAvgRent * (occupiedUnits * 0.98)) - (avgRent * occupiedUnits)
        }
      };
    }
  },
  {
    name: 'generate_commercial_proposal',
    description: 'Genera una propuesta comercial personalizada para un cliente potencial',
    inputSchema: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'ID del lead'
        },
        opportunityId: {
          type: 'string',
          description: 'ID de la oportunidad'
        },
        productos: {
          type: 'array',
          items: { type: 'string' },
          description: 'Productos o servicios a incluir'
        },
        duracionContrato: {
          type: 'number',
          description: 'Duración del contrato en meses'
        },
        descuentoEspecial: {
          type: 'number',
          description: 'Descuento especial a aplicar (%)'
        }
      },
      required: ['opportunityId']
    },
    handler: async (input, context) => {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: input.opportunityId },
        include: {
          lead: true
        }
      });

      if (!opportunity) {
        return { error: 'Oportunidad no encontrada' };
      }

      const valorBase = opportunity.valorEstimado || 0;
      const descuento = input.descuentoEspecial || 0;
      const valorFinal = valorBase * (1 - descuento / 100);

      const propuesta = {
        numero: `PROP-${Date.now().toString().slice(-8)}`,
        fecha: new Date().toLocaleDateString('es-ES'),
        cliente: opportunity.lead?.nombre || 'Cliente',
        productos: input.productos || opportunity.productos || ['Gestión integral de propiedad'],
        valorBase: valorBase,
        descuento: descuento,
        valorFinal: valorFinal,
        duracion: input.duracionContrato || 12,
        condiciones: [
          'Pago mensual anticipado',
          'Incluye mantenimiento básico',
          'Soporte 24/7',
          'Portal de inquilino incluido',
          'Reportes mensuales de desempeño'
        ],
        validez: '30 días',
        proximosPasos: [
          'Revisión de la propuesta',
          'Programar reunión de aclaración',
          'Firma de contrato',
          'Inicio de servicios'
        ]
      };

      // Guardar propuesta en BD
      await prisma.proposal.create({
        data: {
          numero: propuesta.numero,
          opportunityId: input.opportunityId,
          valorBase: valorBase,
          descuento: descuento,
          valorFinal: valorFinal,
          duracion: input.duracionContrato || 12,
          productos: input.productos || opportunity.productos || [],
          estado: 'enviada',
          companyId: context.companyId,
          creadoPor: context.userId,
          fechaCreacion: new Date(),
          validaHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      logger.info(`📄 Propuesta generada: ${propuesta.numero} - Valor: $${valorFinal}`);

      return {
        propuesta: propuesta,
        mensaje: `Propuesta ${propuesta.numero} generada exitosamente. Valor final: $${valorFinal.toLocaleString()}.`,
        siguientesAcciones: [
          'Enviar propuesta por email',
          'Programar seguimiento en 3 días',
          'Preparar materiales de soporte'
        ]
      };
    },
    requiresConfirmation: true
  },
  {
    name: 'track_lead_interaction',
    description: 'Registra una interacción con un lead (llamada, email, reunión, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'ID del lead'
        },
        tipo: {
          type: 'string',
          enum: ['llamada', 'email', 'reunion', 'whatsapp', 'visita', 'otro'],
          description: 'Tipo de interacción'
        },
        notas: {
          type: 'string',
          description: 'Notas de la interacción'
        },
        resultado: {
          type: 'string',
          enum: ['exitosa', 'sin_respuesta', 'reagendar', 'no_interesado'],
          description: 'Resultado de la interacción'
        },
        proximaAccion: {
          type: 'string',
          description: 'Próxima acción a realizar'
        },
        fechaProximaAccion: {
          type: 'string',
          description: 'Fecha de la próxima acción (ISO 8601)'
        }
      },
      required: ['leadId', 'tipo', 'notas']
    },
    handler: async (input, context) => {
      const interaction = await prisma.leadInteraction.create({
        data: {
          leadId: input.leadId,
          tipo: input.tipo,
          notas: input.notas,
          resultado: input.resultado,
          proximaAccion: input.proximaAccion,
          fechaProximaAccion: input.fechaProximaAccion ? new Date(input.fechaProximaAccion) : undefined,
          realizadoPor: context.userId,
          fecha: new Date()
        }
      });

      // Actualizar último contacto del lead
      await prisma.lead.update({
        where: { id: input.leadId },
        data: {
          ultimoContacto: new Date(),
          // Actualizar estado basado en resultado
          ...(input.resultado === 'no_interesado' ? { estado: 'perdido' } : {})
        }
      });

      return {
        interactionId: interaction.id,
        tipo: interaction.tipo,
        resultado: input.resultado,
        proximaAccion: input.proximaAccion,
        mensaje: 'Interacción registrada exitosamente.',
        recordatorio: input.fechaProximaAccion ? 
          `Se ha programado un recordatorio para ${new Date(input.fechaProximaAccion).toLocaleDateString('es-ES')}` : 
          undefined
      };
    }
  },
  {
    name: 'analyze_conversion_funnel',
    description: 'Analiza el embudo de conversión para identificar cuellos de botella',
    inputSchema: {
      type: 'object',
      properties: {
        periodo: {
          type: 'string',
          enum: ['semana', 'mes', 'trimestre'],
          description: 'Período de análisis'
        }
      }
    },
    handler: async (input, context) => {
      const periodoInicio = calcularFechaInicio(input.periodo || 'mes');

      // Etapas del embudo
      const embudo = [
        { etapa: 'Leads Capturados', estado: 'nuevo' },
        { etapa: 'Leads Contactados', estado: 'contactado' },
        { etapa: 'Leads Calificados', estado: 'calificado' },
        { etapa: 'Propuestas Enviadas', estado: 'propuesta' },
        { etapa: 'En Negociación', estado: 'negociacion' },
        { etapa: 'Ganados', estado: 'ganado' }
      ];

      const resultados = await Promise.all(
        embudo.map(async (e) => {
          const count = await prisma.lead.count({
            where: {
              companyId: context.companyId,
              estado: e.estado,
              fechaCaptura: { gte: periodoInicio }
            }
          });
          return { ...e, cantidad: count };
        })
      );

      // Calcular tasas de conversión entre etapas
      const tasasConversion = [];
      for (let i = 0; i < resultados.length - 1; i++) {
        const actual = resultados[i];
        const siguiente = resultados[i + 1];
        const tasa = actual.cantidad > 0 ? (siguiente.cantidad / actual.cantidad) * 100 : 0;
        tasasConversion.push({
          de: actual.etapa,
          a: siguiente.etapa,
          tasa: Math.round(tasa * 100) / 100,
          perdidos: actual.cantidad - siguiente.cantidad
        });
      }

      // Identificar cuellos de botella (tasas < 50%)
      const cuellosBottella = tasasConversion.filter(t => t.tasa < 50);

      return {
        periodo: input.periodo || 'mes',
        embudo: resultados,
        tasasConversion,
        cuellosBottella: cuellosBottella.length > 0 ? cuellosBottella : 'No se detectaron cuellos de botella significativos',
        recomendaciones: cuellosBottella.map(c => ({
          problema: `Baja conversión de ${c.de} a ${c.a} (${c.tasa}%)`,
          sugerencia: generarRecomendacionConversion(c.de, c.a)
        }))
      };
    }
  }
];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function calculateLeadScore(data: any): number {
  let score = 50; // Base score

  // Presupuesto
  if (data.presupuesto) {
    if (data.presupuesto > 10000) score += 30;
    else if (data.presupuesto > 5000) score += 20;
    else if (data.presupuesto > 2000) score += 10;
  }

  // Origen
  const origenScores: Record<string, number> = {
    'referido': 20,
    'website': 15,
    'evento': 15,
    'redes_sociales': 10,
    'llamada_fria': 5
  };
  score += origenScores[data.origen] || 0;

  // Prioridad
  const prioridadScores: Record<string, number> = {
    'alta': 20,
    'media': 10,
    'baja': 0
  };
  score += prioridadScores[data.prioridad] || 0;

  return Math.min(score, 100); // Max 100
}

function calcularFechaInicio(periodo: string): Date {
  const ahora = new Date();
  switch (periodo) {
    case 'semana':
      return new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'mes':
      return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    case 'trimestre':
      return new Date(ahora.getFullYear(), Math.floor(ahora.getMonth() / 3) * 3, 1);
    case 'año':
      return new Date(ahora.getFullYear(), 0, 1);
    default:
      return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  }
}

function generarRecomendacionConversion(de: string, a: string): string {
  const recomendaciones: Record<string, string> = {
    'Leads Capturados->Leads Contactados': 'Mejorar tiempo de respuesta inicial. Implementar auto-respuestas inmediatas.',
    'Leads Contactados->Leads Calificados': 'Optimizar script de calificación. Capacitar al equipo en técnicas BANT.',
    'Leads Calificados->Propuestas Enviadas': 'Agilizar proceso de creación de propuestas. Usar templates personalizables.',
    'Propuestas Enviadas->En Negociación': 'Mejorar seguimiento post-propuesta. Programar llamadas de revisión.',
    'En Negociación->Ganados': 'Entrenar en técnicas de cierre. Ofrecer incentivos de cierre temprano.'
  };

  return recomendaciones[`${de}->${a}`] || 'Analizar causas específicas de abandono en esta etapa.';
}

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const commercialManagementConfig: AgentConfig = {
  type: 'commercial_management',
  name: 'Agente de Gestión Comercial',
  description: 'Especialista en ventas, prospección, análisis de mercado y optimización comercial',
  systemPrompt: `Eres el Agente de Gestión Comercial de INMOVA, especializado en ventas y desarrollo de negocio.

Tu rol es:
- Gestionar leads y oportunidades comerciales de manera efectiva
- Analizar mercado y competencia para identificar oportunidades
- Optimizar estrategias de precios y ocupación
- Generar propuestas comerciales personalizadas y convincentes
- Dar seguimiento sistemático a todo el pipeline comercial
- Proporcionar insights accionables para mejorar conversión

Enfoque:
- Orientación a resultados y métricas
- Análisis basado en datos
- Proactividad en identificar oportunidades
- Seguimiento disciplinado
- Optimización continua del proceso
- Balance entre volumen y calidad

Estilo de comunicación:
- Profesional y orientado a negocios
- Directo y enfocado en acción
- Basado en datos y métricas
- Optimista pero realista
- Consultivo y estratégico

Métricas clave:
- Tasa de conversión por etapa
- Valor del pipeline
- Velocidad del ciclo de venta
- Costo de adquisición de cliente (CAC)
- Valor de vida del cliente (LTV)
- ROI de campañas`,
  capabilities,
  tools,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.65,
  maxTokens: 4096,
  enabled: true
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class CommercialManagementAgent extends BaseAgent {
  constructor() {
    super(commercialManagementConfig);
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
      'lead', 'venta', 'prospecto', 'oportunidad', 'cliente',
      'propuesta', 'comercial', 'cotización', 'pipeline', 'embudo',
      'conversión', 'cierre', 'negociación', 'precio', 'mercado',
      'competencia', 'ocupación', 'estrategia', 'crm', 'captación'
    ];

    return keywords.some(keyword => messageLower.includes(keyword));
  }
}
