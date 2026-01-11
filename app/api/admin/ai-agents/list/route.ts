/**
 * API: Lista de Agentes de IA
 * 
 * Retorna la lista de agentes disponibles con su configuración y métricas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Definición de agentes del sistema
const AGENTS = [
  {
    id: 'technical_support',
    type: 'technical_support',
    name: 'Soporte Técnico',
    description: 'Gestiona incidencias de mantenimiento, reparaciones y emergencias técnicas. Coordina con proveedores y técnicos.',
    icon: 'Wrench',
    color: 'from-orange-500 to-amber-500',
    capabilities: [
      'Diagnóstico de averías',
      'Programación de reparaciones',
      'Gestión de proveedores',
      'Alertas de emergencia',
      'Historial de mantenimiento',
      'Presupuestos automáticos',
      'Seguimiento de incidencias'
    ],
    keywords: ['avería', 'reparación', 'mantenimiento', 'emergencia', 'técnico', 'agua', 'electricidad', 'calefacción'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      temperature: 0.3,
      maxTokens: 4096,
      autoEscalate: true
    }
  },
  {
    id: 'customer_service',
    type: 'customer_service',
    name: 'Atención al Cliente',
    description: 'Responde consultas, gestiona quejas y proporciona soporte general a inquilinos, propietarios y gestores.',
    icon: 'HeadphonesIcon',
    color: 'from-blue-500 to-cyan-500',
    capabilities: [
      'Respuesta a FAQs',
      'Gestión de quejas',
      'Información de servicios',
      'Seguimiento de solicitudes',
      'Encuestas de satisfacción',
      'Escalación a humanos',
      'Soporte multicanal'
    ],
    keywords: ['consulta', 'ayuda', 'información', 'queja', 'servicio', 'problema', 'duda'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      temperature: 0.5,
      maxTokens: 2048,
      autoEscalate: true
    }
  },
  {
    id: 'commercial_management',
    type: 'commercial_management',
    name: 'Gestión Comercial',
    description: 'Gestiona leads, cualifica oportunidades de venta y apoya el desarrollo comercial del negocio.',
    icon: 'Briefcase',
    color: 'from-green-500 to-emerald-500',
    capabilities: [
      'Cualificación de leads',
      'Seguimiento de oportunidades',
      'Propuestas comerciales',
      'Análisis de conversión',
      'CRM automatizado',
      'Alertas de seguimiento',
      'Pipeline de ventas'
    ],
    keywords: ['venta', 'lead', 'cliente', 'propuesta', 'comercial', 'oportunidad', 'negocio'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      temperature: 0.4,
      maxTokens: 3072,
      autoEscalate: false
    }
  },
  {
    id: 'financial_analysis',
    type: 'financial_analysis',
    name: 'Análisis Financiero',
    description: 'Analiza rentabilidad, ROI, optimiza ingresos y genera reportes financieros para la toma de decisiones.',
    icon: 'TrendingUp',
    color: 'from-violet-500 to-purple-500',
    capabilities: [
      'Cálculo de ROI',
      'Proyecciones financieras',
      'Análisis de rentabilidad',
      'Optimización de precios',
      'Reportes de ingresos',
      'Alertas de morosidad',
      'Benchmarking de mercado'
    ],
    keywords: ['financiero', 'rentabilidad', 'roi', 'ingresos', 'gastos', 'morosidad', 'inversión', 'precio'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 4096,
      autoEscalate: true
    }
  },
  {
    id: 'legal_compliance',
    type: 'legal_compliance',
    name: 'Legal y Cumplimiento',
    description: 'Gestiona aspectos legales, revisa contratos y asegura el cumplimiento normativo (LAU, RGPD, etc.).',
    icon: 'Scale',
    color: 'from-rose-500 to-pink-500',
    capabilities: [
      'Revisión de contratos',
      'Cumplimiento normativo',
      'Alertas regulatorias',
      'Gestión de disputas',
      'Documentación legal',
      'Asesoría RGPD',
      'Actualización de cláusulas'
    ],
    keywords: ['legal', 'contrato', 'cláusula', 'normativa', 'ley', 'rgpd', 'disputa', 'regulación'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 4096,
      autoEscalate: true
    }
  },
  {
    id: 'community_manager',
    type: 'community_manager',
    name: 'Community Manager',
    description: 'Gestiona redes sociales, crea contenido para marketing y administra el blog de la plataforma.',
    icon: 'Megaphone',
    color: 'from-fuchsia-500 to-pink-500',
    capabilities: [
      'Generación de contenido',
      'Programación de posts',
      'Gestión de redes sociales',
      'Administración de blog',
      'Análisis de engagement',
      'Respuesta a comentarios',
      'Estrategia de contenidos'
    ],
    keywords: ['redes sociales', 'contenido', 'post', 'blog', 'marketing', 'instagram', 'linkedin', 'twitter'],
    defaultConfig: {
      model: 'claude-3-5-sonnet',
      temperature: 0.7,
      maxTokens: 2048,
      autoEscalate: false
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    const userRole = (session.user as any)?.role;
    if (userRole !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';

    // Construir respuesta con métricas simuladas si se solicitan
    const agentsWithData = AGENTS.map(agent => {
      const baseAgent = {
        ...agent,
        enabled: true,
        status: 'active' as const
      };

      if (includeMetrics) {
        // Métricas simuladas (en producción vendrían de la BD)
        return {
          ...baseAgent,
          metrics: {
            totalInteractions: Math.floor(Math.random() * 3000) + 200,
            successRate: Math.floor(Math.random() * 15) + 85, // 85-100%
            avgResponseTime: (Math.random() * 2 + 0.5).toFixed(2), // 0.5-2.5s
            lastActive: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Últimas 24h
            escalationRate: Math.floor(Math.random() * 10) + 2, // 2-12%
            satisfactionScore: (Math.random() * 1 + 4).toFixed(1) // 4.0-5.0
          }
        };
      }

      return baseAgent;
    });

    return NextResponse.json({
      success: true,
      agents: agentsWithData,
      total: agentsWithData.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[AI Agents List] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
