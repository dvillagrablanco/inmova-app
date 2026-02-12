import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PROVIDER = 'ai_agents';

const configSchema = z.object({
  model: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().int().positive(),
  autoEscalate: z.boolean(),
});

const updateSchema = z.object({
  agentId: z.string().min(1),
  config: configSchema.partial().optional(),
  enabled: z.boolean().optional(),
});

type AgentConfig = z.infer<typeof configSchema>;

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

const parseAgentConfig = (value: unknown): Partial<AgentConfig> => {
  const parsed = configSchema.partial().safeParse(value);
  return parsed.success ? parsed.data : {};
};

const getCompanyContext = async (
  userId: string,
  role?: string | null,
  companyId?: string | null
) => {
  const prisma = await getPrisma();
  if (companyId) {
    return { role, companyId };
  }

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyId: true },
  });

  return {
    role: role ?? user?.role ?? null,
    companyId: companyId ?? user?.companyId ?? null,
  };
};

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
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Permitir a cualquier usuario autenticado ver la lista de agentes
    // La función PUT sigue requiriendo super_admin para configuración

    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';

    const { companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: PROVIDER } },
      select: { settings: true },
    });

    const settings = toObjectRecord(integration?.settings);
    const agentsSettings = toObjectRecord(settings.agents);

    const agentsWithData = SYSTEM_AGENTS.map((agent) => {
      const storedAgent = toObjectRecord(agentsSettings[agent.id]);
      const storedConfig = parseAgentConfig(storedAgent.config);
      const storedEnabled =
        typeof storedAgent.enabled === 'boolean' ? storedAgent.enabled : undefined;

      return {
        ...agent,
        enabled: storedEnabled ?? agent.enabled,
        defaultConfig: {
          ...agent.defaultConfig,
          ...storedConfig,
        },
        metrics: includeMetrics
          ? {
              totalInteractions: 0,
              successRate: 0,
              avgResponseTime: 0,
              lastActive: null,
            }
          : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      agents: agentsWithData,
      total: agentsWithData.length,
      timestamp: new Date().toISOString(),
      message:
        'Los agentes están disponibles. Las métricas aparecerán cuando exista tracking por agente.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[AI Agents List Error]:', { message });
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
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = sessionUser.role ?? null;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const body = updateSchema.parse(await request.json());
    const { agentId, config, enabled } = body;

    const agent = SYSTEM_AGENTS.find((item) => item.id === agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agente no encontrado' },
        { status: 404 }
      );
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: PROVIDER } },
      select: { credentials: true, settings: true },
    });

    const baseSettings = toObjectRecord(integration?.settings);
    const agentsSettings = toObjectRecord(baseSettings.agents);
    const currentAgent = toObjectRecord(agentsSettings[agentId]);
    const currentConfig = parseAgentConfig(currentAgent.config);
    const currentEnabled =
      typeof currentAgent.enabled === 'boolean' ? currentAgent.enabled : undefined;

    const nextConfig = {
      ...agent.defaultConfig,
      ...currentConfig,
      ...config,
    };

    const nextAgentSettings = {
      enabled: enabled ?? currentEnabled ?? agent.enabled,
      config: nextConfig,
    };

    const nextSettings = JSON.parse(
      JSON.stringify({
        ...baseSettings,
        agents: {
          ...agentsSettings,
          [agentId]: nextAgentSettings,
        },
      })
    ) as JsonObject;

    const now = new Date();
    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: PROVIDER } },
      create: {
        companyId,
        provider: PROVIDER,
        name: 'AI Agents',
        category: 'ai',
        credentials: integration?.credentials ?? {},
        settings: nextSettings,
        enabled: true,
        isConfigured: true,
        createdBy: sessionUser.id,
        lastSyncAt: now,
      },
      update: {
        settings: nextSettings,
        enabled: true,
        isConfigured: true,
        lastSyncAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración del agente actualizada',
      agentId,
      config: nextConfig,
      enabled: nextAgentSettings.enabled,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[AI Agents Update Error]:', { message });
    return NextResponse.json(
      { error: 'Error al actualizar agente' },
      { status: 500 }
    );
  }
}
