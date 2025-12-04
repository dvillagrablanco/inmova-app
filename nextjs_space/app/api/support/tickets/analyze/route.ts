import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledgeBase, searchFAQs } from '@/lib/knowledge-base';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { subject, description } = await request.json();
    const fullText = `${subject} ${description}`;

    // 1. Llamar a LLM para analizar y categorizar
    const analysisResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un sistema experto en soporte técnico para una plataforma de gestión inmobiliaria.

Analiza el problema del usuario y responde SOLO con JSON puro:

{
  "category": "Pagos" | "Contratos" | "Edificios" | "Inquilinos" | "Mantenimiento" | "Reportes" | "Técnico" | "Otro",
  "priority": "low" | "medium" | "high" | "critical",
  "autoResolvable": true | false,
  "confidence": 0.0 a 1.0,
  "keywords": ["palabra1", "palabra2"],
  "suggestedSolution": "Descripción de la solución si es auto-resoluble",
  "reasoning": "Breve explicación del análisis"
}`
          },
          {
            role: 'user',
            content: `Analiza este problema:\n\nAsunto: ${subject}\n\nDescripción: ${description}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!analysisResponse.ok) {
      throw new Error('Error al analizar ticket');
    }

    const analysisData = await analysisResponse.json();
    const analysis = JSON.parse(analysisData.choices[0].message.content);

    // 2. Buscar en la base de conocimiento
    const relevantArticles = searchKnowledgeBase(fullText, 3);
    const relevantFAQs = searchFAQs(fullText, 2);

    // 3. Si es auto-resoluble, generar solución detallada
    let detailedSolution = analysis.suggestedSolution;
    
    if (analysis.autoResolvable && analysis.confidence > 0.7) {
      // Construir contexto con artículos y FAQs
      const context = [
        ...relevantArticles.map(a => `Artículo: ${a.title}\n${a.excerpt}`),
        ...relevantFAQs.map(f => `FAQ: ${f.question}\nRespuesta: ${f.answer}`)
      ].join('\n\n');

      const solutionResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: `Eres un asistente experto en INMOVA. Proporciona una solución paso a paso clara y concisa.

Contexto disponible:
${context}`
            },
            {
              role: 'user',
              content: `Proporciona una solución detallada paso a paso para este problema:

Asunto: ${subject}
Descripción: ${description}

Máximo 200 palabras, paso a paso numerado.`
            }
          ],
          temperature: 0.7,
          max_tokens: 400
        })
      });

      if (solutionResponse.ok) {
        const solutionData = await solutionResponse.json();
        detailedSolution = solutionData.choices[0].message.content;
      }
    }

    // 4. Preparar respuesta
    const response = {
      category: analysis.category,
      priority: analysis.priority,
      suggestions: {
        title: `Solución sugerida: ${subject}`,
        solution: detailedSolution,
        confidence: analysis.confidence,
        autoResolvable: analysis.autoResolvable && analysis.confidence > 0.7,
        relatedArticles: relevantArticles.slice(0, 3).map(a => ({
          id: a.id,
          title: a.title
        }))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error analyzing ticket:', error);
    return NextResponse.json(
      { error: 'Error al analizar el ticket' },
      { status: 500 }
    );
  }
}
