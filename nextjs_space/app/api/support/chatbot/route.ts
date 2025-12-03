import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import {
  processUserQuestion,
  searchKnowledgeBase,
  getArticleById
} from '@/lib/intelligent-support-service';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId || '';
    const body = await request.json();
    const { question, action, articleId, query } = body;

    // Procesar pregunta del usuario
    if (action === 'ask') {
      const response = await processUserQuestion(
        question,
        session.user.id,
        companyId
      );
      return NextResponse.json(response);
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
