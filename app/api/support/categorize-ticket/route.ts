import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/knowledge-base-data';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * API para categorizar automáticamente tickets de soporte usando IA
 */
export async function POST(request: NextRequest) {
  try {
    const { subject, description, attachments } = await request.json();

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
    }

    const systemPrompt = `Eres un experto en soporte técnico de software de gestión inmobiliaria.

Analiza el ticket de soporte y determina:
1. Categoría: "technical", "billing", "feature_request", "bug", "training", "general"
2. Prioridad: "low", "medium", "high", "urgent"
3. Si puedes, genera una respuesta automática que resuelva el problema

Responde en JSON con la siguiente estructura:
{
  "category": "nombre_categoria",
  "priority": "nivel_prioridad",
  "suggestedAssignee": "equipo o persona" (opcional),
  "autoResponse": "Respuesta automática si aplica" (opcional),
  "tags": ["tag1", "tag2"]
}

Criterios de prioridad:
- urgent: Sistema caído, pérdida de datos, problema crítico en producción
- high: Funcionalidad importante no disponible, muchos usuarios afectados
- medium: Problema que tiene workaround, features requests importantes
- low: Preguntas generales, mejoras cosméticas

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const userMessage = `Asunto: ${subject}\n\nDescripción: ${description}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    // Llamada al LLM API
    const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error('Error calling LLM API');
    }

    const data = await llmResponse.json();
    const result = JSON.parse(data.choices[0].message.content);

    // Buscar artículos relacionados en la base de conocimientos
    const query = `${subject} ${description}`;
    const articles = searchArticles(query);
    const relatedArticles = articles.slice(0, 3).map((article) => ({
      title: article.title,
      url: `/knowledge-base/${article.id}`,
    }));

    return NextResponse.json({
      ...result,
      relatedArticles,
    });
  } catch (error) {
    logger.error('Error categorizing ticket:', error);
    return NextResponse.json(
      {
        category: 'general',
        priority: 'medium',
        relatedArticles: [],
      },
      { status: 200 }
    );
  }
}
