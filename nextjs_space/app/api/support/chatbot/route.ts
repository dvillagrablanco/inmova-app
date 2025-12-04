import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import {
  processUserQuestion,
  searchKnowledgeBase,
  getArticleById
} from '@/lib/intelligent-support-service';
import { analyzeSentiment, ConversationContext } from '@/lib/sentiment-analysis-service';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId || '';
    const body = await request.json();
    const { question, action, articleId, query, conversationHistory } = body;

    // Procesar pregunta del usuario
    if (action === 'ask') {
      // Analizar sentimiento del mensaje
      const context: ConversationContext = {};
      if (conversationHistory && Array.isArray(conversationHistory)) {
        context.previousMessages = conversationHistory.slice(-5); // últimos 5 mensajes
      }

      const sentimentAnalysis = await analyzeSentiment(question, context);
      
      logger.info('Análisis de sentimiento completado', {
        userId: session.user.id,
        sentiment: sentimentAnalysis.sentiment,
        urgency: sentimentAnalysis.urgency,
        emotions: sentimentAnalysis.emotions,
      });

      // Procesar respuesta del chatbot
      const response = await processUserQuestion(
        question,
        session.user.id,
        companyId,
        sentimentAnalysis
      );

      // Incluir análisis de sentimiento en la respuesta
      return NextResponse.json({
        ...response,
        sentimentAnalysis: {
          sentiment: sentimentAnalysis.sentiment,
          score: sentimentAnalysis.score,
          urgency: sentimentAnalysis.urgency,
          emotions: sentimentAnalysis.emotions,
          suggestedTone: sentimentAnalysis.suggestedTone,
        },
      });
    }

    // Buscar en base de conocimientos
    if (action === 'search') {
      const results = searchKnowledgeBase(query || question);
      return NextResponse.json({ results });
    }

    // Obtener artículo específico
    if (action === 'get_article') {
      const article = getArticleById(articleId);
      if (!article) {
        return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ article });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    logger.error('Error in chatbot:', error);
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}
