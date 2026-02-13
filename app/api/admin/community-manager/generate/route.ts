import { CLAUDE_MODEL_FAST, CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/community-manager/generate
 * Genera contenido con IA para redes sociales
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { type, style, platforms, topic } = body;

    // Verificar API Key de Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const hasAnthropicKey = Boolean(anthropicKey && anthropicKey.length > 10 && !anthropicKey.includes('placeholder'));

    if (hasAnthropicKey) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({ apiKey: anthropicKey });

        const systemPrompt = `Eres un experto Community Manager para Inmova, una plataforma PropTech de gestión inmobiliaria.
Tu tarea es crear contenido atractivo para redes sociales.

Estilo: ${style === 'professional' ? 'Profesional y corporativo' : style === 'casual' ? 'Cercano y casual' : 'Equilibrado'}
Plataformas: ${platforms?.join(', ') || 'General'}

Reglas:
- Usa emojis apropiados pero no en exceso
- Incluye llamadas a la acción
- Si es para Instagram/Twitter, sugiere hashtags relevantes
- El contenido debe ser sobre el sector inmobiliario, gestión de propiedades, o tips para propietarios/inquilinos
- Máximo 280 caracteres para Twitter, hasta 2200 para Instagram/Facebook`;

        const userPrompt = topic 
          ? `Crea un post sobre: ${topic}`
          : `Crea un post atractivo sobre gestión inmobiliaria para ${platforms?.join(' y ') || 'redes sociales'}`;

        const message = await anthropic.messages.create({
          model: CLAUDE_MODEL_FAST,
          max_tokens: 500,
          messages: [
            { role: 'user', content: userPrompt }
          ],
          system: systemPrompt,
        });

        const content = message.content[0].type === 'text' ? message.content[0].text : '';

        return NextResponse.json({
          success: true,
          content,
          source: 'ai',
          model: CLAUDE_MODEL_FAST,
        });
      } catch (aiError) {
        logger.error('[AI Generation Error]:', aiError);
        // Fallback a plantilla si falla la IA
      }
    }

    // Fallback: Plantillas predefinidas cuando no hay API Key
    const templates = {
      professional: [
        '🏠 En Inmova transformamos la gestión inmobiliaria. Descubre cómo nuestra plataforma puede simplificar tu día a día como propietario o gestor. #PropTech #GestionInmobiliaria #Inmobiliaria',
        '📊 La digitalización del sector inmobiliario es el presente. Con Inmova, accede a todas tus propiedades, contratos e inquilinos desde un solo lugar. #RealEstate #Tecnologia',
        '💼 Profesionaliza la gestión de tu cartera inmobiliaria. Automatiza cobros, genera contratos y mantén toda tu documentación organizada. #GestionDeAlquileres',
      ],
      casual: [
        '¿Cansado de perseguir recibos y contratos? 😅 En Inmova lo tenemos todo bajo control. Tu tranquilidad, nuestra prioridad 🏡✨ #ViviendaFacil',
        '¡Menos papeleos, más vida! 🎉 Gestiona tus alquileres sin complicaciones con Inmova. Pruébalo gratis 👉 #AdiosAlPapeleo',
        'Tu inquilino tiene una incidencia? 🔧 Con Inmova la gestionas en 2 clicks. Así de simple 😊 #GestionInteligente',
      ],
      mixed: [
        '🏢 La gestión inmobiliaria profesional también puede ser sencilla. En Inmova combinamos tecnología avanzada con una experiencia de usuario intuitiva. ¿Listo para el cambio? #PropTech',
        '📱 Tu oficina inmobiliaria en tu bolsillo. Contratos, pagos, incidencias... todo desde tu móvil con Inmova. Descúbrelo 👉 #InmobiliariaDigital',
        '💡 Tip para propietarios: automatiza el recordatorio de pagos y olvídate de los retrasos. En Inmova lo configuramos por ti 🎯 #TipsInmobiliarios',
      ],
    };

    const styleTemplates = templates[style as keyof typeof templates] || templates.mixed;
    const randomContent = styleTemplates[Math.floor(Math.random() * styleTemplates.length)];

    return NextResponse.json({
      success: true,
      content: randomContent,
      source: 'template',
      message: 'Contenido generado desde plantilla. Configura la API de Anthropic para generación con IA.',
    });
  } catch (error: any) {
    logger.error('[Community Manager Generate Error]:', error);
    return NextResponse.json(
      { error: 'Error al generar contenido' },
      { status: 500 }
    );
  }
}
