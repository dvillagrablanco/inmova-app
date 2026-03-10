export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { searchArticles, getAllArticles } from '@/lib/help-center';
import { trackSearch } from '@/lib/help-center/metrics';
import type { HelpArticle } from '@/lib/help-center/types';

/**
 * GET /api/help/search?q=query
 *
 * Búsqueda semántica con IA (Anthropic Claude) con fallback a texto.
 * Público — no requiere autenticación.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], source: 'none', query: q || '' });
  }

  // Track search query
  trackSearch(q);

  // Try AI search first
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const aiResults = await searchWithAI(q, apiKey);
      if (aiResults.length > 0) {
        return NextResponse.json({
          results: aiResults,
          source: 'ai',
          query: q,
        });
      }
    } catch (error) {
      console.warn('[Help Search] AI search failed, falling back to text:', error);
    }
  }

  // Fallback: text search
  const textResults = searchArticles(q, 15);
  return NextResponse.json({
    results: textResults.map((r) => ({
      id: r.article.id,
      slug: r.article.slug,
      title: r.article.title,
      excerpt: r.article.excerpt,
      collection: r.article.collection,
      score: r.score,
      matchField: r.matchField,
    })),
    source: 'text',
    query: q,
  });
}

/**
 * Búsqueda semántica con Claude.
 * Envía la query + catálogo de artículos y pide al modelo que seleccione los más relevantes.
 */
async function searchWithAI(
  query: string,
  apiKey: string
): Promise<Array<{ id: string; slug: string; title: string; excerpt: string; collection: string; score: number; reason: string }>> {
  const articles = getAllArticles();

  // Build compact catalog (id + title + excerpt + tags) to fit in context
  const catalog = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    collection: a.collection,
    tags: a.tags.join(', '),
  }));

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Eres el buscador del Centro de Ayuda de Inmova (plataforma PropTech de gestión inmobiliaria).

El usuario busca: "${query}"

Catálogo de artículos disponibles (JSON):
${JSON.stringify(catalog, null, 0)}

Selecciona los 10 artículos MÁS relevantes para la búsqueda del usuario. Ordénalos de más a menos relevante.

Responde SOLO con un JSON array (sin markdown, sin explicación):
[{"id":"...","reason":"una frase breve de por qué es relevante"}]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') return [];

  // Parse the AI response
  const text = content.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const aiPicks: Array<{ id: string; reason: string }> = JSON.parse(jsonMatch[0]);

  // Map AI picks back to full articles
  const articleMap = new Map<string, HelpArticle>();
  for (const a of articles) {
    articleMap.set(a.id, a);
  }

  return aiPicks
    .filter((pick) => articleMap.has(pick.id))
    .map((pick, index) => {
      const a = articleMap.get(pick.id)!;
      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        collection: a.collection,
        score: 100 - index * 10,
        reason: pick.reason,
      };
    });
}
