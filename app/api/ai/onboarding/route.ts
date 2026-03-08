import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/ai/onboarding
 * Onboarding conversacional liderado por IA.
 * Usa Claude para mantener una conversación natural que configura la plataforma.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { message, conversationHistory = [], phase = 'welcome' } = await request.json();
    const userName = session.user.name || 'Usuario';
    const userRole = (session.user as any).role || 'gestor';

    // Build system prompt for onboarding
    const systemPrompt = buildOnboardingPrompt(userName, userRole, phase);

    // Call Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        response: getLocalOnboardingResponse(phase, message, userName),
        phase: getNextPhase(phase),
        actions: [],
      });
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    const messages = [
      ...conversationHistory.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const aiText = response.content[0]?.type === 'text' ? response.content[0].text : '';

    // Parse AI response for actions (JSON blocks embedded in response)
    const { text, actions, detectedConfig } = parseAIResponse(aiText);

    // Apply configuration if detected
    if (detectedConfig && Object.keys(detectedConfig).length > 0) {
      try {
        const prisma = await getPrisma();
        const updateData: any = {};

        if (detectedConfig.experienceLevel) updateData.experienceLevel = detectedConfig.experienceLevel;
        if (detectedConfig.techSavviness) updateData.techSavviness = detectedConfig.techSavviness;
        if (detectedConfig.uiMode) updateData.uiMode = detectedConfig.uiMode;
        if (detectedConfig.preferredModules) updateData.preferredModules = detectedConfig.preferredModules;
        if (detectedConfig.businessVertical) updateData.businessVertical = detectedConfig.businessVertical;

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
          });
          logger.info('[AI Onboarding] Config applied', { userId: session.user.id, config: updateData });
        }
      } catch (err) {
        logger.warn('[AI Onboarding] Error applying config', { error: err });
      }
    }

    return NextResponse.json({
      response: text,
      phase: detectedConfig?.nextPhase || getNextPhase(phase),
      actions,
      configApplied: detectedConfig || null,
    });
  } catch (error: any) {
    logger.error('[AI Onboarding Error]:', error);
    return NextResponse.json({ error: 'Error en el onboarding' }, { status: 500 });
  }
}

function buildOnboardingPrompt(userName: string, userRole: string, phase: string): string {
  return `Eres el asistente de onboarding de INMOVA, la plataforma de gestión inmobiliaria más completa de España. Tu objetivo es dar la MEJOR primera impresión posible y configurar la plataforma perfectamente para el usuario.

REGLAS DE COMUNICACIÓN:
- Sé cálido, profesional y entusiasta (pero no exagerado)
- Usa emojis con moderación (1-2 por mensaje)
- Haz UNA pregunta a la vez, nunca más
- Respuestas cortas (3-5 líneas máximo)
- Si el usuario responde brevemente, adáptate sin repetir
- Personaliza usando el nombre: ${userName}

FASE ACTUAL: ${phase}

FLUJO DE ONBOARDING (sigue este orden):

FASE 1 - WELCOME (primera interacción):
- Saluda por nombre, preséntate brevemente
- Pregunta: "¿A qué te dedicas en el sector inmobiliario?" 
- Objetivo: detectar tipo de negocio (alquiler residencial, STR, coliving, holding, etc.)

FASE 2 - BUSINESS (ya sabes el tipo de negocio):
- Confirma el tipo detectado
- Pregunta: "¿Cuántas propiedades gestionas aproximadamente?"
- Objetivo: detectar tamaño (1-5, 5-25, 25-100, 100+)

FASE 3 - EXPERIENCE (sabes negocio + tamaño):
- Pregunta: "¿Has usado antes software de gestión inmobiliaria?" 
- Según respuesta, clasifica: principiante / intermedio / avanzado
- Objetivo: determinar nivel de experiencia

FASE 4 - CONFIGURE (sabes todo, configura):
- Resume lo que entendiste: "Perfecto, ${userName}. Entiendo que..."
- Dile que vas a personalizar la plataforma para sus necesidades
- INCLUYE en tu respuesta un bloque JSON oculto con la configuración:

\`\`\`config
{
  "experienceLevel": "principiante|intermedio|avanzado",
  "techSavviness": "bajo|medio|alto",
  "uiMode": "simple|standard|advanced",
  "businessVertical": "alquiler_tradicional|str_vacacional|coliving|mixto",
  "preferredModules": ["modulo1", "modulo2"],
  "nextPhase": "ready"
}
\`\`\`

Módulos recomendados según negocio:
- Alquiler residencial: propiedades, edificios, unidades, contratos, pagos, inquilinos, mantenimiento, contabilidad, seguros, inspecciones, valoración IA, matching
- STR/Vacacional: str_listings, str_bookings, str_channels, str_pricing, housekeeping, reviews, calendario
- Coliving/Habitaciones: room_rental, comunidad_social, eventos, matching, reservas_espacios, prorrateo_gastos
- Holding/Family Office: inversiones, family_office, private_equity, tesoreria, modelo_720, estructura_grupo, comparativa_sociedades, oportunidades_inversion
- Construcción: proyectos_construccion, gantt, licitaciones, obras, ordenes_trabajo, quality_control
- Servicios Profesionales: proyectos_professional, clientes, facturacion, time_tracking
- Comunidades/Admin Fincas: comunidades, propietarios, cuotas, votaciones, juntas, actas, fondos_reserva, portal_presidente
- Flipping: proyectos_flipping, calculator_roi, timeline, analisis_mercado
- Media Estancia: contratos_flexibles, scoring, calendario_disponibilidad, analytics_revenue
- Hospitality: checkin_checkout, housekeeping, servicios_huesped
- Student Housing: residentes, habitaciones, aplicaciones, actividades, pagos_semestre
- eWoorker: trabajadores, asignaciones, obras, contratos_laborales, compliance
- Mixto: todos los anteriores según preferencia del usuario

UIMode según experiencia:
- Principiante → simple (solo módulos esenciales, tooltips activos, videos tutoriales)
- Intermedio → standard (módulos principales, asistencia bajo demanda)
- Avanzado → advanced (todos los módulos, sin tutoriales, acceso directo)

IMPORTANTE: 
- Rol del usuario: ${userRole}
- Si es admin/super_admin, asume nivel avanzado y ofrece más opciones
- Si es gestor/operador, sé más guiado y didáctico
- NUNCA uses jerga técnica con principiantes
- SIEMPRE responde en español`;
}

function getNextPhase(current: string): string {
  const flow: Record<string, string> = {
    welcome: 'business',
    business: 'experience',
    experience: 'configure',
    configure: 'ready',
    ready: 'complete',
  };
  return flow[current] || 'welcome';
}

function parseAIResponse(text: string): { text: string; actions: any[]; detectedConfig: any } {
  let cleanText = text;
  let detectedConfig: any = null;
  const actions: any[] = [];

  // Extract config JSON
  const configMatch = text.match(/```config\s*([\s\S]*?)```/);
  if (configMatch) {
    try {
      detectedConfig = JSON.parse(configMatch[1].trim());
      cleanText = text.replace(/```config\s*[\s\S]*?```/, '').trim();
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Extract suggested actions
  if (cleanText.includes('/edificios') || cleanText.includes('/dashboard')) {
    const linkMatches = cleanText.match(/\/([\w-/]+)/g);
    if (linkMatches) {
      linkMatches.forEach((link) => {
        if (link.startsWith('/') && !link.includes('//')) {
          actions.push({ type: 'navigate', path: link });
        }
      });
    }
  }

  return { text: cleanText, actions, detectedConfig };
}

function getLocalOnboardingResponse(phase: string, message: string, userName: string): string {
  switch (phase) {
    case 'welcome':
      return `¡Hola ${userName}! 👋 Bienvenido a INMOVA.\n\nSoy tu asistente y te voy a ayudar a configurar la plataforma para que se adapte perfectamente a tu negocio.\n\n¿A qué te dedicas en el sector inmobiliario? Por ejemplo: alquiler residencial, vacacional (STR), coliving, construcción, flipping, administración de fincas, holding/family office, servicios profesionales...`;
    case 'business':
      return `Perfecto, entendido. Para personalizar mejor tu experiencia, ¿cuántas propiedades gestionas aproximadamente?`;
    case 'experience':
      return `¡Bien! Una última pregunta: ¿has usado antes algún software de gestión inmobiliaria?`;
    case 'configure':
      return `Excelente, ${userName}. Ya tengo todo lo que necesito. He personalizado INMOVA para ti.\n\nTe recomiendo empezar por:\n1. Crear tu primera propiedad en /edificios/nuevo\n2. Explorar tu dashboard en /dashboard\n3. Configurar tus preferencias en /configuracion\n\n¡Mucho éxito! 🚀`;
    default:
      return `¿En qué puedo ayudarte, ${userName}?`;
  }
}
