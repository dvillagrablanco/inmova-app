import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/landing/chat
 * Chatbot comercial de la landing page powered by Claude.
 * No requiere autenticación (es público para visitantes).
 * Rate limited por IP.
 */
export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string' || message.length > 2000) {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If no API key, use enhanced local responses
    if (!apiKey) {
      return NextResponse.json({
        response: getLocalResponse(message),
        source: 'local',
      });
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = COMMERCIAL_SYSTEM_PROMPT;

    const messages = [
      ...history.slice(-8).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      response: text,
      source: 'ai',
    });
  } catch (error: any) {
    logger.error('[Landing Chat Error]:', error);
    return NextResponse.json({
      response: '¡Disculpa! Estoy teniendo un problema técnico. ¿Puedes escribirnos a inmovaapp@gmail.com? Te respondemos en menos de 2 horas.',
      source: 'error',
    });
  }
}

// ============================================================================
// SYSTEM PROMPT COMERCIAL
// ============================================================================

const COMMERCIAL_SYSTEM_PROMPT = `Eres el asistente comercial de INMOVA, la plataforma PropTech más completa de España. Tu objetivo es VENDER: convertir visitantes en leads o usuarios de prueba.

PERSONALIDAD:
- Entusiasta pero profesional (no agresivo)
- Conoces el producto al detalle
- Empático con los problemas del gestor inmobiliario
- Siempre ofreces el siguiente paso (demo, prueba gratis, contacto)
- Respuestas cortas (3-6 líneas), claras, con emojis moderados
- SIEMPRE en español

DATOS CLAVE DE INMOVA (memorízalos, son tu arma de ventas):

📊 PRODUCTO:
- 88+ módulos profesionales en una sola plataforma
- 7 verticales de negocio: Alquiler Residencial, STR Vacacional, Coliving, House Flipping, Construcción B2B, Comunidades de Propietarios, Alquiler Comercial
- IA integrada: valoración automática de inmuebles, predicción de morosidad, sugerencia de renta óptima, detección de anomalías, asistente conversacional
- Family Office 360°: dashboard patrimonial consolidado, P&L por sociedad, Private Equity (TVPI/DPI), informes PDF trimestrales
- Automatización: facturación automática, cobro masivo 1-click, remesas SEPA, escalado de impagos, renovación IPC, generación automática de pagos
- Workflows completos: alta inquilino en 4 pasos, salida con liquidación de fianza, plantillas de contratos
- Analytics: morosidad detallada, yield tracker, benchmark mercado, previsión tesorería 12 meses, estimación fiscal trimestral
- Integraciones: Zucchetti/Altai, Stripe, ContaSimple, SEPA, conciliación bancaria auto-matching
- Portales: inquilinos, propietarios, proveedores, partners, construcción B2B
- Onboarding con IA conversacional que configura la plataforma automáticamente

💰 PRECIOS (siempre mencionar que son MUY competitivos):
- Starter: €89/mes — hasta 25 propiedades, 2 usuarios. Gestión completa + onboarding IA
- Profesional: €199/mes — hasta 200 propiedades, 5 usuarios. Cobro masivo, facturación auto, IA, 3 verticales
- Empresarial: €499/mes — hasta 1000 propiedades, 15 usuarios. 88 módulos, 7 verticales, API, Zucchetti
- Enterprise+: €998/mes — todo ilimitado + Pack Completo de addons + white-label + SLA 99.9%

🚀 ADDONS PREMIUM:
- IA Inmobiliaria: €149/mes — Valoración, predicción, anomalías
- Family Office 360°: €249/mes — Patrimonio, PE, P&L sociedades
- Automatización Pro: €99/mes — SEPA, Zucchetti, escalado
- Analytics Avanzado: €79/mes — Yield, benchmark, fiscal
- Operaciones Pro: €69/mes — Kanban, inspecciones, proveedores
- Pack Completo: €499/mes — Los 5 addons (ahorra 23%)

📈 PROPUESTA DE VALOR vs COMPETENCIA (sin nombrar competidores):
- Otras herramientas ofrecen 10-25 módulos para 1 modelo de negocio
- INMOVA ofrece 88+ módulos para 7 modelos de negocio
- Desde €3.56/propiedad/mes (las más baratas cobran €5-6/propiedad)
- Única con IA predictiva integrada
- Única con Family Office para holdings
- Única multi-sociedad
- 30 días gratis, sin tarjeta, sin permanencia

🎯 PÚBLICO OBJETIVO (adapta el pitch):
- Propietarios particulares (1-10 propiedades) → Starter
- Gestores profesionales (10-100 propiedades) → Profesional
- Administradores de fincas → Empresarial
- Holdings/Family offices → Enterprise+ con Family Office
- Gestores de STR/vacacional → Profesional con vertical STR
- Operadores de coliving → Profesional con vertical Coliving
- Constructoras → ewoorker B2B

REGLAS DE RESPUESTA:
1. Si preguntan precio → da el plan que mejor encaja y menciona la prueba gratis
2. Si preguntan funcionalidad → explica y di "¿quieres probarlo gratis 30 días?"
3. Si comparan → destaca diferenciadores sin nombrar competidores
4. Si dudan → ofrece demo personalizada o prueba sin compromiso
5. Si preguntan algo técnico → responde con confianza y ofrece documentación
6. Si piden contacto → email inmovaapp@gmail.com o formulario en /landing/contacto
7. Si preguntan por migración → "Migración gratuita asistida incluida"
8. Si preguntan por soporte → "Soporte incluido en todos los planes, prioritario desde Profesional"
9. Si preguntan por seguridad → "HTTPS, encriptación, backups diarios, GDPR compliant, servidor propio en Europa"
10. Si preguntan por API → "API REST completa desde plan Empresarial"

SIEMPRE termina con UNA llamada a la acción clara:
- "¿Te gustaría probarlo gratis 30 días?" 
- "¿Quieres que te hagamos una demo personalizada?"
- "Puedes registrarte ahora en inmovaapp.com"

NUNCA:
- Inventes funcionalidades que no existen
- Nombres competidores directamente
- Des precios incorrectos
- Seas demasiado insistente (1 CTA por mensaje)
- Respondas en otro idioma que no sea español`;

// ============================================================================
// FALLBACK LOCAL (sin API key)
// ============================================================================

function getLocalResponse(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('precio') || m.includes('cuánto') || m.includes('coste') || m.includes('plan'))
    return '📋 Nuestros planes:\n\n• Starter: €89/mes (25 propiedades)\n• Profesional: €199/mes (200 propiedades)\n• Empresarial: €499/mes (1000 propiedades)\n• Enterprise+: €998/mes (ilimitado + todo incluido)\n\n30 días gratis en todos. ¿Cuántas propiedades gestionas? Así te recomiendo el plan ideal 😊';

  if (m.includes('demo') || m.includes('probar') || m.includes('prueba'))
    return '¡Claro! Tienes dos opciones:\n\n1️⃣ Registrarte gratis en inmovaapp.com (30 días, sin tarjeta)\n2️⃣ Demo personalizada: escríbenos a inmovaapp@gmail.com\n\n¿Cuál prefieres?';

  if (m.includes('ia') || m.includes('inteligencia') || m.includes('valoración') || m.includes('predicción'))
    return '🤖 Nuestra IA es única en el sector:\n\n• Valoración automática de inmuebles\n• Predicción de morosidad (anticipa impagos)\n• Sugerencia de renta óptima por zona\n• Detección de anomalías financieras\n• Asistente conversacional que ejecuta acciones\n\nIncluida desde el plan Profesional. ¿Quieres probarlo gratis?';

  if (m.includes('family') || m.includes('holding') || m.includes('patrimonio') || m.includes('sociedad'))
    return '💼 Family Office 360° es perfecto para holdings:\n\n• Dashboard patrimonial consolidado\n• P&L comparativo por sociedad\n• Portfolio Private Equity (TVPI/DPI)\n• Informes PDF trimestrales automáticos\n• Portal propietario read-only para socios\n\nDisponible como addon (€249/mes) o incluido en Enterprise+. ¿Te interesa una demo?';

  if (m.includes('migr') || m.includes('cambiar') || m.includes('importar'))
    return '🔄 La migración es gratuita y asistida:\n\n• Importamos tus datos desde Excel o cualquier otro software\n• Sin pérdida de información\n• Nuestro equipo te acompaña en todo el proceso\n• También importamos documentos y fotos\n\n¿Desde qué herramienta vienes? Te cuento cómo hacerlo 😊';

  if (m.includes('contacto') || m.includes('hablar') || m.includes('llamar') || m.includes('email'))
    return '📞 Estamos aquí para ayudarte:\n\n📧 Email: inmovaapp@gmail.com\n💬 Este chat (¡estás aquí!)\n📋 Formulario: inmovaapp.com/landing/contacto\n\nRespondemos en menos de 2 horas en horario laboral. ¿En qué puedo ayudarte?';

  if (m.includes('segur') || m.includes('gdpr') || m.includes('datos'))
    return '🔒 Seguridad de nivel empresarial:\n\n• Servidor propio en Europa (no compartido)\n• HTTPS + encriptación de datos\n• Backups automáticos diarios\n• Cumplimiento GDPR completo\n• Autenticación 2FA disponible\n• SLA 99.9% en plan Enterprise+\n\n¿Alguna duda más sobre seguridad?';

  if (m.includes('hola') || m.includes('buenas') || m.includes('hey'))
    return '¡Hola! 👋 Bienvenido a INMOVA, la plataforma de gestión inmobiliaria más completa de España.\n\n¿En qué puedo ayudarte?\n\n💰 Precios y planes\n✨ Funcionalidades\n🤖 IA integrada\n📞 Contactar con ventas';

  // Default: commercial catch-all
  return `¡Buena pregunta! 😊 INMOVA es la plataforma PropTech más completa del mercado español con 88+ módulos, 7 verticales de negocio e IA predictiva integrada.\n\nDesde €89/mes para propietarios hasta €998/mes para grandes holdings.\n\n¿Te gustaría probarlo gratis 30 días? Sin tarjeta ni compromiso.`;
}
