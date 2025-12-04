import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledgeBase, searchFAQs, getArticleById, knowledgeBase, faqs } from '@/lib/knowledge-base';
import logger from '@/lib/logger';

interface ConversationMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  emotions: string[];
  suggestedTone?: string;
}

// Función para analizar el sentimiento usando LLM
async function analyzeSentiment(userMessage: string): Promise<SentimentAnalysis> {
  try {
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
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
            content: `Eres un experto en análisis de sentimientos. Analiza el tono emocional del mensaje del usuario y responde SOLO con JSON puro, sin bloques de código ni markdown.

Formato exacto de respuesta:
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": 0.0 a 1.0,
  "urgency": "low" | "medium" | "high" | "critical",
  "emotions": ["feliz", "frustrado", etc],
  "suggestedTone": "empathetic" | "professional" | "casual"
}`
          },
          {
            role: 'user',
            content: `Analiza este mensaje: "${userMessage}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('Error al analizar sentimiento');
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    return analysis;
  } catch (error) {
    logger.error('Error analyzing sentiment:', error);
    // Retornar análisis neutral por defecto
    return {
      sentiment: 'neutral',
      score: 0.5,
      urgency: 'low',
      emotions: [],
      suggestedTone: 'professional'
    };
  }
}

// Función para categorizar la pregunta
function categorizeQuestion(question: string): string {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('pago') || lowerQ.includes('cobro') || lowerQ.includes('dinero')) return 'Pagos';
  if (lowerQ.includes('contrato') || lowerQ.includes('firma')) return 'Contratos';
  if (lowerQ.includes('edificio') || lowerQ.includes('propiedad')) return 'Edificios';
  if (lowerQ.includes('inquilino') || lowerQ.includes('arrendatario')) return 'Inquilinos';
  if (lowerQ.includes('mantenimiento') || lowerQ.includes('reparación') || lowerQ.includes('avería')) return 'Mantenimiento';
  if (lowerQ.includes('reporte') || lowerQ.includes('informe') || lowerQ.includes('estadística')) return 'Reportes';
  if (lowerQ.includes('habitación') || lowerQ.includes('compartido')) return 'Habitaciones';
  if (lowerQ.includes('seguridad') || lowerQ.includes('privacidad') || lowerQ.includes('datos')) return 'Seguridad';
  if (lowerQ.includes('api') || lowerQ.includes('integración')) return 'Integraciones';
  if (lowerQ.includes('automatizar') || lowerQ.includes('automático')) return 'Automatización';
  
  return 'General';
}

// Función para generar acciones sugeridas basadas en la categoría
function generateSuggestedActions(category: string, sentiment: SentimentAnalysis) {
  const actions = [];
  
  switch (category) {
    case 'Pagos':
      actions.push(
        { id: 'act-1', label: 'Ver Pagos Pendientes', action: 'navigate:/pagos', icon: 'ExternalLink' },
        { id: 'act-2', label: 'Configurar Pago Automático', action: 'navigate:/pagos/configurar', icon: 'ExternalLink' }
      );
      break;
    case 'Contratos':
      actions.push(
        { id: 'act-3', label: 'Crear Nuevo Contrato', action: 'navigate:/contratos/nuevo', icon: 'ExternalLink' },
        { id: 'act-4', label: 'Ver Mis Contratos', action: 'navigate:/contratos', icon: 'ExternalLink' }
      );
      break;
    case 'Edificios':
      actions.push(
        { id: 'act-5', label: 'Añadir Edificio', action: 'navigate:/edificios/nuevo', icon: 'ExternalLink' },
        { id: 'act-6', label: 'Ver Edificios', action: 'navigate:/edificios', icon: 'ExternalLink' }
      );
      break;
    case 'Inquilinos':
      actions.push(
        { id: 'act-7', label: 'Registrar Inquilino', action: 'navigate:/inquilinos/nuevo', icon: 'ExternalLink' },
        { id: 'act-8', label: 'Ver Inquilinos', action: 'navigate:/inquilinos', icon: 'ExternalLink' }
      );
      break;
    case 'Mantenimiento':
      actions.push(
        { id: 'act-9', label: 'Reportar Incidencia', action: 'navigate:/mantenimiento/nuevo', icon: 'ExternalLink' },
        { id: 'act-10', label: 'Ver Incidencias', action: 'navigate:/mantenimiento', icon: 'ExternalLink' }
      );
      break;
    case 'Reportes':
      actions.push(
        { id: 'act-11', label: 'Ver Dashboard BI', action: 'navigate:/bi', icon: 'ExternalLink' },
        { id: 'act-12', label: 'Generar Reporte', action: 'navigate:/reportes', icon: 'ExternalLink' }
      );
      break;
  }
  
  // Si la urgencia es alta o crítica, sugerir crear ticket
  if (sentiment.urgency === 'high' || sentiment.urgency === 'critical') {
    actions.push({
      id: 'act-ticket',
      label: 'Crear Ticket de Soporte',
      action: 'create_ticket',
      icon: 'Ticket'
    });
  }
  
  // Siempre ofrecer la base de conocimiento
  actions.push({
    id: 'act-kb',
    label: 'Ver Base de Conocimiento',
    action: 'navigate:/knowledge-base',
    icon: 'BookOpen'
  });
  
  return actions.slice(0, 3); // Máximo 3 acciones
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, question, conversationHistory, articleId } = body;

    // Acción: Obtener artículo completo
    if (action === 'get_article' && articleId) {
      const article = getArticleById(articleId);
      if (!article) {
        return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ article });
    }

    // Acción: Responder pregunta
    if (action === 'ask' && question) {
      // 1. Analizar sentimiento en paralelo con búsqueda
      const [sentimentAnalysis, relevantArticles, relevantFAQs] = await Promise.all([
        analyzeSentiment(question),
        Promise.resolve(searchKnowledgeBase(question, 3)),
        Promise.resolve(searchFAQs(question, 2))
      ]);

      // 2. Categorizar la pregunta
      const category = categorizeQuestion(question);

      // 3. Construir contexto para el LLM
      const context = [
        '# Información de la base de conocimiento relevante:',
        '',
        ...relevantArticles.map(article => 
          `## ${article.title}\n${article.excerpt}`
        ),
        '',
        '# FAQs relevantes:',
        '',
        ...relevantFAQs.map(faq => 
          `P: ${faq.question}\nR: ${faq.answer}`
        ),
        '',
        `# Categoría detectada: ${category}`,
        `# Sentimiento: ${sentimentAnalysis.sentiment} (Urgencia: ${sentimentAnalysis.urgency})`
      ].join('\n');

      // 4. Construir historial de conversación
      const conversationContext = conversationHistory
        ? conversationHistory.map((msg: ConversationMessage) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        : [];

      // 5. Determinar el tono de respuesta
      const tone = sentimentAnalysis.sentiment === 'negative' || sentimentAnalysis.urgency === 'high' 
        ? 'empático y comprensivo' 
        : sentimentAnalysis.sentiment === 'positive'
        ? 'entusiasta y amigable'
        : 'profesional y claro';

      // 6. Llamar al LLM para generar respuesta
      const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
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
              content: `Eres el asistente inteligente de INMOVA, una plataforma de gestión inmobiliaria.

Tu objetivo es ayudar a los usuarios a resolver sus dudas de forma clara y efectiva.

Directrices:
- Usa un tono ${tone}
- Sé conciso pero completo (máximo 200 palabras)
- Usa la información del contexto proporcionado
- Si no sabes algo, reconocélo y sugiere crear un ticket de soporte
- Usa emojis ocasionalmente para hacer la conversación más amigable
- Estructura tu respuesta con saltos de línea para mejor legibilidad
- Si detectas frustación, muestra empatía y ofrece ayuda personalizada

Contexto disponible:
${context}`
            },
            ...conversationContext,
            {
              role: 'user',
              content: question
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!llmResponse.ok) {
        throw new Error('Error al generar respuesta');
      }

      const llmData = await llmResponse.json();
      const botMessage = llmData.choices[0].message.content;

      // 7. Calcular confianza basada en la relevancia de los artículos encontrados
      const confidence = relevantArticles.length > 0 || relevantFAQs.length > 0 ? 0.85 : 0.60;

      // 8. Generar acciones sugeridas
      const suggestedActions = generateSuggestedActions(category, sentimentAnalysis);

      // 9. Preparar artículos relacionados
      const relatedArticles = relevantArticles.map(article => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        videoUrl: article.videoUrl
      }));

      return NextResponse.json({
        message: botMessage,
        confidence,
        suggestedActions,
        relatedArticles: relatedArticles.length > 0 ? relatedArticles : undefined,
        sentimentAnalysis,
        category
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    logger.error('Error in chatbot API:', error);
    return NextResponse.json(
      { error: 'Error procesando tu solicitud' },
      { status: 500 }
    );
  }
}
