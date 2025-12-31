/**
 * 🤖 INMOVA AUTO-GROWTH ENGINE - AI Copywriter
 * Genera contenido persuasivo para redes sociales con personalidad de Growth Manager
 */

import { SocialPlatform, SocialPostTopic } from '@prisma/client';

interface CopywriterConfig {
  topic: SocialPostTopic;
  platform: SocialPlatform;
  useAI?: boolean; // Si false, usa templates
}

interface GeneratedContent {
  content: string;
  hashtags?: string[];
  callToAction?: string;
}

/**
 * Genera contenido para redes sociales
 * Intenta usar IA (Anthropic/OpenAI) primero, fallback a templates
 */
export async function generateSocialCopy(config: CopywriterConfig): Promise<GeneratedContent> {
  const useAI =
    config.useAI !== false && (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);

  if (useAI) {
    try {
      return await generateWithAI(config);
    } catch (error) {
      console.error('[Copywriter] Error con IA, usando templates:', error);
      return generateWithTemplates(config);
    }
  } else {
    return generateWithTemplates(config);
  }
}

/**
 * Genera contenido usando IA (Anthropic Claude o OpenAI)
 */
async function generateWithAI(config: CopywriterConfig): Promise<GeneratedContent> {
  const prompt = buildPrompt(config);

  // Intentar con Anthropic primero (mejor calidad)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0].type === 'text' ? message.content[0].text : '';
      return parseAIResponse(content, config.platform);
    } catch (error) {
      console.error('[Copywriter] Error con Anthropic:', error);
    }
  }

  // Fallback a OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return parseAIResponse(content, config.platform);
    } catch (error) {
      console.error('[Copywriter] Error con OpenAI:', error);
    }
  }

  // Si todo falla, usar templates
  return generateWithTemplates(config);
}

/**
 * Construye el prompt para la IA
 */
function buildPrompt(config: CopywriterConfig): string {
  const platformGuidelines = {
    LINKEDIN: `
Escribe un post para LinkedIn profesional.
- Tono: Thought Leadership, profesional pero accesible
- Longitud: 3 párrafos cortos (máximo 150 palabras)
- Estructura: Gancho → Problema → Solución Inmova → Reflexión/Pregunta
- Enfoque: ROI, escalabilidad, productividad
- NO uses hashtags (LinkedIn no los necesita tanto)
- Primera línea DEBE captar atención (estadística, pregunta provocadora)
`,
    X: `
Escribe un tweet impactante.
- Tono: Directo, punchy, provocador pero profesional
- Longitud: Máximo 280 caracteres
- Sin hashtags excesivos (máximo 2)
- Primera línea debe enganchar
- Usa emojis estratégicamente (máximo 2)
`,
    INSTAGRAM: `
Escribe un caption para Instagram.
- Tono: Aspiracional, enfocado en el beneficio emocional (libertad, tiempo)
- Longitud: 2-3 párrafos cortos
- Incluye 3-5 hashtags relevantes al final
- Usa emojis para separar secciones
- Enfoque: Estilo de vida, no solo features técnicos
`,
    FACEBOOK: `
Escribe un post para Facebook.
- Tono: Conversacional, familiar
- Longitud: 2 párrafos medianos
- Enfoque: Historia/caso de uso concreto
- Llamada a acción clara al final
`,
  };

  const topicContext = {
    FIRMA_DIGITAL: {
      painPoint: 'Firmar contratos presencialmente consume tiempo y genera fricción',
      solution: 'Firma digital legalmente válida desde cualquier lugar',
      benefit: 'Cierra contratos en 5 minutos vs. 2 días',
    },
    AUTOMATIZACION: {
      painPoint: 'Gestores pierden 15h/semana en tareas repetitivas (emails, recordatorios)',
      solution: 'Automatización inteligente de comunicación con inquilinos',
      benefit: 'Recupera 15 horas cada semana para escalar tu negocio',
    },
    GESTION_ALQUILERES: {
      painPoint: 'Hacer seguimiento manual de pagos y vencimientos es caótico',
      solution: 'Dashboard centralizado con toda la información en tiempo real',
      benefit: 'Control total de tu cartera desde un solo lugar',
    },
    COLIVING: {
      painPoint: 'Gestionar espacios compartidos requiere coordinación compleja',
      solution: 'Plataforma específica para coliving con matching de inquilinos',
      benefit: 'Optimiza ocupación y reduce conflictos',
    },
    COMUNIDADES: {
      painPoint: 'Votaciones y comunicación en comunidades es lenta y desorganizada',
      solution: 'Sistema de votaciones digitales con trazabilidad',
      benefit: 'Decisiones más rápidas y transparentes',
    },
    ROI_INMOBILIARIO: {
      painPoint: 'No tienes visibilidad clara de la rentabilidad de cada propiedad',
      solution: 'Analytics detallado con ROI por propiedad',
      benefit: 'Toma decisiones basadas en datos reales',
    },
    TIEMPO_LIBERTAD: {
      painPoint: 'Tu negocio inmobiliario te consume todo el día',
      solution: 'Automatización que trabaja 24/7 por ti',
      benefit: 'Gestiona desde la playa, tu negocio funciona solo',
    },
    ESCALABILIDAD: {
      painPoint: 'Crecer de 5 a 50 propiedades sin caos es casi imposible',
      solution: 'Sistema que escala contigo sin necesidad de contratar más gente',
      benefit: 'De 5 a 50 propiedades con el mismo esfuerzo',
    },
    INTEGRACIONES: {
      painPoint: 'Trabajar con múltiples herramientas desconectadas es ineficiente',
      solution: 'Integraciones nativas con QuickBooks, Stripe, WhatsApp',
      benefit: 'Todo conectado, datos sincronizados automáticamente',
    },
    REPORTES_ANALYTICS: {
      painPoint: 'Crear reportes manualmente consume horas cada mes',
      solution: 'Reportes automáticos enviados a tu email',
      benefit: 'Informes profesionales generados al instante',
    },
  };

  const context = topicContext[config.topic] || topicContext.AUTOMATIZACION;

  return `
Eres un Growth Manager Senior especializado en PropTech (Tecnología Inmobiliaria).
Tu personalidad: Directo, basado en datos, enfocado en resultados.
Tu marca: Inmova - Plataforma SaaS para gestión inmobiliaria integral.

CONTEXTO DEL TEMA:
- Pain Point: ${context.painPoint}
- Nuestra Solución: ${context.solution}
- Beneficio Clave: ${context.benefit}

PLATAFORMA: ${config.platform}

${platformGuidelines[config.platform]}

IMPORTANTE:
- NO seas vendedor agresivo, sé consultivo
- USA estadísticas/números cuando sea posible
- HAZ preguntas que provoquen reflexión
- ENFÓCATE en el problema, la solución es secundaria
- Menciona "Inmova" SOLO si es natural, no lo fuerces

Genera el contenido ahora (SOLO el texto, sin etiquetas ni explicaciones):
`.trim();
}

/**
 * Parsea la respuesta de la IA
 */
function parseAIResponse(aiResponse: string, platform: SocialPlatform): GeneratedContent {
  // Extraer hashtags si existen (Instagram)
  const hashtagMatch = aiResponse.match(/#\w+/g);
  const hashtags = hashtagMatch || [];

  // Limpiar el contenido de hashtags si están al final
  let content = aiResponse;
  if (hashtags.length > 0 && platform === 'INSTAGRAM') {
    const hashtagsText = hashtags.join(' ');
    content = aiResponse.replace(hashtagsText, '').trim();
  }

  return {
    content: content.trim(),
    hashtags: hashtags.length > 0 ? hashtags : undefined,
  };
}

/**
 * Genera contenido usando templates predefinidos (fallback)
 */
function generateWithTemplates(config: CopywriterConfig): GeneratedContent {
  const templates = {
    LINKEDIN: {
      FIRMA_DIGITAL: `La gestión inmobiliaria tradicional tiene un cuello de botella invisible.

No es conseguir inquilinos.
No es el mantenimiento.
Es la firma de contratos.

→ Coordinar horarios
→ Desplazarse a la notaría
→ Esperar días para cerrar

¿El resultado? Oportunidades perdidas porque el proceso es lento.

La firma digital cambia esto:
• Contrato enviado en 2 minutos
• Firmado desde cualquier lugar
• Legalmente válido

De 2 días a 5 minutos.

¿Cuántos contratos cerraste el último mes? ¿Cuánto tiempo te tomó cada uno?`,

      AUTOMATIZACION: `Pregunta honesta: ¿Cuántas horas dedicas cada semana a enviar emails a inquilinos?

Recordatorios de pago.
Confirmaciones de mantenimiento.
Avisos generales.

La media: 8 horas semanales.

Eso son 32 horas al mes.
2 días completos dedicados a tareas que una máquina hace en segundos.

La automatización no es lujo, es necesidad.

¿Qué harías con 32 horas extra al mes?`,

      GESTION_ALQUILERES: `De 10 a 50 propiedades: el salto que rompe cualquier sistema casero.

He visto gestores brillantes colapsar al escalar porque:
→ Excel ya no da más de sí
→ Contratar un asistente no resuelve el caos
→ Los errores humanos se multiplican

La clave no es trabajar más duro.
Es trabajar con sistemas que escalen contigo.

Un sistema profesional gestiona 500 unidades con el mismo esfuerzo que 50.

¿Tu herramienta actual escala contigo o te limita?`,
    },

    X: {
      FIRMA_DIGITAL: `Tiempo para cerrar un contrato de alquiler:

❌ Tradicional: 2-3 días
✅ Firma digital: 5 minutos

No es magia. Es tecnología.

#PropTech`,

      AUTOMATIZACION: `¿Cuántas horas pierdes enviando emails a inquilinos? 🕐

La media: 8h/semana.

Solución: Automatiza.

1 email → 100 emails
Mismo esfuerzo.

#Automatizacion`,

      GESTION_ALQUILERES: `De 5 a 50 propiedades en 2 años. 📈

El problema NO es conseguir más propiedades.

El problema es gestionarlas sin colapsar.

Sistema > Esfuerzo`,
    },

    INSTAGRAM: {
      FIRMA_DIGITAL: `Imagina cerrar un contrato desde la playa. 🏖️

No es un sueño.
Es firma digital.

→ Contrato enviado desde tu móvil
→ Firmado en minutos
→ Legalmente válido

Tu negocio ya no te ata a una oficina.

#PropTech #FirmaDigital #GestionInmobiliaria #LibertadFinanciera #Emprendedor`,

      AUTOMATIZACION: `¿Qué harías con 15 horas extra cada semana? ⏱️

Con automatización inteligente:
• Emails automáticos ✅
• Recordatorios de pago ✅
• Seguimiento 24/7 ✅

Tu tiempo es tu activo más valioso.

#Automatizacion #PropTech #GestionInmobiliaria #Productividad #Emprendedor`,

      GESTION_ALQUILERES: `De caos a control. 📊

Dashboard que muestra:
→ Estado de pagos en tiempo real
→ Mantenimientos pendientes
→ Renovaciones próximas

Todo en un solo lugar.

#PropTech #GestionInmobiliaria #Dashboard #RealEstate #Organizacion`,
    },

    FACEBOOK: {
      // Facebook usa los mismos que LinkedIn pero más cortos
      FIRMA_DIGITAL: `La firma de contratos solía ser una pesadilla logística.

Ahora cierras contratos desde tu móvil en 5 minutos. Legalmente válido, sin desplazamientos.

La tecnología está cambiando la gestión inmobiliaria.

¿Ya usas firma digital en tu negocio?`,

      AUTOMATIZACION: `Gestionar propiedades no debería consumir todo tu día.

Con automatización inteligente, el sistema envía recordatorios, coordina mantenimientos y gestiona comunicación mientras tú te enfocas en crecer.

¿Cuánto tiempo dedicas a tareas que podrían automatizarse?`,

      GESTION_ALQUILERES: `El salto de 5 a 50 propiedades parece imposible.

Hasta que descubres que el problema no es la cantidad, sino el sistema.

Con herramientas profesionales, 50 propiedades se gestionan con el mismo esfuerzo que 10.

¿Qué sistema usas tú?`,
    },
  };

  const platformTemplates = templates[config.platform] || templates.LINKEDIN;
  const content =
    platformTemplates[config.topic] ||
    platformTemplates.AUTOMATIZACION ||
    'Contenido no disponible para este tema.';

  // Extraer hashtags si es Instagram
  if (config.platform === 'INSTAGRAM') {
    const hashtagMatch = content.match(/#\w+/g);
    const hashtags = hashtagMatch || [];
    const cleanContent = content.replace(/#\w+/g, '').trim();

    return {
      content: cleanContent,
      hashtags,
    };
  }

  return { content };
}

/**
 * Genera contenido completo para un post (incluye generación de imagen)
 */
export async function generateCompletePost(config: CopywriterConfig & { imagePrompt?: string }) {
  // 1. Generar copy
  const copyResult = await generateSocialCopy(config);

  // 2. Generar URL de imagen
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com';
  const variant = selectImageVariant(config.topic);
  const imageUrl = `${baseUrl}/api/og/saas?topic=${config.topic}&variant=${variant}`;

  return {
    content: copyResult.content,
    hashtags: copyResult.hashtags,
    imageUrl,
    imagePrompt: config.imagePrompt || `Mockup de ${config.topic} para ${config.platform}`,
  };
}

/**
 * Selecciona la variante de imagen apropiada según el topic
 */
function selectImageVariant(
  topic: SocialPostTopic
): 'notification' | 'dashboard' | 'chart' | 'mobile' | 'simple' {
  const variantMap: Record<SocialPostTopic, any> = {
    FIRMA_DIGITAL: 'notification',
    AUTOMATIZACION: 'dashboard',
    GESTION_ALQUILERES: 'dashboard',
    COLIVING: 'mobile',
    COMUNIDADES: 'notification',
    ROI_INMOBILIARIO: 'chart',
    TIEMPO_LIBERTAD: 'mobile',
    ESCALABILIDAD: 'chart',
    INTEGRACIONES: 'dashboard',
    REPORTES_ANALYTICS: 'dashboard',
  };

  return variantMap[topic] || 'notification';
}
