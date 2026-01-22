import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';
import * as ClaudeAIService from '@/lib/claude-ai-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Base de conocimientos simplificada (en producción vendría de la BD)
const KNOWLEDGE_BASE: Record<string, any> = {
  'crear_edificio': {
    id: 'crear_edificio',
    title: '¿Cómo crear un edificio?',
    excerpt: 'Aprende a registrar tu primera propiedad en INMOVA',
    content: `Para crear un edificio:
1. Ve a Edificios > Nuevo Edificio
2. Completa los datos básicos (nombre, dirección, tipo)
3. Añade detalles como número de plantas, año de construcción
4. Opcionalmente sube fotos y documentos
5. Guarda y comienza a añadir unidades`,
    keywords: ['edificio', 'propiedad', 'inmueble', 'crear', 'nuevo', 'registrar'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['crear_unidad', 'gestionar_propiedades']
  },
  'crear_unidad': {
    id: 'crear_unidad',
    title: '¿Cómo añadir unidades?',
    excerpt: 'Configura apartamentos, locales y habitaciones',
    content: `Para añadir unidades a un edificio:
1. Entra al edificio desde la lista
2. Haz clic en "Añadir Unidad"
3. Define el tipo (apartamento, local, habitación)
4. Establece características (m², habitaciones, baños)
5. Configura precio de renta
6. Guarda la unidad`,
    keywords: ['unidad', 'apartamento', 'piso', 'habitación', 'local', 'añadir', 'crear'],
    relatedArticles: ['crear_edificio', 'asignar_inquilino']
  },
  'asignar_inquilino': {
    id: 'asignar_inquilino',
    title: '¿Cómo gestionar inquilinos?',
    excerpt: 'Registra y administra tus inquilinos',
    content: `Para gestionar inquilinos:
1. Ve a Inquilinos > Nuevo Inquilino
2. Completa datos personales y contacto
3. Realiza el screening de solvencia (opcional)
4. Asigna a una unidad disponible
5. Crea un contrato de alquiler
6. Configura métodos de pago`,
    keywords: ['inquilino', 'arrendatario', 'tenant', 'asignar', 'registrar', 'screening'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['crear_contrato', 'pagos_online']
  },
  'crear_contrato': {
    id: 'crear_contrato',
    title: '¿Cómo crear contratos?',
    excerpt: 'Genera contratos de alquiler automáticamente',
    content: `Para crear un contrato:
1. Ve a Contratos > Nuevo Contrato
2. Selecciona inquilino y unidad
3. Define fechas de inicio y fin
4. Establece renta mensual y depósito
5. Añade cláusulas personalizadas (opcional)
6. Genera el PDF automáticamente
7. Envía para firma digital`,
    keywords: ['contrato', 'alquiler', 'arrendamiento', 'crear', 'generar', 'pdf'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['firma_digital', 'pagos_online']
  },
  'pagos_online': {
    id: 'pagos_online',
    title: 'Pagos online con Stripe',
    excerpt: 'Cobra rentas automáticamente',
    content: `INMOVA incluye integración con Stripe para pagos:
1. Los inquilinos pueden pagar desde su portal
2. Configura pagos recurrentes automáticos
3. Recibe notificaciones de pagos exitosos
4. Registra todos los movimientos automáticamente
5. Exporta a tu software contable`,
    keywords: ['pago', 'renta', 'cobro', 'stripe', 'automático', 'recurrente'],
    relatedArticles: ['crear_contrato', 'portal_inquilino']
  },
  'portal_inquilino': {
    id: 'portal_inquilino',
    title: 'Portal del Inquilino',
    excerpt: 'Autoservicio para tus inquilinos',
    content: `El portal del inquilino permite:
1. Ver pagos pendientes y realizados
2. Pagar online con tarjeta
3. Reportar incidencias de mantenimiento
4. Descargar documentos y recibos
5. Comunicarse con la administración
6. Ver información de su contrato`,
    keywords: ['portal', 'inquilino', 'autoservicio', 'pago', 'incidencia'],
    relatedArticles: ['pagos_online', 'mantenimiento']
  },
  'mantenimiento': {
    id: 'mantenimiento',
    title: 'Gestión de mantenimiento',
    excerpt: 'Mantenimiento correctivo y preventivo',
    content: `Sistema de mantenimiento:
1. Inquilinos pueden reportar incidencias
2. Asigna tareas a proveedores
3. Trackea estado en tiempo real
4. Programa mantenimiento preventivo
5. Registra costos y materiales
6. Histórico completo por unidad`,
    keywords: ['mantenimiento', 'reparación', 'incidencia', 'preventivo', 'correctivo'],
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
    relatedArticles: ['proveedores', 'ordenes_trabajo']
  },
  'pricing': {
    id: 'pricing',
    title: 'Precios de INMOVA',
    excerpt: 'Planes y tarifas',
    content: `INMOVA ofrece un plan único todo incluido:
- €149/mes - Empresas (todas las funciones)
- €49/mes - Propietarios individuales
- Sin límite de propiedades
- Sin límite de usuarios
- 88 módulos incluidos
- Soporte 24/7
- Prueba gratis 30 días`,
    keywords: ['precio', 'tarifa', 'plan', 'costo', 'suscripción', 'prueba'],
    relatedArticles: ['comparativa', 'demo']
  },
  'comparativa': {
    id: 'comparativa',
    title: 'INMOVA vs Competencia',
    excerpt: 'Por qué elegir INMOVA',
    content: `Ventajas de INMOVA:
- 88 módulos vs 15-30 de la competencia
- Precio 60% más bajo
- Multi-vertical (7 modelos de negocio)
- IA integrada en todos los módulos
- Sin cobros por usuario adicional
- Sin límites artificiales
- Soporte en español 24/7`,
    keywords: ['comparar', 'ventaja', 'competencia', 'mejor', 'diferencia'],
    relatedArticles: ['pricing', 'demo']
  },
  'demo': {
    id: 'demo',
    title: 'Solicitar demo',
    excerpt: 'Agenda una demostración personalizada',
    content: `Para agendar una demo:
1. Visita https://inmova.app/landing/contacto
2. Completa el formulario de contacto
3. Nuestro equipo te contactará en <24h
4. Agenda la demo en el horario que prefieras
5. Recibe acceso de prueba 30 días gratis

O escríbenos a: contacto@inmova.app`,
    keywords: ['demo', 'demostración', 'prueba', 'test', 'contacto', 'agendar'],
    relatedArticles: ['pricing', 'soporte']
  }
};

// Análisis de sentimiento simplificado
function analyzeSentiment(text: string): any {
  const lowerText = text.toLowerCase();
  
  // Palabras clave para urgencia
  const criticalWords = ['urgente', 'inmediato', 'crítico', 'emergencia', 'ya', 'ahora'];
  const highWords = ['problema', 'error', 'fallo', 'no funciona', 'ayuda'];
  const negativeWords = ['no puedo', 'mal', 'malo', 'terrible', 'pésimo', 'difícil'];
  const positiveWords = ['gracias', 'excelente', 'perfecto', 'genial', 'bien', 'bueno'];
  
  let urgency = 'low';
  let sentiment = 'neutral';
  let score = 0.5;
  let emotions: string[] = [];
  
  // Detectar urgencia
  if (criticalWords.some(word => lowerText.includes(word))) {
    urgency = 'critical';
    emotions.push('Preocupado');
  } else if (highWords.some(word => lowerText.includes(word))) {
    urgency = 'high';
    emotions.push('Frustrado');
  } else if (lowerText.includes('cuando') || lowerText.includes('cómo')) {
    urgency = 'medium';
    emotions.push('Curioso');
  }
  
  // Detectar sentimiento
  const negCount = negativeWords.filter(word => lowerText.includes(word)).length;
  const posCount = positiveWords.filter(word => lowerText.includes(word)).length;
  
  if (posCount > negCount) {
    sentiment = 'positive';
    score = 0.8;
    emotions.push('Satisfecho');
  } else if (negCount > posCount) {
    sentiment = 'negative';
    score = 0.2;
    emotions.push('Insatisfecho');
  }
  
  return {
    sentiment,
    score,
    urgency,
    emotions,
    suggestedTone: sentiment === 'negative' ? 'Empático y proactivo' : 'Amigable y eficiente'
  };
}

// Buscar en la base de conocimientos
function searchKnowledgeBase(query: string): any[] {
  const lowerQuery = query.toLowerCase();
  const results: any[] = [];
  
  for (const [key, article] of Object.entries(KNOWLEDGE_BASE)) {
    let score = 0;
    
    // Buscar en keywords
    for (const keyword of article.keywords) {
      if (lowerQuery.includes(keyword)) {
        score += 2;
      }
    }
    
    // Buscar en título
    if (article.title.toLowerCase().includes(lowerQuery) || 
        lowerQuery.includes(article.title.toLowerCase())) {
      score += 3;
    }
    
    if (score > 0) {
      results.push({ ...article, relevanceScore: score });
    }
  }
  
  // Ordenar por relevancia
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return results.slice(0, 3);
}

// Generar respuesta con IA (Claude) cuando esté disponible
async function generateAIResponse(query: string, conversationHistory: any[], userContext: string): Promise<string | null> {
  try {
    if (!ClaudeAIService.isClaudeConfigured()) {
      logger.info('[Chatbot] Claude no configurado, usando respuestas predefinidas');
      return null;
    }
    
    const systemPrompt = `Eres el asistente inteligente de INMOVA, una plataforma de gestión inmobiliaria PropTech.

Tu rol es ayudar a usuarios con:
- Gestión de edificios, unidades y propiedades
- Registro y gestión de inquilinos  
- Creación y gestión de contratos
- Pagos y cobros de alquiler
- Mantenimiento e incidencias
- Cualquier duda sobre la plataforma

Contexto del usuario: ${userContext}

Reglas importantes:
1. Responde SIEMPRE en español
2. Sé conciso y útil (máximo 200 palabras)
3. Si no sabes algo, sugiere contactar con soporte
4. Incluye pasos concretos cuando sea posible
5. Usa emojis ocasionalmente para ser más amigable
6. Si detectas frustración, sé especialmente empático

Información de la plataforma:
- Precio: €149/mes empresas, €49/mes particulares
- Incluye: 88 módulos, usuarios ilimitados, soporte 24/7
- Funciones clave: gestión propiedades, inquilinos, contratos, pagos, mantenimiento, IA integrada`;

    // Convertir historial de conversación al formato de Claude
    const history = conversationHistory.slice(-6).map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.text
    }));

    const response = await ClaudeAIService.chat(query, {
      systemPrompt,
      maxTokens: 500,
      temperature: 0.7
    });

    return response;
  } catch (error) {
    logger.error('[Chatbot] Error con Claude AI:', error);
    return null;
  }
}

// Generar respuesta inteligente (con fallback a respuestas predefinidas)
async function generateResponse(query: string, results: any[], sentiment: any, conversationHistory: any[] = [], userContext: string = ''): Promise<any> {
  const lowerQuery = query.toLowerCase();
  
  // Detectar intención
  let intent = 'general';
  let response = '';
  let confidence = 0.5;
  const suggestedActions: any[] = [];
  let usedAI = false;
  
  // Intentar respuesta con IA primero para consultas complejas
  const isComplexQuery = !lowerQuery.match(/^(hola|buenos días|buenas tardes|hey|hi|gracias|ok|vale|sí|no)$/i);
  
  if (isComplexQuery) {
    const aiResponse = await generateAIResponse(query, conversationHistory, userContext);
    if (aiResponse) {
      response = aiResponse;
      confidence = 0.9;
      intent = 'ai_response';
      usedAI = true;
      
      // Añadir acciones relevantes según el contenido
      if (lowerQuery.includes('inquilino') || lowerQuery.includes('tenant')) {
        suggestedActions.push(
          { id: '1', label: 'Ir a Inquilinos', action: 'navigate:/inquilinos', icon: 'ExternalLink' },
          { id: '2', label: 'Nuevo Inquilino', action: 'navigate:/inquilinos/nuevo', icon: 'BookOpen' }
        );
      } else if (lowerQuery.includes('edificio') || lowerQuery.includes('propiedad')) {
        suggestedActions.push(
          { id: '1', label: 'Ir a Edificios', action: 'navigate:/edificios', icon: 'ExternalLink' },
          { id: '2', label: 'Nuevo Edificio', action: 'navigate:/edificios/nuevo', icon: 'BookOpen' }
        );
      } else if (lowerQuery.includes('contrato')) {
        suggestedActions.push(
          { id: '1', label: 'Ir a Contratos', action: 'navigate:/contratos', icon: 'ExternalLink' },
          { id: '2', label: 'Nuevo Contrato', action: 'navigate:/contratos/nuevo', icon: 'BookOpen' }
        );
      } else if (lowerQuery.includes('pago') || lowerQuery.includes('cobr')) {
        suggestedActions.push(
          { id: '1', label: 'Ver Pagos', action: 'navigate:/pagos', icon: 'ExternalLink' },
          { id: '2', label: 'Ir a Finanzas', action: 'navigate:/finanzas', icon: 'BookOpen' }
        );
      }
    }
  }
  
  // Fallback a respuestas predefinidas si IA no disponible o para saludos simples
  if (!usedAI) {
    // Saludos
    if (lowerQuery.match(/hola|buenos días|buenas tardes|hey|hi/)) {
      response = '¡Hola! 👋 Soy el asistente IA de INMOVA. Estoy aquí para ayudarte con cualquier duda sobre la plataforma. ¿En qué puedo asistirte hoy?';
      confidence = 1.0;
      intent = 'greeting';
      
      suggestedActions.push(
        { id: '1', label: 'Ver tutoriales', action: 'navigate:/help', icon: 'BookOpen' },
        { id: '2', label: 'Contactar soporte', action: 'create_ticket', icon: 'Ticket' }
      );
    }
    // Pricing
    else if (lowerQuery.match(/precio|costo|tarifa|plan|cuanto|pagar/)) {
      response = '💰 INMOVA tiene un plan único de €149/mes para empresas con TODO incluido: 88 módulos, usuarios ilimitados, propiedades ilimitadas y soporte 24/7. También ofrecemos €49/mes para propietarios individuales. ¡Prueba gratis 30 días!';
      confidence = 0.95;
      intent = 'pricing';
      
      suggestedActions.push(
        { id: '1', label: 'Ver detalles de precios', action: 'navigate:/landing', icon: 'ExternalLink' },
        { id: '2', label: 'Iniciar prueba gratis', action: 'navigate:/register', icon: 'Ticket' }
      );
    }
    // Crear/Añadir
    else if (lowerQuery.match(/crear|añadir|agregar|nuevo|registrar/)) {
      if (lowerQuery.includes('edificio') || lowerQuery.includes('propiedad') || lowerQuery.includes('inmueble')) {
        response = '🏢 Para crear un edificio, ve a Edificios > Nuevo Edificio. Completa los datos básicos (nombre, dirección, tipo) y ¡listo! Te recomiendo ver el video tutorial para una guía paso a paso.';
        confidence = 0.9;
        intent = 'how_to';
        
        suggestedActions.push(
          { id: '1', label: 'Crear edificio ahora', action: 'navigate:/edificios/nuevo', icon: 'ExternalLink' },
          { id: '2', label: 'Ver tutorial', action: 'play_video:https://www.youtube.com/embed/zm55Gdl5G1Q', icon: 'BookOpen' }
        );
      } else if (lowerQuery.includes('unidad') || lowerQuery.includes('apartamento') || lowerQuery.includes('piso')) {
        response = '🏠 Para añadir unidades, primero debes tener un edificio creado. Luego ve a Unidades > Nueva Unidad, selecciona el edificio y completa los datos (tipo, m², habitaciones, precio).';
        confidence = 0.9;
        intent = 'how_to';
        
        suggestedActions.push(
          { id: '1', label: 'Crear unidad', action: 'navigate:/unidades/nuevo', icon: 'ExternalLink' },
          { id: '2', label: 'Ver mis edificios', action: 'navigate:/edificios', icon: 'BookOpen' }
        );
      } else if (lowerQuery.includes('inquilino') || lowerQuery.includes('tenant')) {
        response = '👤 Para registrar un inquilino:\n\n1. Ve a Inquilinos > Nuevo Inquilino\n2. Completa datos personales (nombre, email, teléfono, DNI)\n3. Opcionalmente sube documentos\n4. Guarda y podrás asignarlo a una unidad\n\n¡Te guío paso a paso si necesitas!';
        confidence = 0.9;
        intent = 'how_to';
        
        suggestedActions.push(
          { id: '1', label: 'Registrar inquilino', action: 'navigate:/inquilinos/nuevo', icon: 'ExternalLink' },
          { id: '2', label: 'Ver screening', action: 'navigate:/screening', icon: 'BookOpen' }
        );
      } else if (lowerQuery.includes('contrato')) {
        response = '📝 Para crear un contrato:\n\n1. Ve a Contratos > Nuevo Contrato\n2. Selecciona inquilino y unidad\n3. Define fechas, renta y depósito\n4. Añade cláusulas (opcional)\n5. Genera PDF automáticamente\n6. Envía para firma digital';
        confidence = 0.9;
        intent = 'how_to';
        
        suggestedActions.push(
          { id: '1', label: 'Crear contrato', action: 'navigate:/contratos/nuevo', icon: 'ExternalLink' },
          { id: '2', label: 'Ver firma digital', action: 'navigate:/firma-digital', icon: 'BookOpen' }
        );
      } else {
        response = '🛠️ Puedo ayudarte a crear:\n\n• Edificios y propiedades\n• Unidades (pisos, locales, habitaciones)\n• Inquilinos\n• Contratos de alquiler\n• Tareas y recordatorios\n\n¿Qué te gustaría crear específicamente?';
        confidence = 0.6;
      }
    }
    // Problemas/Errores
    else if (lowerQuery.match(/problema|error|fallo|no funciona|no puedo|ayuda/)) {
      response = '😟 Lamento que estés teniendo problemas. Para ayudarte mejor:\n\n1. ¿Qué acción intentabas realizar?\n2. ¿Qué mensaje de error aparece?\n\nMientras tanto, prueba a refrescar la página o cerrar y abrir sesión.';
      confidence = 0.7;
      intent = 'support';
      
      suggestedActions.push(
        { id: '1', label: 'Crear ticket de soporte', action: 'create_ticket', icon: 'Ticket' },
        { id: '2', label: 'Ver FAQs', action: 'navigate:/help', icon: 'BookOpen' },
        { id: '3', label: 'Hablar con humano', action: 'navigate:/chat', icon: 'MessageCircle' }
      );
    }
    // Respuesta basada en búsqueda en knowledge base
    else if (results.length > 0) {
      const topResult = results[0];
      response = `📚 Encontré información relevante:\n\n${topResult.content.substring(0, 300)}...\n\nPuedes ver más detalles en los artículos relacionados.`;
      confidence = Math.min(0.8, topResult.relevanceScore / 5);
      intent = 'knowledge_base';
      
      if (topResult.videoUrl) {
        suggestedActions.push(
          { id: '1', label: 'Ver tutorial en video', action: `play_video:${topResult.videoUrl}`, icon: 'BookOpen' }
        );
      }
    }
    // Respuesta genérica
    else {
      response = '🤔 No estoy seguro de cómo responder a eso específicamente. Te recomiendo:\n\n1. Consultar la sección de Ayuda\n2. Ver los tutoriales en video\n3. Crear un ticket de soporte\n\n¿Puedo ayudarte con algo más concreto?';
      confidence = 0.3;
      
      suggestedActions.push(
        { id: '1', label: 'Ver ayuda', action: 'navigate:/help', icon: 'BookOpen' },
        { id: '2', label: 'Crear ticket', action: 'create_ticket', icon: 'Ticket' },
        { id: '3', label: 'Contactar equipo', action: 'navigate:/chat', icon: 'ExternalLink' }
      );
    }
  }
  
  // Si la urgencia es alta, añadir acción de escalamiento
  if (sentiment.urgency === 'high' || sentiment.urgency === 'critical') {
    suggestedActions.unshift(
      { id: '0', label: 'Hablar con un humano AHORA', action: 'navigate:/chat', icon: 'AlertTriangle' }
    );
    
    if (!usedAI) {
      response = `⚠️ Detecto que es urgente. ${response}\n\nTe sugiero contactar directamente con nuestro equipo para resolverlo rápidamente.`;
    }
  }
  
  return {
    message: response,
    confidence,
    intent,
    suggestedActions,
    relatedArticles: results.map(r => ({
      id: r.id,
      title: r.title,
      excerpt: r.excerpt,
      videoUrl: r.videoUrl
    })),
    sentimentAnalysis: sentiment,
    usedAI
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, question, conversationHistory, articleId } = body;

    if (action === 'ask') {
      // Analizar sentimiento
      const sentiment = analyzeSentiment(question);
      
      // Buscar en base de conocimientos
      const results = searchKnowledgeBase(question);
      
      // Contexto del usuario para IA
      const userContext = `Usuario: ${session.user.name || session.user.email} (${session.user.role || 'user'})`;
      
      // Generar respuesta (ahora con IA cuando esté disponible)
      const response = await generateResponse(question, results, sentiment, conversationHistory || [], userContext);
      
      // Registrar conversación para análisis (opcional)
      try {
        await prisma.supportInteraction.create({
          data: {
            userId: session.user.id,
            type: response.usedAI ? 'chatbot_ai' : 'chatbot',
            question,
            response: response.message,
            confidence: response.confidence,
            intent: response.intent,
            sentiment: sentiment.sentiment,
            urgency: sentiment.urgency
          }
        });
      } catch (err) {
        // No fallar si no se puede registrar
        logger.error('Error logging support interaction:', err);
      }
      
      return NextResponse.json(response);
    } else if (action === 'get_article' && articleId) {
      const article = KNOWLEDGE_BASE[articleId];
      
      if (!article) {
        return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ article });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    logger.error('Error in chatbot:', error);
    return NextResponse.json({ 
      message: 'Lo siento, he tenido un problema técnico. Por favor, intenta de nuevo o contacta con el soporte.',
      confidence: 0,
      suggestedActions: [
        { id: '1', label: 'Crear ticket de soporte', action: 'create_ticket', icon: 'Ticket' },
        { id: '2', label: 'Hablar con humano', action: 'navigate:/chat', icon: 'ExternalLink' }
      ]
    });
  }
}
