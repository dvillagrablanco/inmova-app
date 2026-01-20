import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Definición de agentes de IA del sistema
// Estos son los agentes disponibles en la plataforma
// ORDEN: General primero, luego Documental, después el resto por categoría
const SYSTEM_AGENTS = [
  {
    id: 'general',
    type: 'general',
    name: 'Asistente General',
    description: 'Coordinador inteligente que analiza tu consulta y te dirige al agente especializado más adecuado',
    icon: 'Sparkles',
    color: 'from-indigo-500 to-violet-500',
    enabled: true,
    capabilities: [
      'Análisis de intención',
      'Derivación a agentes especializados',
      'Consultas generales',
      'Información de la plataforma',
      'Recomendación de agentes',
      'Asistencia multidominio',
    ],
    keywords: ['ayuda', 'general', 'no sé', 'información', 'orientación', 'qué agente', 'recomendar'],
    defaultConfig: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.5,
      maxTokens: 4096,
      autoEscalate: true,
    },
  },
  {
    id: 'document_assistant',
    type: 'document_assistant',
    name: 'Asistente Documental',
    description: 'Analiza, resume y extrae información de documentos PDF, contratos e imágenes',
    icon: 'FileText',
    color: 'from-teal-500 to-cyan-500',
    enabled: true,
    capabilities: [
      'Análisis de documentos PDF',
      'Resumen automático de contratos',
      'Extracción de datos clave',
      'OCR de imágenes',
      'Clasificación de documentos',
      'Búsqueda inteligente en documentos',
    ],
    keywords: ['documento', 'pdf', 'contrato', 'análisis', 'resumen', 'extraer', 'imagen', 'OCR', 'archivo'],
    defaultConfig: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.3,
      maxTokens: 8192,
      autoEscalate: false,
    },
  },
  {
    id: 'technical_support',
    type: 'technical_support',
    name: 'Soporte Técnico',
    description: 'Resuelve dudas técnicas de usuarios sobre la plataforma Inmova',
    icon: 'Wrench',
    color: 'from-amber-500 to-orange-500',
    enabled: true,
    capabilities: [
      'Resolución de problemas técnicos',
      'Guías de uso de la plataforma',
      'Diagnóstico de errores',
      'Recomendaciones de configuración',
    ],
    keywords: ['error', 'problema', 'no funciona', 'ayuda', 'cómo', 'configurar'],
    defaultConfig: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.3,
      maxTokens: 4096,
      autoEscalate: true,
    },
  },
  {
    id: 'customer_service',
    type: 'customer_service',
    name: 'Atención al Cliente',
    description: 'Atiende consultas generales de usuarios y clientes de Inmova',
    icon: 'HeadphonesIcon',
    color: 'from-blue-500 to-cyan-500',
    enabled: true,
    capabilities: [
      'Resolución de consultas',
      'Información de planes y precios',
      'Gestión de cuentas',
      'Seguimiento de incidencias',
    ],
    keywords: ['consulta', 'información', 'precio', 'plan', 'cuenta', 'suscripción'],
    defaultConfig: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.5,
      maxTokens: 4096,
      autoEscalate: true,
    },
  },
  {
    id: 'commercial_management',
    type: 'commercial_management',
    name: 'Gestión Comercial',
    description: 'Asiste en tareas comerciales y seguimiento de leads',
    icon: 'Briefcase',
    color: 'from-green-500 to-emerald-500',
    enabled: true,
    capabilities: [
      'Cualificación de leads',
      'Propuestas comerciales',
      'Seguimiento de oportunidades',
      'Análisis de mercado',
    ],
    keywords: ['lead', 'venta', 'cliente potencial', 'propuesta', 'comercial'],
    defaultConfig: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.6,
      maxTokens: 4096,
      autoEscalate: true,
    },
  },
  {
    id: 'financial_analysis',
    type: 'financial_analysis',
    name: 'Análisis Financiero',
    description: 'Genera análisis financieros y proyecciones inmobiliarias',
    icon: 'TrendingUp',
    color: 'from-violet-500 to-purple-500',
    enabled: true,
    capabilities: [
      'Análisis de rentabilidad',
      'Proyecciones financieras',
      'Valoraciones inmobiliarias',
      'Informes de inversión',
    ],
    keywords: ['rentabilidad', 'inversión', 'valoración', 'análisis', 'ROI', 'financiero'],
    defaultConfig: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.4,
      maxTokens: 8192,
      autoEscalate: false,
    },
  },
  {
    id: 'legal_compliance',
    type: 'legal_compliance',
    name: 'Asesoría Legal',
    description: 'Orienta sobre aspectos legales de contratos inmobiliarios',
    icon: 'Scale',
    color: 'from-rose-500 to-pink-500',
    enabled: true,
    capabilities: [
      'Revisión de contratos',
      'Normativa inmobiliaria',
      'Derechos y obligaciones',
      'Procedimientos legales',
    ],
    keywords: ['contrato', 'legal', 'ley', 'normativa', 'derechos', 'obligaciones'],
    defaultConfig: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.3,
      maxTokens: 4096,
      autoEscalate: true,
    },
  },
  {
    id: 'community_manager',
    type: 'community_manager',
    name: 'Community Manager',
    description: 'Gestiona contenido para redes sociales y blog',
    icon: 'Megaphone',
    color: 'from-fuchsia-500 to-pink-500',
    enabled: true,
    capabilities: [
      'Creación de contenido',
      'Gestión de redes sociales',
      'Publicaciones de blog',
      'Estrategia de marketing',
    ],
    keywords: ['contenido', 'redes', 'blog', 'publicación', 'marketing', 'social'],
    defaultConfig: {
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 4096,
      autoEscalate: false,
    },
  },
];

/**
 * GET /api/admin/ai-agents/list
 * Obtiene la lista de agentes de IA disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Permitir a cualquier usuario autenticado ver la lista de agentes
    // La función PUT sigue requiriendo super_admin para configuración

    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';

    // Devolver agentes con métricas vacías (datos reales cuando se implementen)
    const agentsWithData = SYSTEM_AGENTS.map(agent => ({
      ...agent,
      metrics: includeMetrics ? {
        // Métricas reales - inicialmente vacías/cero
        totalInteractions: 0,
        successRate: 0,
        avgResponseTime: 0,
        lastActive: null,
        // TODO: Obtener métricas reales de la base de datos
      } : undefined,
    }));

    return NextResponse.json({
      success: true,
      agents: agentsWithData,
      total: agentsWithData.length,
      timestamp: new Date().toISOString(),
      message: 'Los agentes están disponibles. Las métricas se actualizarán cuando los agentes procesen interacciones.',
    });
  } catch (error: any) {
    logger.error('[AI Agents List Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener lista de agentes' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ai-agents/list
 * Actualizar configuración de un agente
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { agentId, config, enabled } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'ID del agente es requerido' },
        { status: 400 }
      );
    }

    // TODO: Guardar configuración en base de datos
    
    return NextResponse.json({
      success: true,
      message: 'Configuración del agente actualizada',
      agentId,
      config,
      enabled,
    });
  } catch (error: any) {
    logger.error('[AI Agents Update Error]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar agente' },
      { status: 500 }
    );
  }
}
