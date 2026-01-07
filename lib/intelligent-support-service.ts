/**
 * Servicio de Soporte Inteligente Automatizado
 * Sistema de chatbot con IA y tickets automatizados
 */

import { prisma } from './db';

// Categorías de tickets
export type TicketCategory = 
  | 'technical'
  | 'billing'
  | 'feature_request'
  | 'bug_report'
  | 'question'
  | 'onboarding';

// Prioridad del ticket
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

// Estado del ticket
export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';

// Interfaz del ticket
export interface SupportTicket {
  id: string;
  userId: string;
  companyId: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  tags: string[];
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  autoResolved: boolean;
}

// Mensaje del ticket
export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: 'user' | 'system' | 'ai';
  message: string;
  isAutomatic: boolean;
  createdAt: Date;
}

// Respuesta del chatbot
export interface ChatbotResponse {
  message: string;
  confidence: number;
  suggestedActions?: SuggestedAction[];
  relatedArticles?: KnowledgeArticle[];
  requiresHumanSupport: boolean;
}

// Acción sugerida
export interface SuggestedAction {
  id: string;
  label: string;
  action: string;
  icon: string;
}

// Artículo de la base de conocimientos
export interface KnowledgeArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  videoUrl?: string;
  relatedArticles?: string[];
}

// Base de conocimientos integrada
const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'kb-001',
    title: 'Cómo crear tu primer edificio',
    excerpt: 'Guía paso a paso para registrar un edificio en INMOVA',
    content: `
# Cómo crear tu primer edificio

## Pasos:

1. **Accede al menú**: Haz clic en "Edificios" en el menú lateral
2. **Nuevo edificio**: Pulsa el botón "Nuevo Edificio" (+)
3. **Completa los datos básicos**:
   - Nombre del edificio
   - Dirección completa
   - Código postal
   - Tipo de edificio (residencial, comercial, mixto)
4. **Datos adicionales**:
   - Año de construcción
   - Número total de plantas
   - Superficie total
5. **Guardar**: Pulsa "Crear Edificio"

## Consejos:
- Usa nombres descriptivos (ej: "Edificio Avenida Principal 123")
- Asegúrate de que la dirección sea correcta para geolocalización
- Puedes añadir fotos después desde la vista del edificio
    `,
    category: 'getting_started',
    tags: ['edificios', 'primeros pasos', 'tutorial'],
    views: 1250,
    helpful: 145,
    notHelpful: 12,
    videoUrl: '/videos/tutorials/create-building.mp4'
  },
  {
    id: 'kb-002',
    title: 'Cómo añadir unidades a un edificio',
    excerpt: 'Registra viviendas, locales y oficinas en tus edificios',
    content: `
# Cómo añadir unidades

## Método 1: Desde el edificio
1. Abre el edificio deseado
2. Ve a la pestaña "Unidades"
3. Pulsa "Nueva Unidad"
4. Completa los datos

## Método 2: Creación directa
1. Menú "Unidades" > "Nueva Unidad"
2. Selecciona el edificio
3. Ingresa los detalles

## Datos importantes:
- Número/Nombre de la unidad
- Tipo (vivienda, local, oficina, parking)
- Superficie
- Habitaciones y baños
- Renta mensual
    `,
    category: 'getting_started',
    tags: ['unidades', 'viviendas', 'tutorial'],
    views: 980,
    helpful: 120,
    notHelpful: 8
  },
  {
    id: 'kb-003',
    title: 'Gestión de contratos de alquiler',
    excerpt: 'Crea y administra contratos de forma eficiente',
    content: `
# Gestión de contratos

## Crear un contrato:
1. **Menú Contratos** > **Nuevo Contrato**
2. **Selecciona inquilino** (o créalo primero)
3. **Selecciona unidad** disponible
4. **Configura fechas**:
   - Fecha de inicio
   - Duración (meses)
   - Fecha de fin (se calcula automáticamente)
5. **Define condiciones económicas**:
   - Renta mensual
   - Depósito/Fianza
   - Día de pago (1-28)
6. **Opciones avanzadas**:
   - Pagos recurrentes automáticos con Stripe
   - Firma digital (integración Signaturit)
   - Subida de contrato PDF

## Gestión de pagos:
- Los pagos se crean automáticamente
- Recordatorios por email/SMS
- Integración con pasarelas de pago
    `,
    category: 'contracts',
    tags: ['contratos', 'alquiler', 'pagos'],
    views: 1450,
    helpful: 189,
    notHelpful: 15,
    relatedArticles: ['kb-004', 'kb-010']
  },
  {
    id: 'kb-004',
    title: 'Configurar pagos recurrentes con Stripe',
    excerpt: 'Automatiza el cobro mensual de rentas',
    content: `
# Pagos recurrentes con Stripe

## Requisitos previos:
1. Cuenta de Stripe configurada
2. Contrato activo con inquilino
3. Email del inquilino registrado

## Activación:
1. Abre el contrato
2. Pestaña "Pagos"
3. Botón "Activar Pagos Recurrentes"
4. Confirma los datos:
   - Monto mensual
   - Día de cargo
   - Método de pago del inquilino

## Beneficios:
- Cobro automático cada mes
- Reducción de morosidad
- Notificaciones automáticas
- Sin intervención manual

## Cancelación:
- Puedes pausar/cancelar en cualquier momento
- Opción de cancelar al final del período
    `,
    category: 'billing',
    tags: ['pagos', 'stripe', 'automatización'],
    views: 890,
    helpful: 105,
    notHelpful: 7
  },
  {
    id: 'kb-005',
    title: 'Uso del módulo de alquiler por habitaciones (Coliving)',
    excerpt: 'Gestiona espacios compartidos y prorrateo de gastos',
    content: `
# Alquiler por habitaciones

## Configuración inicial:
1. Crea el edificio/unidad principal
2. Menú "Alquiler por Habitaciones"
3. Selecciona la unidad
4. "Crear Habitaciones"

## Crear habitaciones:
- Nombre (ej: "Habitación A")
- Superficie privada
- Precio base
- Características (baño privado, balcón, etc.)

## Prorrateo de gastos:
1. Pestaña "Prorrateo de Servicios"
2. Ingresa gastos comunes:
   - Electricidad
   - Agua
   - Gas
   - Internet
   - Limpieza
3. Selecciona método:
   - Por partes iguales
   - Por superficie
   - Por consumo
   - Personalizado
4. "Aplicar Prorrateo" → Crea pagos automáticos

## Contratos:
- Un contrato por habitación
- Calendarios de limpieza compartidos
- Reglas de convivencia en el contrato
    `,
    category: 'advanced',
    tags: ['coliving', 'habitaciones', 'prorrateo'],
    views: 650,
    helpful: 78,
    notHelpful: 5,
    videoUrl: '/videos/tutorials/coliving-setup.mp4'
  },
  {
    id: 'kb-006',
    title: 'Cómo importar datos desde otro sistema',
    excerpt: 'Migra tus datos desde otras plataformas',
    content: `
# Importación de datos

## Proceso de importación:
1. **Menú Admin** > **Importar Datos**
2. **Selecciona origen**:
   - Sistema de Gestión A
   - Sistema de Gestión B
   - Sistema de Gestión C
   - Sistema de Gestión D
   - CSV genérico
3. **Selecciona entidad**:
   - Edificios
   - Unidades
   - Inquilinos
   - Contratos
   - Pagos
4. **Descarga plantilla CSV**
5. **Prepara tu archivo**:
   - Usa la plantilla descargada
   - No cambies los nombres de columnas
   - Formato de fechas: DD/MM/YYYY
6. **Sube el archivo**
7. **Validación automática**:
   - Se detectan errores
   - Advertencias de campos opcionales
8. **Vista previa** de los datos
9. **Confirma importación**

## Consejos:
- Importa en orden: Edificios → Unidades → Inquilinos → Contratos
- Revisa la validación antes de confirmar
- Ten backup de tus datos originales
    `,
    category: 'migration',
    tags: ['importar', 'migración', 'CSV'],
    views: 420,
    helpful: 62,
    notHelpful: 8
  },
  {
    id: 'kb-007',
    title: 'Solución de problemas comunes',
    excerpt: 'Respuestas rápidas a errores frecuentes',
    content: `
# Problemas comunes y soluciones

## "No puedo crear un contrato"
**Causa**: Faltan datos obligatorios
**Solución**:
1. Verifica que el inquilino tenga email
2. Asegúrate de que la unidad esté disponible
3. Revisa que las fechas sean válidas

## "Los pagos no se generan automáticamente"
**Causa**: Contrato sin configuración de pago recurrente
**Solución**:
1. Abre el contrato
2. Verifica que esté "Activo"
3. Configura el día de pago
4. Activa pagos recurrentes si lo deseas

## "No veo el módulo X"
**Causa**: Módulo no activado
**Solución**:
1. Menú Admin > Módulos
2. Busca el módulo deseado
3. Actívalo
4. Recarga la página

## "Error al subir documento"
**Causa**: Archivo muy grande o formato no soportado
**Solución**:
- Máximo 10 MB por archivo
- Formatos: PDF, JPG, PNG, DOCX
- Comprime el archivo si es necesario
    `,
    category: 'troubleshooting',
    tags: ['errores', 'problemas', 'soluciones'],
    views: 1100,
    helpful: 145,
    notHelpful: 20
  },
  {
    id: 'kb-008',
    title: 'Configuración de integraciones contables',
    excerpt: 'Conecta con Sage, Holded, A3, ContaSimple o Alegra',
    content: `
# Integraciones contables

## Sistemas soportados:
- **Sage**: ERP empresarial
- **Holded**: Gestión integral
- **A3 Software**: Contabilidad PYMES
- **ContaSimple**: Contabilidad simplificada
- **Alegra**: Cloud accounting
- **Zucchetti**: ERP europeo

## Configuración:
1. Menú **Contabilidad**
2. Pestaña **Integraciones**
3. Selecciona tu sistema
4. Ingresa credenciales API
5. Prueba conexión
6. Configura sincronización:
   - Clientes (inquilinos)
   - Facturas (contratos/pagos)
   - Pagos recibidos
   - Gastos

## Sincronización automática:
- Inquilinos → Clientes
- Contratos → Facturas
- Pagos → Cobros
- Gastos → Gastos

## Demo mode:
- Si no tienes credenciales, usa el modo demo
- Simula la sincronización
- Para producción, contacta con tu proveedor contable
    `,
    category: 'integrations',
    tags: ['contabilidad', 'integración', 'ERP'],
    views: 560,
    helpful: 72,
    notHelpful: 9
  },
  {
    id: 'kb-009',
    title: 'Uso del OCR para escanear documentos',
    excerpt: 'Extrae datos automáticamente de DNI y contratos',
    content: `
# OCR (Reconocimiento óptico de caracteres)

## ¿Qué es el OCR?
Tecnología que extrae texto de imágenes, permitiéndote:
- Escanear DNI/Pasaportes
- Leer contratos en PDF
- Digitalizar facturas
- Extraer datos automáticamente

## Cómo usar:
1. Menú **OCR**
2. Selecciona tipo de documento:
   - General (cualquier texto)
   - DNI/Pasaporte
   - Contrato
3. Sube imagen o PDF
4. Espera procesamiento (10-30 seg)
5. Revisa datos extraídos
6. Usa acciones rápidas:
   - "Crear Inquilino" (desde DNI)
   - "Crear Contrato" (desde contrato)

## Consejos:
- Fotos nítidas y bien iluminadas
- Documentos planos (sin arrugas)
- Formatos: JPG, PNG, PDF
- Máx 10 MB

## Precisión:
- DNI español: >95%
- Contratos estándar: 85-90%
- Revisa siempre los datos extraídos
    `,
    category: 'advanced',
    tags: ['OCR', 'automatización', 'DNI'],
    views: 380,
    helpful: 48,
    notHelpful: 5,
    videoUrl: '/videos/tutorials/ocr-usage.mp4'
  },
  {
    id: 'kb-010',
    title: 'Gestión de mantenimiento preventivo',
    excerpt: 'Programa revisiones y mantenimientos automáticos',
    content: `
# Mantenimiento preventivo

## Beneficios:
- Evita averías costosas
- Cumple normativas (ascensores, calderas, etc.)
- Alarga vida útil de equipos
- Reduce emergencias

## Configuración:
1. Menú **Mantenimiento**
2. Pestaña **Preventivo**
3. **Crear Programación**:
   - Edificio/Unidad
   - Tipo de mantenimiento
   - Descripción
   - Frecuencia (mensual, trimestral, anual)
   - Proveedor asignado
   - Costo estimado
4. Guardar

## Tipos comunes:
- **Mensual**: Limpieza de zonas comunes
- **Trimestral**: Revisión calderas, aire acondicionado
- **Semestral**: Ascensores, puertas automáticas
- **Anual**: ITE, certificados energéticos, extintores

## Automatización:
- Se crean órdenes de trabajo automáticamente
- Notificaciones al proveedor
- Alertas si no se completa a tiempo
- Historial de todas las revisiones
    `,
    category: 'maintenance',
    tags: ['mantenimiento', 'preventivo', 'automatización'],
    views: 720,
    helpful: 92,
    notHelpful: 6
  }
];

// Patrones de preguntas frecuentes para el chatbot
const FAQ_PATTERNS = [
  {
    patterns: ['cómo crear edificio', 'añadir edificio', 'nuevo edificio', 'registrar propiedad'],
    articleId: 'kb-001',
    confidence: 0.95,
    quickAnswer: 'Para crear un edificio, ve a Menú > Edificios > Nuevo Edificio (+). Completa nombre, dirección, tipo y datos adicionales. ¿Te guío paso a paso?'
  },
  {
    patterns: ['añadir unidad', 'crear vivienda', 'nueva unidad', 'registrar piso'],
    articleId: 'kb-002',
    confidence: 0.90,
    quickAnswer: 'Puedes añadir unidades desde el edificio (pestaña Unidades) o directamente desde Menú > Unidades > Nueva Unidad. Necesitarás número, tipo, superficie y renta.'
  },
  {
    patterns: ['crear contrato', 'nuevo contrato', 'alquilar', 'arrendar'],
    articleId: 'kb-003',
    confidence: 0.92,
    quickAnswer: 'Ve a Contratos > Nuevo Contrato. Selecciona inquilino y unidad, define fechas, renta y depósito. Puedes activar pagos recurrentes con Stripe para automatizar cobros.'
  },
  {
    patterns: ['pago automático', 'cobro recurrente', 'stripe', 'domiciliación'],
    articleId: 'kb-004',
    confidence: 0.88,
    quickAnswer: 'Los pagos recurrentes se configuran desde el contrato > Pagos > Activar Pagos Recurrentes. Se cargará automáticamente a la tarjeta del inquilino cada mes.'
  },
  {
    patterns: ['coliving', 'habitaciones', 'prorrateo', 'gastos compartidos'],
    articleId: 'kb-005',
    confidence: 0.93,
    quickAnswer: 'El módulo de Alquiler por Habitaciones permite crear habitaciones individuales en una unidad y prorratear gastos comunes. ¿Necesitas ayuda configurándolo?'
  },
  {
    patterns: ['importar datos', 'migrar', 'CSV', 'otra plataforma', 'importación'],
    articleId: 'kb-006',
    confidence: 0.89,
    quickAnswer: 'Puedes importar datos desde Admin > Importar. Selecciona tu sistema anterior, descarga la plantilla, prepara el CSV y súbelo. Te guiaremos en la validación.'
  },
  {
    patterns: ['error', 'problema', 'no funciona', 'fallo'],
    articleId: 'kb-007',
    confidence: 0.75,
    quickAnswer: 'Veo que tienes un problema. ¿Puedes describirlo con más detalle? Mientras, revisa nuestra guía de solución de problemas comunes.'
  },
  {
    patterns: ['integración contable', 'sage', 'holded', 'a3', 'contasimple', 'alegra'],
    articleId: 'kb-008',
    confidence: 0.91,
    quickAnswer: 'INMOVA se integra con Sage, Holded, A3, ContaSimple, Alegra y Zucchetti. Ve a Contabilidad > Integraciones y configura tus credenciales API.'
  },
  {
    patterns: ['OCR', 'escanear', 'DNI', 'reconocimiento'],
    articleId: 'kb-009',
    confidence: 0.87,
    quickAnswer: 'El módulo OCR extrae datos automáticamente de DNI y contratos. Sube la imagen, espera el procesamiento y podrás crear inquilinos/contratos directamente.'
  },
  {
    patterns: ['mantenimiento preventivo', 'revisión', 'programar mantenimiento'],
    articleId: 'kb-010',
    confidence: 0.85,
    quickAnswer: 'El mantenimiento preventivo se gestiona desde Mantenimiento > Preventivo. Crea programaciones recurrentes (mensual, trimestral, anual) y se generarán órdenes automáticamente.'
  }
];

/**
 * Procesa una pregunta del usuario y genera una respuesta inteligente
 */
export async function processUserQuestion(
  question: string,
  userId: string,
  companyId: string,
  sentimentAnalysis?: any
): Promise<ChatbotResponse> {
  const lowerQuestion = question.toLowerCase();
  
  // Adaptar el tono de respuesta según el sentimiento
  let responsePrefix = '';
  if (sentimentAnalysis) {
    if (sentimentAnalysis.sentiment === 'negative' && sentimentAnalysis.urgency === 'critical') {
      responsePrefix = 'Entiendo tu frustración y la urgencia de tu consulta. ';
    } else if (sentimentAnalysis.sentiment === 'negative') {
      responsePrefix = 'Lamento que estés teniendo problemas. ';
    } else if (sentimentAnalysis.urgency === 'high' || sentimentAnalysis.urgency === 'critical') {
      responsePrefix = 'Veo que es urgente. ';
    }
  }
  
  // Buscar coincidencias en patrones FAQ
  for (const faq of FAQ_PATTERNS) {
    for (const pattern of faq.patterns) {
      if (lowerQuestion.includes(pattern)) {
        const article = KNOWLEDGE_BASE.find(a => a.id === faq.articleId);
        
        return {
          message: responsePrefix + faq.quickAnswer,
          confidence: faq.confidence,
          suggestedActions: generateSuggestedActions(faq.articleId, sentimentAnalysis),
          relatedArticles: article ? [article] : [],
          requiresHumanSupport: sentimentAnalysis?.urgency === 'critical'
        };
      }
    }
  }

  // Si no hay coincidencia, búsqueda general en la base de conocimientos
  const searchResults = searchKnowledgeBase(question);
  
  if (searchResults.length > 0) {
    return {
      message: responsePrefix + `He encontrado ${searchResults.length} artículos relacionados con tu consulta. ¿Te ayudan estos recursos?`,
      confidence: 0.70,
      relatedArticles: searchResults.slice(0, 3),
      requiresHumanSupport: false
    };
  }

  // Si no se encuentra nada, sugerir contacto humano
  return {
    message: 'No he encontrado una respuesta directa a tu pregunta. Te recomiendo explorar nuestra base de conocimientos o crear un ticket de soporte para ayuda personalizada.',
    confidence: 0.30,
    suggestedActions: [
      {
        id: 'create_ticket',
        label: 'Crear ticket de soporte',
        action: 'create_ticket',
        icon: 'Ticket'
      },
      {
        id: 'browse_kb',
        label: 'Explorar base de conocimientos',
        action: 'navigate:/knowledge-base',
        icon: 'BookOpen'
      },
      {
        id: 'contact_sales',
        label: 'Contactar con ventas',
        action: 'navigate:/landing/contacto',
        icon: 'Phone'
      }
    ],
    requiresHumanSupport: true
  };
}

/**
 * Búsqueda en la base de conocimientos
 */
export function searchKnowledgeBase(query: string): KnowledgeArticle[] {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(' ').filter(w => w.length > 3);

  return KNOWLEDGE_BASE
    .map(article => {
      let score = 0;
      const lowerTitle = article.title.toLowerCase();
      const lowerContent = article.content.toLowerCase();
      const lowerTags = article.tags.join(' ').toLowerCase();

      // Puntuación por coincidencia en título
      words.forEach(word => {
        if (lowerTitle.includes(word)) score += 10;
        if (lowerTags.includes(word)) score += 5;
        if (lowerContent.includes(word)) score += 2;
      });

      return { article, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.article);
}

/**
 * Obtiene un artículo por ID
 */
export function getArticleById(articleId: string): KnowledgeArticle | undefined {
  return KNOWLEDGE_BASE.find(a => a.id === articleId);
}

/**
 * Obtiene todos los artículos por categoría
 */
export function getArticlesByCategory(category: string): KnowledgeArticle[] {
  return KNOWLEDGE_BASE.filter(a => a.category === category);
}

/**
 * Genera acciones sugeridas basadas en el artículo
 */
function generateSuggestedActions(articleId: string, sentimentAnalysis?: any): SuggestedAction[] {
  const actions: Record<string, SuggestedAction[]> = {
    'kb-001': [
      {
        id: 'create_building',
        label: 'Crear edificio ahora',
        action: 'navigate:/edificios/nuevo',
        icon: 'Building2'
      },
      {
        id: 'watch_video',
        label: 'Ver tutorial en video',
        action: 'play_video:/videos/tutorials/create-building.mp4',
        icon: 'Play'
      }
    ],
    'kb-002': [
      {
        id: 'create_unit',
        label: 'Añadir unidad',
        action: 'navigate:/unidades/nuevo',
        icon: 'Home'
      }
    ],
    'kb-003': [
      {
        id: 'create_contract',
        label: 'Crear contrato',
        action: 'navigate:/contratos/nuevo',
        icon: 'FileText'
      }
    ],
    'kb-005': [
      {
        id: 'setup_coliving',
        label: 'Configurar coliving',
        action: 'navigate:/room-rental',
        icon: 'Users'
      }
    ],
    'kb-006': [
      {
        id: 'import_data',
        label: 'Importar datos',
        action: 'navigate:/admin/importar',
        icon: 'Upload'
      }
    ]
  };

  return actions[articleId] || [];
}

/**
 * Crea un ticket de soporte automatizado
 */
export async function createSupportTicket(
  userId: string,
  companyId: string,
  subject: string,
  description: string,
  category: TicketCategory
): Promise<SupportTicket> {
  // Analizar prioridad automáticamente
  const priority = analyzePriority(subject, description);
  
  // Extraer tags del contenido
  const tags = extractTags(subject + ' ' + description);

  // Crear ticket en la base de datos
  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      companyId,
      subject,
      description,
      category,
      priority,
      status: 'open',
      tags,
      autoResolved: false
    }
  });

  // Intentar respuesta automática
  const autoResponse = await attemptAutoResolution(ticket.id, description);

  const autoMsg = autoResponse ? [{
    id: autoResponse.id,
    ticketId: autoResponse.ticketId,
    sender: autoResponse.sender as 'user' | 'system' | 'ai',
    message: autoResponse.message,
    isAutomatic: autoResponse.isAutomatic,
    createdAt: autoResponse.createdAt
  }] : [];

  return {
    id: ticket.id,
    userId: ticket.userId,
    companyId: ticket.companyId,
    category: ticket.category as TicketCategory,
    priority: ticket.priority as TicketPriority,
    status: ticket.status as TicketStatus,
    subject: ticket.subject,
    description: ticket.description,
    tags: ticket.tags as any as string[],
    messages: autoMsg,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    autoResolved: ticket.autoResolved
  };
}

/**
 * Analiza la prioridad basándose en el contenido
 */
function analyzePriority(subject: string, description: string): TicketPriority {
  const content = (subject + ' ' + description).toLowerCase();
  
  const criticalKeywords = ['crítico', 'urgente', 'no funciona', 'down', 'caído', 'pérdida datos'];
  const highKeywords = ['error', 'problema', 'fallo', 'bug'];
  const mediumKeywords = ['duda', 'pregunta', 'cómo', 'consulta'];

  if (criticalKeywords.some(k => content.includes(k))) return 'critical';
  if (highKeywords.some(k => content.includes(k))) return 'high';
  if (mediumKeywords.some(k => content.includes(k))) return 'medium';
  
  return 'low';
}

/**
 * Extrae tags relevantes del contenido
 */
function extractTags(content: string): string[] {
  const tags: string[] = [];
  const lower = content.toLowerCase();

  const tagMap: Record<string, string> = {
    'edificio': 'buildings',
    'unidad': 'units',
    'inquilino': 'tenants',
    'contrato': 'contracts',
    'pago': 'payments',
    'mantenimiento': 'maintenance',
    'stripe': 'billing',
    'importar': 'import',
    'ocr': 'ocr',
    'coliving': 'coliving',
    'habitación': 'rooms'
  };

  Object.entries(tagMap).forEach(([keyword, tag]) => {
    if (lower.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  });

  return tags;
}

/**
 * Intenta resolver el ticket automáticamente
 */
async function attemptAutoResolution(
  ticketId: string,
  description: string
): Promise<TicketMessage | null> {
  const response = await processUserQuestion(description, '', '');
  
  if (response.confidence > 0.80 && !response.requiresHumanSupport) {
    // Crear mensaje automático
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        sender: 'ai',
        message: response.message,
        isAutomatic: true
      }
    });

    return {
      id: message.id,
      ticketId: message.ticketId,
      sender: message.sender as 'user' | 'system' | 'ai',
      message: message.message,
      isAutomatic: message.isAutomatic,
      createdAt: message.createdAt
    };
  }

  return null;
}