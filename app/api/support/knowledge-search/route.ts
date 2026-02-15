import { requireSession } from '@/lib/api-auth-guard';
import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/knowledge-base-data';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';


/**
 * API para buscar en la base de conocimientos usando IA
 */
export async function POST(request: NextRequest) {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
  try {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Primero buscar con el método tradicional basado en keywords
    const keywordResults = searchArticles(query);

    // Luego usar IA para refinar y mejorar los resultados
    const systemPrompt = `Eres un asistente experto en búsqueda de documentación.

Dada una consulta del usuario y una lista de artículos encontrados, evalúa la relevancia de cada artículo.

Responde en JSON con la siguiente estructura:
{
  "refinedQuery": "Versión mejorada de la consulta",
  "results": [
    {
      "id": "id_del_articulo",
      "relevance": 0.95,
      "reason": "Razón de relevancia"
    }
  ]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const userMessage = `Consulta del usuario: "${query}"\n\nArtículos encontrados:\n${keywordResults
      .map(
        (article, idx) =>
          `${idx + 1}. ${article.title} (ID: ${article.id})\n   ${article.excerpt}`
      )
      .join('\n\n')}`;

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
      // Si falla la IA, devolver resultados basados en keywords
      return NextResponse.json({
        results: keywordResults.map((article, index) => ({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          relevance: 1 - (index * 0.1), // Relevancia descendente
          url: `/knowledge-base/${article.id}`,
        })),
      });
    }

    const data = await llmResponse.json();
    const aiResult = JSON.parse(data.choices[0].message.content);

    // Combinar resultados de IA con datos originales
    const finalResults = aiResult.results
      .map((aiArticle: any) => {
        const originalArticle = keywordResults.find(a => a.id === aiArticle.id);
        if (!originalArticle) return null;

        return {
          id: originalArticle.id,
          title: originalArticle.title,
          excerpt: originalArticle.excerpt,
          relevance: aiArticle.relevance,
          url: `/knowledge-base/${originalArticle.id}`,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      results: finalResults,
      refinedQuery: aiResult.refinedQuery,
    });
  } catch (error) {
    logger.error('Error searching knowledge base:', error);
    // Fallback a búsqueda simple
    const fallbackResults = searchArticles('');
    return NextResponse.json({
      results: fallbackResults.slice(0, 5).map((article, index) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        relevance: 1 - (index * 0.1),
        url: `/knowledge-base/${article.id}`,
      })),
    });
  }
}
