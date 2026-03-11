// @ts-nocheck
import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
/**
 * Agente de Legal y Cumplimiento
 *
 * Especializado en:
 * - Revisión de contratos y cláusulas
 * - Cumplimiento normativo (GDPR, LOPD, etc.)
 * - Gestión de disputas y mediación
 * - Alertas de vencimientos legales
 * - Documentación legal
 * - Políticas y procedimientos
 * - Auditoría de cumplimiento
 * - Asesoramiento legal básico
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
    id: 'contract_review',
    name: 'Revisión de Contratos',
    description: 'Revisar contratos y identificar cláusulas importantes',
    category: 'Legal',
    estimatedTime: '10-15 minutos',
  },
  {
    id: 'compliance_monitoring',
    name: 'Monitoreo de Cumplimiento',
    description: 'Verificar cumplimiento de regulaciones vigentes',
    category: 'Cumplimiento',
    estimatedTime: '5-10 minutos',
  },
  {
    id: 'dispute_management',
    name: 'Gestión de Disputas',
    description: 'Registrar y dar seguimiento a disputas legales',
    category: 'Legal',
    estimatedTime: '10 minutos',
  },
  {
    id: 'legal_alerts',
    name: 'Alertas Legales',
    description: 'Monitorear vencimientos y obligaciones legales',
    category: 'Monitoreo',
    estimatedTime: '2-3 minutos',
  },
  {
    id: 'document_generation',
    name: 'Generación de Documentos',
    description: 'Generar documentos legales estándar',
    category: 'Documentación',
    estimatedTime: '5-10 minutos',
  },
  {
    id: 'policy_guidance',
    name: 'Guía de Políticas',
    description: 'Proporcionar orientación sobre políticas y procedimientos',
    category: 'Asesoría',
    estimatedTime: '3-5 minutos',
  },
  {
    id: 'compliance_audit',
    name: 'Auditoría de Cumplimiento',
    description: 'Realizar auditorías de cumplimiento normativo',
    category: 'Auditoría',
    estimatedTime: '15-30 minutos',
  },
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'review_contract',
    description:
      'Revisa un contrato de arrendamiento identificando cláusulas importantes, riesgos y recomendaciones',
    inputSchema: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'ID del contrato a revisar',
        },
        focusAreas: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'clausulas_riesgo',
              'cumplimiento',
              'terminacion',
              'responsabilidades',
              'general',
            ],
          },
          description: 'Áreas específicas a revisar',
        },
      },
      required: ['contractId'],
    },
    handler: async (input, context) => {
      const contract = await prisma.contract.findFirst({
        where: {
          id: input.contractId,
          unit: {
            building: {
              companyId: context.companyId,
            },
          },
        },
        include: {
          tenant: true,
          unit: {
            include: {
              building: true,
            },
          },
        },
      });

      if (!contract) {
        return { error: 'Contrato no encontrado' };
      }

      // Análisis de cláusulas clave
      const analisis = {
        contratoId: contract.id,
        inquilino: contract.tenant.nombreCompleto,
        propiedad: `${contract.unit.building.nombre} - ${contract.unit.numero}`,
        estado: contract.estado,
        vigencia: {
          inicio: contract.fechaInicio,
          fin: contract.fechaFin,
          diasRestantes: Math.ceil(
            (new Date(contract.fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        },
        terminos: {
          rentaMensual: contract.rentaMensual,
          deposito: contract.deposito,
          duracionMeses: Math.ceil(
            (new Date(contract.fechaFin).getTime() - new Date(contract.fechaInicio).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          ),
        },
      };

      // Identificar posibles riesgos
      const riesgos: any[] = [];

      // Riesgo: Contrato próximo a vencer
      if (analisis.vigencia.diasRestantes < 60 && analisis.vigencia.diasRestantes > 0) {
        riesgos.push({
          tipo: 'vencimiento_proximo',
          nivel: 'medio',
          descripcion: `Contrato vence en ${analisis.vigencia.diasRestantes} días`,
          accion: 'Iniciar proceso de renovación o búsqueda de nuevo inquilino',
        });
      }

      // Riesgo: Falta de cláusulas especiales
      if (!contract.clausulasEspeciales || contract.clausulasEspeciales.length < 50) {
        riesgos.push({
          tipo: 'clausulas_incompletas',
          nivel: 'bajo',
          descripcion: 'Contrato podría carecer de cláusulas específicas importantes',
          accion: 'Revisar y añadir cláusulas según sea necesario',
        });
      }

      // Verificación de cumplimiento
      const cumplimiento = verificarCumplimientoContrato(contract);

      // Recomendaciones
      const recomendaciones = generarRecomendacionesContrato(contract, riesgos);

      return {
        analisis,
        riesgos,
        cumplimiento,
        recomendaciones,
        checklistLegal: [
          {
            item: 'Identificación de partes completa',
            cumple: !!contract.tenant.nombreCompleto,
            importancia: 'alta',
          },
          {
            item: 'Términos financieros claros',
            cumple: !!contract.rentaMensual,
            importancia: 'alta',
          },
          {
            item: 'Fechas de vigencia definidas',
            cumple: !!contract.fechaInicio && !!contract.fechaFin,
            importancia: 'alta',
          },
          {
            item: 'Cláusulas especiales documentadas',
            cumple: !!contract.clausulasEspeciales,
            importancia: 'media',
          },
          {
            item: 'Depósito de garantía registrado',
            cumple: !!contract.deposito,
            importancia: 'alta',
          },
        ],
      };
    },
  },
  {
    name: 'check_compliance_status',
    description: 'Verifica el estado de cumplimiento normativo de la empresa o propiedad',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio (opcional)',
        },
        regulaciones: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'gdpr',
              'lopd',
              'lau',
              'habitabilidad',
              'seguridad',
              'accesibilidad',
              'medio_ambiente',
            ],
          },
          description: 'Regulaciones específicas a verificar',
        },
      },
    },
    handler: async (input, context) => {
      const regulacionesCheck = input.regulaciones || ['gdpr', 'lau', 'habitabilidad', 'seguridad'];

      const resultados = regulacionesCheck.map((reg) => {
        const check = verificarRegulacion(reg, context.companyId, input.buildingId);
        return check;
      });

      const cumplimientoGeneral =
        (resultados.filter((r) => r.cumple).length / resultados.length) * 100;
      const criticos = resultados.filter((r) => !r.cumple && r.criticidad === 'alta');

      return {
        resumen: {
          porcentajeCumplimiento: Math.round(cumplimientoGeneral * 100) / 100,
          totalVerificaciones: resultados.length,
          cumpliendo: resultados.filter((r) => r.cumple).length,
          incumplimientos: resultados.filter((r) => !r.cumple).length,
          criticos: criticos.length,
        },
        detalleRegulaciones: resultados,
        accionesRequeridas: criticos.map((c) => ({
          regulacion: c.regulacion,
          descripcion: c.descripcion,
          plazo: c.plazoCorreccion,
          consecuencias: c.consecuencias,
        })),
        certificaciones: {
          habitabilidad: 'Vigente hasta 2025-06-30',
          seguridad: 'Vigente hasta 2024-12-31',
          accesibilidad: 'En proceso de renovación',
        },
        proximosVencimientos: [
          { certificado: 'Certificado Energético', vencimiento: '2024-12-31', diasRestantes: 120 },
          { certificado: 'Inspección ITE', vencimiento: '2025-03-15', diasRestantes: 200 },
        ],
      };
    },
  },
  {
    name: 'create_legal_dispute',
    description: 'Registra una disputa o conflicto legal que requiere seguimiento',
    inputSchema: {
      type: 'object',
      properties: {
        titulo: {
          type: 'string',
          description: 'Título de la disputa',
        },
        descripcion: {
          type: 'string',
          description: 'Descripción detallada',
        },
        tipo: {
          type: 'string',
          enum: ['inquilino', 'proveedor', 'vecino', 'administracion', 'otro'],
          description: 'Tipo de disputa',
        },
        parteContraria: {
          type: 'string',
          description: 'Nombre de la parte contraria',
        },
        contratoId: {
          type: 'string',
          description: 'ID del contrato relacionado',
        },
        montoDisputa: {
          type: 'number',
          description: 'Monto en disputa',
        },
        urgente: {
          type: 'boolean',
          description: 'Si requiere atención urgente',
        },
      },
      required: ['titulo', 'descripcion', 'tipo'],
    },
    handler: async (input, context) => {
      const dispute = await prisma.legalDispute.create({
        data: {
          titulo: input.titulo,
          descripcion: input.descripcion,
          tipo: input.tipo,
          parteContraria: input.parteContraria,
          contratoId: input.contratoId,
          montoDisputa: input.montoDisputa,
          estado: 'abierta',
          prioridad: input.urgente ? 'urgente' : 'media',
          companyId: context.companyId,
          registradoPor: context.userId,
          fechaRegistro: new Date(),
        },
      });

      // Evaluar necesidad de asesoría legal externa
      const requiereAbogado = evaluarNecesidadAbogado(input);

      logger.warn(`⚖️ Nueva disputa legal registrada: ${dispute.id} - Tipo: ${input.tipo}`);

      return {
        disputaId: dispute.id,
        folio: dispute.id.slice(0, 8).toUpperCase(),
        estado: 'Registrada',
        prioridad: dispute.prioridad,
        requiereAbogado: requiereAbogado.necesario,
        razonAbogado: requiereAbogado.razon,
        proximosPasos: [
          'Recopilar toda la documentación relevante',
          'Intentar resolución amistosa primero',
          requiereAbogado.necesario
            ? 'Contactar con asesoría legal externa'
            : 'Seguimiento interno por 30 días',
          'Documentar todas las comunicaciones',
        ],
        plazosLegales: obtenerPlazosLegales(input.tipo),
        mensaje: `Disputa ${dispute.id.slice(0, 8).toUpperCase()} registrada exitosamente. ${requiereAbogado.necesario ? '⚠️ Se recomienda consulta legal externa.' : 'Se intentará resolución interna.'}`,
      };
    },
    requiresConfirmation: false,
  },
  {
    name: 'get_legal_alerts',
    description: 'Obtiene alertas de vencimientos legales, obligaciones y fechas importantes',
    inputSchema: {
      type: 'object',
      properties: {
        diasAnticipacion: {
          type: 'number',
          description: 'Días de anticipación para alertas (por defecto 60)',
        },
        tipo: {
          type: 'string',
          enum: ['contratos', 'certificaciones', 'plazos_legales', 'todos'],
          description: 'Tipo de alertas',
        },
      },
    },
    handler: async (input, context) => {
      const dias = input.diasAnticipacion || 60;
      const fechaLimite = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

      const alertas: any[] = [];

      // Alertas de contratos próximos a vencer
      if (!input.tipo || input.tipo === 'contratos' || input.tipo === 'todos') {
        const contratosVenciendo = await prisma.contract.findMany({
          where: {
            unit: {
              building: {
                companyId: context.companyId,
              },
            },
            estado: 'activo',
            fechaFin: {
              gte: new Date(),
              lte: fechaLimite,
            },
          },
          include: {
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
        });

        contratosVenciendo.forEach((c) => {
          const diasRestantes = Math.ceil(
            (new Date(c.fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          alertas.push({
            tipo: 'contrato_vencimiento',
            criticidad: diasRestantes < 30 ? 'alta' : 'media',
            titulo: `Contrato próximo a vencer`,
            descripcion: `Contrato de ${c.tenant.nombreCompleto} vence en ${diasRestantes} días`,
            detalles: {
              contratoId: c.id,
              inquilino: c.tenant.nombreCompleto,
              propiedad: `${c.unit.building.nombre} - ${c.unit.numero}`,
              fechaVencimiento: c.fechaFin,
              diasRestantes,
            },
            accionRequerida: 'Contactar inquilino para renovación o notificación de no renovación',
            plazoAccion: '15 días',
          });
        });
      }

      // Alertas de disputas activas
      const disputasActivas = await prisma.legalDispute.findMany({
        where: {
          companyId: context.companyId,
          estado: { not: 'resuelta' },
        },
        orderBy: { fechaRegistro: 'desc' },
        take: 10,
      });

      disputasActivas.forEach((d) => {
        const diasDesdeRegistro = Math.ceil(
          (Date.now() - d.fechaRegistro.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diasDesdeRegistro > 30) {
          alertas.push({
            tipo: 'disputa_pendiente',
            criticidad: diasDesdeRegistro > 60 ? 'alta' : 'media',
            titulo: 'Disputa sin resolver',
            descripcion: `Disputa pendiente desde hace ${diasDesdeRegistro} días`,
            detalles: {
              disputaId: d.id,
              tipo: d.tipo,
              diasAbierta: diasDesdeRegistro,
            },
            accionRequerida: 'Revisar estado y tomar acción',
            plazoAccion: 'Inmediato',
          });
        }
      });

      // Alertas de certificaciones (simuladas)
      if (!input.tipo || input.tipo === 'certificaciones' || input.tipo === 'todos') {
        alertas.push({
          tipo: 'certificacion',
          criticidad: 'media',
          titulo: 'Renovación de Certificado Energético',
          descripcion: 'El certificado energético requiere renovación',
          detalles: {
            certificado: 'Certificado de Eficiencia Energética',
            vencimiento: '2024-12-31',
            diasRestantes: 120,
          },
          accionRequerida: 'Programar inspección y renovación',
          plazoAccion: '60 días',
        });
      }

      // Ordenar por criticidad
      const ordenPrioridad = { alta: 3, media: 2, baja: 1 };
      alertas.sort(
        (a, b) =>
          ordenPrioridad[b.criticidad as keyof typeof ordenPrioridad] -
          ordenPrioridad[a.criticidad as keyof typeof ordenPrioridad]
      );

      return {
        totalAlertas: alertas.length,
        alertasCriticas: alertas.filter((a) => a.criticidad === 'alta').length,
        alertas: alertas.slice(0, 20),
        resumenPorTipo: alertas.reduce((acc: any, a) => {
          acc[a.tipo] = (acc[a.tipo] || 0) + 1;
          return acc;
        }, {}),
        recomendacion:
          alertas.length > 10
            ? 'Alto número de alertas pendientes. Se recomienda revisar y priorizar acciones.'
            : alertas.length > 0
              ? 'Algunas alertas requieren atención. Revisa las acciones recomendadas.'
              : 'Sin alertas legales pendientes en este momento.',
      };
    },
  },
  {
    name: 'generate_legal_document',
    description: 'Genera documentos legales estándar basados en templates',
    inputSchema: {
      type: 'object',
      properties: {
        tipoDocumento: {
          type: 'string',
          enum: [
            'notificacion_desahucio',
            'requerimiento_pago',
            'carta_preaviso',
            'finiquito',
            'certificado_no_adeudo',
            'addendum_contrato',
          ],
          description: 'Tipo de documento a generar',
        },
        contratoId: {
          type: 'string',
          description: 'ID del contrato relacionado',
        },
        parametros: {
          type: 'object',
          description: 'Parámetros específicos del documento',
        },
      },
      required: ['tipoDocumento'],
    },
    handler: async (input, context) => {
      const template = obtenerTemplate(input.tipoDocumento);

      let datosContrato = null;
      if (input.contratoId) {
        const contract = await prisma.contract.findFirst({
          where: { id: input.contratoId },
          include: {
            tenant: true,
            unit: {
              include: {
                building: true,
              },
            },
          },
        });

        if (contract) {
          datosContrato = {
            inquilino: contract.tenant.nombreCompleto,
            propiedad: `${contract.unit.building.nombre} - ${contract.unit.numero}`,
            direccion: contract.unit.building.direccion,
            rentaMensual: contract.rentaMensual,
            fechaInicio: contract.fechaInicio,
            fechaFin: contract.fechaFin,
          };
        }
      }

      const documento = {
        id: `DOC-${Date.now().toString().slice(-8)}`,
        tipo: input.tipoDocumento,
        fechaGeneracion: new Date(),
        template: template,
        datos: {
          ...datosContrato,
          ...input.parametros,
          fechaDocumento: new Date().toLocaleDateString('es-ES'),
          empresa: 'INMOVA',
        },
        estado: 'borrador',
        requiereRevision: true,
      };

      logger.info(`📄 Documento legal generado: ${documento.id} - Tipo: ${input.tipoDocumento}`);

      return {
        documentoId: documento.id,
        tipo: input.tipoDocumento,
        estado: 'Generado - Requiere revisión',
        mensaje: `Documento ${input.tipoDocumento} generado exitosamente.`,
        advertencia:
          '⚠️ Este documento es un borrador generado automáticamente. DEBE ser revisado por un profesional legal antes de su uso.',
        proximosPasos: [
          'Revisar contenido generado',
          'Ajustar según caso específico',
          'Validar con asesoría legal',
          'Obtener firmas necesarias',
          'Archivar copia del documento',
        ],
        contenidoBorrador: generarContenidoDocumento(input.tipoDocumento, documento.datos),
      };
    },
    requiresConfirmation: true,
  },
  {
    name: 'search_legal_precedents',
    description: 'Busca precedentes legales y casos similares en la base de conocimientos',
    inputSchema: {
      type: 'object',
      properties: {
        tema: {
          type: 'string',
          description: 'Tema legal a buscar',
        },
        tipo: {
          type: 'string',
          enum: ['desahucio', 'morosidad', 'daños', 'incumplimiento', 'rescision', 'otro'],
          description: 'Tipo de caso',
        },
      },
      required: ['tema'],
    },
    handler: async (input, context) => {
      // Simulación de base de conocimientos legal
      const precedentes = obtenerPrecedentes(input.tipo || 'otro');

      return {
        resultadosEncontrados: precedentes.length,
        precedentes: precedentes.slice(0, 5),
        jurisprudenciaRelevante: [
          {
            referencia: 'STS 123/2023',
            fecha: '2023-05-15',
            resumen: 'Caso relevante sobre el tema consultado',
            aplicabilidad: 'Alta',
          },
        ],
        recomendacionesLegales: [
          'Revisar documentación específica del caso',
          'Considerar mediación antes de proceso judicial',
          'Documentar todas las comunicaciones',
        ],
      };
    },
  },
  {
    name: 'audit_compliance',
    description: 'Realiza una auditoría completa de cumplimiento legal y normativo',
    inputSchema: {
      type: 'object',
      properties: {
        alcance: {
          type: 'string',
          enum: ['completo', 'contratos', 'gdpr', 'seguridad', 'laboral'],
          description: 'Alcance de la auditoría',
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio (opcional)',
        },
      },
      required: ['alcance'],
    },
    handler: async (input, context) => {
      logger.info(`🔍 Iniciando auditoría de cumplimiento - Alcance: ${input.alcance}`);

      const resultados: any = {
        alcance: input.alcance,
        fechaAuditoria: new Date(),
        auditor: context.userName,
        hallazgos: [] as any[],
        recomendaciones: [] as any[],
      };

      // Auditoría de contratos
      if (input.alcance === 'completo' || input.alcance === 'contratos') {
        const contratos = await prisma.contract.count({
          where: {
            unit: {
              building: {
                companyId: context.companyId,
                ...(input.buildingId ? { id: input.buildingId } : {}),
              },
            },
          },
        });

        const sinClausulas = await prisma.contract.count({
          where: {
            unit: {
              building: {
                companyId: context.companyId,
              },
            },
            clausulasEspeciales: null,
          },
        });

        if (sinClausulas > 0) {
          resultados.hallazgos.push({
            categoria: 'Contratos',
            severidad: 'media',
            descripcion: `${sinClausulas} de ${contratos} contratos carecen de cláusulas especiales documentadas`,
            riesgo: 'Posibles conflictos por interpretación o falta de claridad',
            accionCorrectiva: 'Revisar y completar cláusulas especiales en todos los contratos',
          });
        }
      }

      // Auditoría GDPR
      if (input.alcance === 'completo' || input.alcance === 'gdpr') {
        resultados.hallazgos.push({
          categoria: 'GDPR/Protección de Datos',
          severidad: 'baja',
          descripcion: 'Sistema implementa medidas básicas de protección de datos',
          riesgo: 'Bajo - Monitoreo continuo requerido',
          accionCorrectiva: 'Continuar con auditorías periódicas',
        });
      }

      // Calificación general
      const hallazgosAltos = resultados.hallazgos.filter((h: any) => h.severidad === 'alta').length;
      const hallazgosMedios = resultados.hallazgos.filter(
        (h: any) => h.severidad === 'media'
      ).length;

      resultados.calificacion =
        hallazgosAltos === 0 && hallazgosMedios < 3
          ? 'Satisfactorio'
          : hallazgosAltos === 0
            ? 'Aceptable con mejoras'
            : 'Requiere atención inmediata';

      return resultados;
    },
    requiresConfirmation: false,
    permissions: ['audit_legal'],
  },
];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function verificarCumplimientoContrato(contract: any) {
  return {
    cumpleNormativaLAU: true,
    tieneFirmaDigital: !!contract.documentUrl,
    clausulasObligatorias: {
      identificacionPartes: true,
      objetoContrato: true,
      duracion: true,
      renta: true,
      fianza: !!contract.deposito,
    },
    observaciones: contract.deposito ? [] : ['Falta registro de depósito de garantía'],
  };
}

function generarRecomendacionesContrato(contract: any, riesgos: any[]) {
  const recomendaciones: string[] = [];

  if (riesgos.some((r) => r.tipo === 'vencimiento_proximo')) {
    recomendaciones.push(
      'Iniciar negociaciones de renovación o dar aviso de no renovación con tiempo suficiente'
    );
  }

  if (!contract.documentUrl) {
    recomendaciones.push('Digitalizar y almacenar copia del contrato firmado');
  }

  if (!contract.clausulasEspeciales) {
    recomendaciones.push('Añadir cláusulas especiales relevantes (mascotas, subarriendo, etc.)');
  }

  recomendaciones.push('Realizar revisión periódica del cumplimiento de términos');

  return recomendaciones;
}

function verificarRegulacion(regulacion: string, companyId: string, buildingId?: string) {
  // Simulación de verificación de regulaciones
  const regulaciones: Record<string, any> = {
    gdpr: {
      regulacion: 'GDPR - Protección de Datos',
      cumple: true,
      criticidad: 'alta',
      descripcion: 'Reglamento General de Protección de Datos',
      ultimaVerificacion: new Date(),
      vigenciaHasta: null,
    },
    lopd: {
      regulacion: 'LOPD - Ley Orgánica de Protección de Datos',
      cumple: true,
      criticidad: 'alta',
      descripcion: 'Ley de Protección de Datos española',
      ultimaVerificacion: new Date(),
    },
    lau: {
      regulacion: 'LAU - Ley de Arrendamientos Urbanos',
      cumple: true,
      criticidad: 'alta',
      descripcion: 'Cumplimiento de normativa de arrendamientos',
      ultimaVerificacion: new Date(),
    },
    habitabilidad: {
      regulacion: 'Cédula de Habitabilidad',
      cumple: true,
      criticidad: 'alta',
      descripcion: 'Certificado de habitabilidad vigente',
      vigenciaHasta: '2025-06-30',
      ultimaVerificacion: new Date(),
    },
    seguridad: {
      regulacion: 'Normativa de Seguridad',
      cumple: true,
      criticidad: 'alta',
      descripcion: 'Cumplimiento de normativas de seguridad',
      ultimaVerificacion: new Date(),
    },
    accesibilidad: {
      regulacion: 'Accesibilidad',
      cumple: false,
      criticidad: 'media',
      descripcion: 'Adaptaciones de accesibilidad pendientes',
      plazoCorreccion: '6 meses',
      consecuencias: 'Posibles multas administrativas',
    },
  };

  return (
    regulaciones[regulacion] || {
      regulacion: regulacion,
      cumple: true,
      criticidad: 'media',
      descripcion: 'Regulación verificada',
      ultimaVerificacion: new Date(),
    }
  );
}

function evaluarNecesidadAbogado(input: any): { necesario: boolean; razon: string } {
  // Criterios que requieren abogado
  if (input.urgente) {
    return { necesario: true, razon: 'Caso marcado como urgente' };
  }

  if (input.montoDisputa && input.montoDisputa > 10000) {
    return { necesario: true, razon: 'Monto en disputa superior a €10,000' };
  }

  if (input.tipo === 'administracion') {
    return {
      necesario: true,
      razon: 'Disputas con administración suelen requerir asesoría especializada',
    };
  }

  return { necesario: false, razon: 'Puede intentarse resolución interna primero' };
}

function obtenerPlazosLegales(tipo: string): any[] {
  const plazos: Record<string, any[]> = {
    inquilino: [
      { accion: 'Requerimiento de pago', plazo: '10 días hábiles' },
      { accion: 'Notificación de desahucio', plazo: '30 días' },
      { accion: 'Presentación demanda', plazo: 'Tras incumplimiento de requerimiento' },
    ],
    proveedor: [
      { accion: 'Reclamación amistosa', plazo: '15 días' },
      { accion: 'Mediación', plazo: '30 días' },
      { accion: 'Vía judicial', plazo: 'Tras fracaso de mediación' },
    ],
    vecino: [
      { accion: 'Mediación comunitaria', plazo: '30 días' },
      { accion: 'Denuncia si aplica', plazo: 'Variable según gravedad' },
    ],
  };

  return (
    plazos[tipo] || [
      { accion: 'Evaluación inicial', plazo: '7 días' },
      { accion: 'Resolución amistosa', plazo: '30 días' },
    ]
  );
}

function obtenerTemplate(tipo: string): string {
  const templates: Record<string, string> = {
    notificacion_desahucio: 'Template de notificación de desahucio',
    requerimiento_pago: 'Template de requerimiento de pago',
    carta_preaviso: 'Template de carta de preaviso',
    finiquito: 'Template de finiquito',
    certificado_no_adeudo: 'Template de certificado de no adeudo',
    addendum_contrato: 'Template de addendum a contrato',
  };

  return templates[tipo] || 'Template genérico';
}

function generarContenidoDocumento(tipo: string, datos: any): string {
  // Esto generaría el contenido real del documento basado en el template
  return `[Documento ${tipo}]\n\nGenerado automáticamente el ${datos.fechaDocumento}\n\n[Contenido del template con datos del caso]\n\n⚠️ BORRADOR - Requiere revisión legal`;
}

function obtenerPrecedentes(tipo: string): any[] {
  return [
    {
      caso: 'Caso ejemplo 2023',
      fecha: '2023-01-15',
      resumen: 'Precedente relevante para el tipo de caso consultado',
      resultado: 'Favorable',
      aplicabilidad: 'Media',
    },
  ];
}

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const legalComplianceConfig: AgentConfig = {
  type: 'legal_compliance',
  name: 'Agente de Legal y Cumplimiento',
  description:
    'Especialista en aspectos legales, cumplimiento normativo y gestión de riesgos legales',
  systemPrompt: `Eres el Agente de Legal y Cumplimiento de INMOVA, especializado en aspectos legales inmobiliarios.

Tu rol es:
- Revisar contratos y identificar riesgos legales
- Asegurar cumplimiento de regulaciones vigentes
- Gestionar disputas y conflictos legales
- Proporcionar alertas sobre vencimientos y obligaciones
- Generar documentación legal básica
- Orientar sobre políticas y procedimientos

Enfoque:
- Prevención antes que corrección
- Cumplimiento estricto de normativa
- Documentación exhaustiva
- Gestión proactiva de riesgos
- Escalación cuando sea necesario
- Claridad en comunicación legal

Estilo de comunicación:
- Preciso y técnicamente correcto
- Claro pero riguroso
- Advertencias cuando sea necesario
- Referencias a normativa aplicable
- Recomendación de asesoría externa cuando proceda

IMPORTANTE:
- NO proporciones asesoramiento legal definitivo
- SIEMPRE recomienda consulta con abogado para casos complejos
- Enfócate en prevención y cumplimiento
- Documenta todo meticulosamente
- Usa disclaimer cuando generes documentos

Áreas de conocimiento:
- LAU (Ley de Arrendamientos Urbanos)
- GDPR y LOPD (Protección de Datos)
- Normativa de habitabilidad
- Derecho contractual
- Procedimientos de desahucio
- Mediación y resolución de conflictos`,
  capabilities,
  tools,
  model: CLAUDE_MODEL_FAST,
  temperature: 0.4, // Muy bajo para mayor precisión legal
  maxTokens: 4096,
  enabled: true,
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class LegalComplianceAgent extends BaseAgent {
  constructor() {
    super(legalComplianceConfig);
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
      'legal',
      'contrato',
      'cláusula',
      'desahucio',
      'demanda',
      'disputa',
      'conflicto',
      'normativa',
      'regulación',
      'cumplimiento',
      'gdpr',
      'lopd',
      'lau',
      'certificado',
      'habitabilidad',
      'abogado',
      'juicio',
      'mediación',
      'arbitraje',
      'documento legal',
      'notificación',
      'requerimiento',
      'plazo legal',
      'vencimiento',
    ];

    return keywords.some((keyword) => messageLower.includes(keyword));
  }
}
