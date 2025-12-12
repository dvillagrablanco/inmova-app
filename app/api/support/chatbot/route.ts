import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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
- 56 módulos incluidos
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
- 56 módulos vs 15-30 de la competencia
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

// Generar respuesta inteligente
function generateResponse(query: string, results: any[], sentiment: any): any {
  const lowerQuery = query.toLowerCase();
  
  // Detectar intención
  let intent = 'general';
  let response = '';
  let confidence = 0.5;
  const suggestedActions: any[] = [];
  
  // Saludos
  if (lowerQuery.match(/hola|buenos días|buenas tardes|hey|hi/)) {
    response = '¡Hola! 👋 Estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?';
    confidence = 1.0;
    intent = 'greeting';
    
    suggestedActions.push(
      { id: '1', label: 'Ver tutoriales', action: 'navigate:/help', icon: 'BookOpen' },
      { id: '2', label: 'Contactar soporte', action: 'create_ticket', icon: 'Ticket' }
    );
  }
  // Pricing
  else if (lowerQuery.match(/precio|costo|tarifa|plan|cuanto|pagar/)) {
    response = 'INMOVA tiene un plan único de €149/mes para empresas con TODO incluido: 56 módulos, usuarios ilimitados, propiedades ilimitadas y soporte 24/7. También ofrecemos €49/mes para propietarios individuales. ¡Prueba gratis 30 días!';
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
      response = 'Para crear un edificio, ve a Edificios > Nuevo Edificio. Completa los datos básicos y ¡listo! Te recomiendo ver el video tutorial para una guía paso a paso.';
      confidence = 0.9;
      intent = 'how_to';
      
      suggestedActions.push(
        { id: '1', label: 'Crear edificio ahora', action: 'navigate:/edificios/nuevo', icon: 'ExternalLink' },
        { id: '2', label: 'Ver tutorial', action: 'play_video:https://www.youtube.com/embed/zm55Gdl5G1Q', icon: 'BookOpen' }
      );
    } else if (lowerQuery.includes('unidad') || lowerQuery.includes('apartamento') || lowerQuery.includes('piso')) {
      response = 'Para añadir unidades, primero debes tener un edificio creado. Luego ve a Unidades > Nueva Unidad, selecciona el edificio y completa los datos.';
      confidence = 0.9;
      intent = 'how_to';
      
      suggestedActions.push(
        { id: '1', label: 'Crear unidad', action: 'navigate:/unidades/nuevo', icon: 'ExternalLink' },
        { id: '2', label: 'Ver mis edificios', action: 'navigate:/edificios', icon: 'BookOpen' }
      );
    } else if (lowerQuery.includes('inquilino') || lowerQuery.includes('tenant')) {
      response = 'Para registrar un inquilino, ve a Inquilinos > Nuevo Inquilino. Completa sus datos personales y podrás asignarlo a una unidad disponible.';
      confidence = 0.9;
      intent = 'how_to';
      
      suggestedActions.push(
        { id: '1', label: 'Registrar inquilino', action: 'navigate:/inquilinos/nuevo', icon: 'ExternalLink' },
        { id: '2', label: 'Ver screening', action: 'navigate:/screening', icon: 'BookOpen' }
      );
    } else if (lowerQuery.includes('contrato')) {
      response = 'Para crear un contrato, ve a Contratos > Nuevo Contrato. Selecciona el inquilino y la unidad, define las condiciones y genera el PDF automáticamente.';
      confidence = 0.9;
      intent = 'how_to';
      
      suggestedActions.push(
        { id: '1', label: 'Crear contrato', action: 'navigate:/contratos/nuevo', icon: 'ExternalLink' },
        { id: '2', label: 'Ver firma digital', action: 'navigate:/firma-digital', icon: 'BookOpen' }
      );
    } else {
      response = 'Puedo ayudarte a crear edificios, unidades, inquilinos, contratos y más. ¿Qué te gustaría crear específicamente?';
      confidence = 0.6;
    }
  }
  // Problemas/Errores
  else if (lowerQuery.match(/problema|error|fallo|no funciona|no puedo|ayuda/)) {
    response = 'Lamento que estés teniendo problemas. Para ayudarte mejor, ¿podrías especificar qué funcionalidad no está funcionando? Mientras tanto, revisa si tu sesión está activa y los permisos de tu usuario.';
    confidence = 0.7;
    intent = 'support';
    
    suggestedActions.push(
      { id: '1', label: 'Crear ticket de soporte', action: 'create_ticket', icon: 'Ticket' },
      { id: '2', label: 'Ver FAQs', action: 'navigate:/help', icon: 'BookOpen' },
      { id: '3', label: 'Hablar con humano', action: 'navigate:/chat', icon: 'MessageCircle' }
    );
  }
  // Respuesta basada en búsqueda
  else if (results.length > 0) {
    const topResult = results[0];
    response = `Encontré información relevante: ${topResult.content.substring(0, 300)}...\n\nPuedes ver más detalles en los artículos relacionados.`;
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
    response = 'No estoy seguro de cómo responder a eso específicamente. Te recomiendo:\n\n1. Consultar la sección de Ayuda\n2. Ver los tutoriales en video\n3. Crear un ticket de soporte para asistencia personalizada';
    confidence = 0.3;
    
    suggestedActions.push(
      { id: '1', label: 'Ver ayuda', action: 'navigate:/help', icon: 'BookOpen' },
      { id: '2', label: 'Crear ticket', action: 'create_ticket', icon: 'Ticket' },
      { id: '3', label: 'Contactar equipo', action: 'navigate:/chat', icon: 'ExternalLink' }
    );
  }
  
  // Si la urgencia es alta, añadir acción de escalamiento
  if (sentiment.urgency === 'high' || sentiment.urgency === 'critical') {
    suggestedActions.unshift(
      { id: '0', label: 'Hablar con un humano AHORA', action: 'navigate:/chat', icon: 'AlertTriangle' }
    );
    
    response = `⚠️ Detecto que es urgente. ${response}\n\nTe sugiero contactar directamente con nuestro equipo para resolverlo rápidamente.`;
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
    sentimentAnalysis: sentiment
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
      
      // Generar respuesta
      const response = generateResponse(question, results, sentiment);
      
      // Registrar conversación para análisis (opcional)
      try {
        await prisma.supportInteraction.create({
          data: {
            userId: session.user.id,
            type: 'chatbot',
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
