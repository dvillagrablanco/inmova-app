export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchArticles } from '@/lib/help-center';

const schema = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

/**
 * POST /api/help/chat — Chatbot contextual del Centro de Ayuda
 *
 * Responde preguntas basándose en los artículos del help center.
 * Público (no requiere auth).
 * Sin Anthropic: devuelve artículos sugeridos.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = schema.parse(body);

    // Find relevant articles for context
    const results = searchArticles(message, 5);
    const contextArticles = results.map((r) => ({
      title: r.article.title,
      content: r.article.content.substring(0, 500),
      slug: r.article.slug,
      collection: r.article.collection,
    }));

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Fallback: return suggested articles instead of AI response
      return NextResponse.json({
        response: `He encontrado ${contextArticles.length} artículos que podrían ayudarte:`,
        articles: contextArticles.map((a) => ({
          title: a.title,
          url: `/ayuda/${a.collection}/${a.slug}`,
        })),
        source: 'fallback',
      });
    }

    // AI response with context from articles
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `Eres el asistente del Centro de Ayuda de Inmova, una plataforma PropTech de gestión inmobiliaria.

REGLAS:
- Responde SOLO basándote en el contenido de los artículos proporcionados
- Si no encuentras la respuesta en los artículos, sugiere contactar soporte
- Sé conciso y directo (máximo 3 párrafos)
- Usa español
- Al final de tu respuesta, si es relevante, sugiere artículos con formato: [Título del artículo](/ayuda/coleccion/slug)

ARTÍCULOS DE CONTEXTO:
${contextArticles.map((a) => `--- ${a.title} ---\n${a.content}`).join('\n\n')}`;

    const messages = [
      ...history.slice(-6).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0];
    const reply = text.type === 'text' ? text.text : 'No pude generar una respuesta.';

    return NextResponse.json({
      response: reply,
      articles: contextArticles.map((a) => ({
        title: a.title,
        url: `/ayuda/${a.collection}/${a.slug}`,
      })),
      source: 'ai',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[Help Chat] Error:', error);
    return NextResponse.json(
      { error: 'Error procesando la consulta' },
      { status: 500 }
    );
  }
}
