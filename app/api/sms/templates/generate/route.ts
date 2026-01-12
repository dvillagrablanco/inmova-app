'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Plantillas predefinidas por tipo
const TEMPLATE_SUGGESTIONS: Record<string, string[]> = {
  recordatorio_pago: [
    'Hola {{nombre}}, te recordamos que tu pago de {{monto}} vence el {{fecha}}. Evita recargos pagando a tiempo.',
    'Estimado/a {{nombre}}, tienes un pago pendiente de {{monto}} para la unidad {{unidad}}. Fecha límite: {{fecha}}.',
    '{{nombre}}, tu alquiler de {{monto}} vence pronto ({{fecha}}). ¿Necesitas ayuda con el pago? Contáctanos.',
  ],
  confirmacion_visita: [
    '¡Hola {{nombre}}! Confirmamos tu visita al inmueble el {{fecha}} a las {{hora}}. Te esperamos en {{direccion}}.',
    'Visita confirmada: {{fecha}} - {{hora}}. Dirección: {{direccion}}. Si necesitas cambiarla, responde este mensaje.',
    '{{nombre}}, recordatorio de visita programada para {{fecha}}. Llega 5 min antes. Ubicación: {{direccion}}.',
  ],
  mantenimiento: [
    'Aviso de mantenimiento programado en {{edificio}} el {{fecha}}. Puede haber interrupciones de servicio.',
    '{{nombre}}, tu solicitud de mantenimiento ha sido recibida. Nº ticket: {{ticket}}. Te contactaremos pronto.',
    'El técnico visitará tu unidad {{unidad}} el {{fecha}} entre {{hora_inicio}} y {{hora_fin}} para {{servicio}}.',
  ],
  alerta: [
    'ALERTA {{edificio}}: {{mensaje}}. Por favor, sigue las instrucciones de seguridad.',
    'Aviso importante para residentes de {{edificio}}: {{mensaje}}. Más info en administración.',
    '{{nombre}}, notificación urgente: {{mensaje}}. Contacta administración si tienes dudas.',
  ],
  bienvenida: [
    '¡Bienvenido/a {{nombre}} a {{edificio}}! Estamos encantados de tenerte. Cualquier duda, estamos aquí.',
    'Hola {{nombre}}, bienvenido a tu nuevo hogar en {{unidad}}. Tu código de acceso es {{codigo}}.',
    '{{nombre}}, ¡ya eres parte de nuestra comunidad! Descarga nuestra app para gestionar todo fácilmente.',
  ],
  general: [
    '{{nombre}}, te informamos que {{mensaje}}. Gracias por tu comprensión.',
    'Comunicado para {{nombre}}: {{mensaje}}. Contacta con nosotros para más información.',
    'Hola {{nombre}}, {{mensaje}}. Saludos, el equipo de administración.',
  ],
};

// POST - Generar plantillas con IA
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, descripcion } = body;

    if (!tipo) {
      return NextResponse.json({ error: 'Tipo de plantilla requerido' }, { status: 400 });
    }

    // Obtener sugerencias predefinidas
    const baseSuggestions = TEMPLATE_SUGGESTIONS[tipo] || TEMPLATE_SUGGESTIONS['general'];

    // Si hay Anthropic configurado, usar IA para generar
    let aiSuggestion: string | null = null;
    
    if (process.env.ANTHROPIC_API_KEY && descripcion) {
      try {
        const Anthropic = await import('@anthropic-ai/sdk').then(m => m.default);
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Genera UNA plantilla de SMS en español para una empresa de gestión inmobiliaria. 
Tipo: ${tipo}
Descripción: ${descripcion}

Requisitos:
- Máximo 160 caracteres (1 SMS)
- Tono profesional pero cercano
- Usa variables: {{nombre}}, {{monto}}, {{fecha}}, {{edificio}}, {{unidad}}, {{direccion}}, {{hora}}
- Solo devuelve el texto del SMS, nada más.`
          }]
        });

        if (response.content[0].type === 'text') {
          aiSuggestion = response.content[0].text.trim();
        }
      } catch (aiError) {
        console.error('Error con IA:', aiError);
        // Continuar sin IA si hay error
      }
    }

    // Combinar sugerencias
    const suggestions = aiSuggestion 
      ? [aiSuggestion, ...baseSuggestions]
      : baseSuggestions;

    return NextResponse.json({
      success: true,
      suggestions,
      aiGenerated: !!aiSuggestion
    });
  } catch (error) {
    console.error('Error generating templates:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
