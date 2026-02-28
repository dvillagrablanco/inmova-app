/**
 * Seed: Add-ons INMOVA y Planes eWoorker
 *
 * ARQUITECTURA DE ADD-ONS PROPTECH:
 *
 * 1. CATEGORÍA "USAGE" - Packs de consumo
 *    Productos que se consumen y necesitan reposición
 *    - Firmas digitales (Signaturit/DocuSign)
 *    - SMS/WhatsApp notificaciones
 *    - Storage adicional (S3)
 *    - Tokens de IA
 *
 * 2. CATEGORÍA "FEATURE" - Funcionalidades activables
 *    Características que se activan/desactivan por mes
 *    - Reportes avanzados
 *    - Multi-idioma
 *    - Integraciones con portales
 *    - Publicación automática
 *
 * 3. CATEGORÍA "PREMIUM" - Servicios premium
 *    Servicios de alto valor añadido
 *    - White-label
 *    - API Access
 *    - ESG & Sostenibilidad
 *    - Pricing dinámico IA
 *    - Tours virtuales 360°
 *    - IoT & Smart Buildings
 *
 * ALINEACIÓN CON LANDING PAGE:
 * Los planes en /landing/precios muestran: Starter €35, Profesional €59, Business €129, Enterprise €299
 * Los add-ons se muestran como extras opcionales para ampliar funcionalidades.
 *
 * Ejecutar: npx tsx prisma/seed-addons.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// ADD-ONS INMOVA - Estrategia PropTech 2026
// ═══════════════════════════════════════════════════════════════

const ADDONS = [
  // ══════════════════════════════════════════════════════════════
  // CATEGORÍA: USAGE - Packs de Consumo
  // Productos consumibles que se agotan con el uso
  // ══════════════════════════════════════════════════════════════

  // --- FIRMAS DIGITALES ---
  {
    codigo: 'signatures_pack_10',
    nombre: 'Pack 10 Firmas Digitales',
    descripcion:
      'Pack de 10 firmas digitales con validez legal europea (eIDAS). Integración con Signaturit. Ideal para contratos de alquiler.',
    categoria: 'usage',
    precioMensual: 15,
    precioAnual: 150,
    unidades: 10,
    tipoUnidad: 'firmas',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 40, // Costo real: ~€0.90/firma en Signaturit
    costoUnitario: 9,
    destacado: true,
    orden: 1,
  },
  {
    codigo: 'signatures_pack_50',
    nombre: 'Pack 50 Firmas Digitales',
    descripcion:
      'Pack de 50 firmas digitales para gestoras con alto volumen de contratos. Ahorra 20% vs pack básico.',
    categoria: 'usage',
    precioMensual: 60,
    precioAnual: 600,
    unidades: 50,
    tipoUnidad: 'firmas',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 47, // Costo: €0.65/firma por volumen
    costoUnitario: 32.5,
    destacado: false,
    orden: 2,
  },
  {
    codigo: 'signatures_pack_100',
    nombre: 'Pack 100 Firmas Digitales',
    descripcion: 'Pack empresarial de 100 firmas digitales. Máximo ahorro para grandes volúmenes.',
    categoria: 'usage',
    precioMensual: 100,
    precioAnual: 1000,
    unidades: 100,
    tipoUnidad: 'firmas',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 50, // Costo: €0.50/firma por volumen
    costoUnitario: 50,
    destacado: false,
    orden: 3,
  },

  // --- ALMACENAMIENTO ---
  {
    codigo: 'storage_pack_10gb',
    nombre: 'Pack 10GB Storage',
    descripcion:
      'Almacenamiento adicional de 10GB para documentos, fotos de propiedades y contratos.',
    categoria: 'usage',
    precioMensual: 5,
    precioAnual: 50,
    unidades: 10,
    tipoUnidad: 'GB',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 95, // Costo S3: €0.023/GB
    costoUnitario: 0.23,
    destacado: false,
    orden: 4,
  },
  {
    codigo: 'storage_pack_50gb',
    nombre: 'Pack 50GB Storage',
    descripcion: 'Almacenamiento de 50GB para gestoras con muchas propiedades y documentación.',
    categoria: 'usage',
    precioMensual: 20,
    precioAnual: 200,
    unidades: 50,
    tipoUnidad: 'GB',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 94, // Costo S3: €1.15
    costoUnitario: 1.15,
    destacado: false,
    orden: 5,
  },
  {
    codigo: 'storage_pack_100gb',
    nombre: 'Pack 100GB Storage',
    descripcion: 'Almacenamiento empresarial de 100GB. Incluye CDN para carga rápida de imágenes.',
    categoria: 'usage',
    precioMensual: 35,
    precioAnual: 350,
    unidades: 100,
    tipoUnidad: 'GB',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 93, // Costo S3 + CDN: €2.30
    costoUnitario: 2.3,
    destacado: false,
    orden: 6,
  },

  // --- SMS / WHATSAPP ---
  {
    codigo: 'sms_pack_100',
    nombre: 'Pack 100 SMS/WhatsApp',
    descripcion:
      'Pack de 100 notificaciones SMS o WhatsApp para recordatorios de pago, alertas y comunicaciones.',
    categoria: 'usage',
    precioMensual: 10,
    precioAnual: 100,
    unidades: 100,
    tipoUnidad: 'mensajes',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 47, // Costo Twilio: ~€0.053/SMS
    costoUnitario: 5.3,
    destacado: true,
    orden: 7,
  },
  {
    codigo: 'sms_pack_500',
    nombre: 'Pack 500 SMS/WhatsApp',
    descripcion:
      'Pack de 500 mensajes para gestoras con muchos inquilinos. Recordatorios automáticos.',
    categoria: 'usage',
    precioMensual: 40,
    precioAnual: 400,
    unidades: 500,
    tipoUnidad: 'mensajes',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 52, // Costo con descuento: €0.038/SMS
    costoUnitario: 19,
    destacado: false,
    orden: 8,
  },
  {
    codigo: 'sms_pack_1000',
    nombre: 'Pack 1000 SMS/WhatsApp',
    descripcion: 'Pack empresarial de 1000 mensajes. Máximo ahorro para comunicación masiva.',
    categoria: 'usage',
    precioMensual: 70,
    precioAnual: 700,
    unidades: 1000,
    tipoUnidad: 'mensajes',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 57, // Costo con descuento: €0.030/SMS
    costoUnitario: 30,
    destacado: false,
    orden: 9,
  },

  // --- IA TOKENS ---
  {
    codigo: 'ai_pack_50k',
    nombre: 'Pack IA Básico (50K tokens)',
    descripcion:
      '50,000 tokens de IA para valoraciones automáticas, descripciones de propiedades y asistente virtual.',
    categoria: 'usage',
    precioMensual: 10,
    precioAnual: 100,
    unidades: 50000,
    tipoUnidad: 'tokens',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 97, // Costo OpenAI: ~€0.30 (50K tokens gpt-3.5)
    costoUnitario: 0.3,
    destacado: true,
    orden: 10,
  },
  {
    codigo: 'ai_pack_200k',
    nombre: 'Pack IA Avanzado (200K tokens)',
    descripcion:
      '200,000 tokens de IA. Incluye acceso a GPT-4 para análisis complejos y valoraciones premium.',
    categoria: 'usage',
    precioMensual: 35,
    precioAnual: 350,
    unidades: 200000,
    tipoUnidad: 'tokens',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 91, // Costo mezcla GPT-3.5/4: ~€3
    costoUnitario: 3,
    destacado: false,
    orden: 11,
  },
  {
    codigo: 'ai_pack_500k',
    nombre: 'Pack IA Enterprise (500K tokens)',
    descripcion:
      '500,000 tokens con acceso GPT-4 ilimitado. Para gestoras que usan IA intensivamente.',
    categoria: 'usage',
    precioMensual: 75,
    precioAnual: 750,
    unidades: 500000,
    tipoUnidad: 'tokens',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 87, // Costo GPT-4: ~€10
    costoUnitario: 10,
    destacado: false,
    orden: 12,
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORÍA: FEATURE - Funcionalidades Activables
  // Se pagan mensualmente y se pueden activar/desactivar
  // ══════════════════════════════════════════════════════════════

  {
    codigo: 'advanced_reports',
    nombre: 'Reportes Avanzados',
    descripcion:
      'Informes financieros detallados, análisis de rentabilidad por propiedad, proyecciones y exportación a Excel/PDF.',
    categoria: 'feature',
    precioMensual: 15,
    precioAnual: 150,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['STARTER', 'PROFESSIONAL'],
    incluidoEn: ['BUSINESS', 'ENTERPRISE'],
    margenPorcentaje: 100, // Sin costo adicional
    costoUnitario: 0,
    destacado: false,
    orden: 13,
  },
  {
    codigo: 'multi_language',
    nombre: 'Multi-idioma',
    descripcion:
      'Interfaz en múltiples idiomas (ES, EN, FR, DE, PT). Portal de inquilinos traducido automáticamente.',
    categoria: 'feature',
    precioMensual: 10,
    precioAnual: 100,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['STARTER', 'PROFESSIONAL'],
    incluidoEn: ['BUSINESS', 'ENTERPRISE'],
    margenPorcentaje: 100,
    costoUnitario: 0,
    destacado: false,
    orden: 14,
  },
  {
    codigo: 'portal_sync',
    nombre: 'Publicación en Portales',
    descripcion:
      'Publicación automática en Idealista, Fotocasa, Habitaclia y pisos.com. Sincronización de disponibilidad.',
    categoria: 'feature',
    precioMensual: 25,
    precioAnual: 250,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 80, // API fees de portales
    costoUnitario: 5,
    destacado: true,
    orden: 15,
  },
  {
    codigo: 'auto_reminders',
    nombre: 'Recordatorios Automáticos',
    descripcion:
      'Sistema automático de recordatorios de pago, vencimiento de contratos y mantenimientos programados.',
    categoria: 'feature',
    precioMensual: 8,
    precioAnual: 80,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['STARTER'],
    incluidoEn: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    margenPorcentaje: 100,
    costoUnitario: 0,
    destacado: false,
    orden: 16,
  },
  {
    codigo: 'tenant_screening',
    nombre: 'Screening de Inquilinos',
    descripcion:
      'Verificación de solvencia, historial de impagos y puntuación de riesgo para candidatos a inquilino.',
    categoria: 'feature',
    precioMensual: 20,
    precioAnual: 200,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 60, // Costo de consultas a bases de datos
    costoUnitario: 8,
    destacado: false,
    orden: 17,
  },
  {
    codigo: 'accounting_integration',
    nombre: 'Integración Contabilidad',
    descripcion:
      'Conexión directa con A3, Sage, Holded y sistemas de contabilidad. Exportación de asientos automática.',
    categoria: 'feature',
    precioMensual: 30,
    precioAnual: 300,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 85,
    costoUnitario: 4.5,
    destacado: false,
    orden: 18,
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORÍA: PREMIUM - Servicios de Alto Valor
  // Módulos transversales que amplifican el valor de la plataforma
  // ══════════════════════════════════════════════════════════════

  {
    codigo: 'whitelabel_basic',
    nombre: 'White-Label Básico',
    descripcion:
      'Personaliza colores, logo y nombre de la plataforma. Elimina "Powered by INMOVA".',
    categoria: 'premium',
    precioMensual: 35,
    precioAnual: 350,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 95,
    costoUnitario: 1.75,
    destacado: true,
    orden: 19,
  },
  {
    codigo: 'whitelabel_full',
    nombre: 'White-Label Completo',
    descripcion:
      'Tu dominio, tu app móvil, emails personalizados. Marca 100% tuya con soporte dedicado.',
    categoria: 'premium',
    precioMensual: 99,
    precioAnual: 990,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 85, // Costos de dominio, certificados, etc.
    costoUnitario: 15,
    destacado: false,
    orden: 20,
  },
  {
    codigo: 'api_access',
    nombre: 'Acceso API REST',
    descripcion:
      'API completa para integraciones personalizadas. Documentación Swagger, webhooks y sandbox de pruebas.',
    categoria: 'premium',
    precioMensual: 49,
    precioAnual: 490,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 100,
    costoUnitario: 0,
    destacado: false,
    orden: 21,
  },
  {
    codigo: 'esg_module',
    nombre: 'ESG & Sostenibilidad',
    descripcion:
      'Huella de carbono de propiedades, certificaciones verdes (LEED, BREEAM) y reportes CSRD para compliance europeo.',
    categoria: 'premium',
    precioMensual: 50,
    precioAnual: 500,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 80,
    costoUnitario: 10,
    destacado: false,
    orden: 22,
  },
  {
    codigo: 'pricing_ai',
    nombre: 'Pricing Dinámico IA',
    descripcion:
      'Optimización de precios de alquiler con Machine Learning. Análisis de mercado, competencia y estacionalidad. +15-30% ingresos.',
    categoria: 'premium',
    precioMensual: 45,
    precioAnual: 450,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 85,
    costoUnitario: 6.75,
    destacado: true,
    orden: 23,
  },
  {
    codigo: 'tours_vr',
    nombre: 'Tours Virtuales 360°',
    descripcion:
      'Crea tours virtuales 360° de tus propiedades. Integración con Matterport y Kuula. +40% conversión de visitas.',
    categoria: 'premium',
    precioMensual: 35,
    precioAnual: 350,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 80,
    costoUnitario: 7,
    destacado: false,
    orden: 24,
  },
  {
    codigo: 'iot_smart',
    nombre: 'IoT & Smart Buildings',
    descripcion:
      'Integración con cerraduras inteligentes, termostatos, sensores de consumo. Automatización de check-in/out.',
    categoria: 'premium',
    precioMensual: 75,
    precioAnual: 750,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 70,
    costoUnitario: 22.5,
    destacado: false,
    orden: 25,
  },
  {
    codigo: 'marketplace_b2c',
    nombre: 'Marketplace de Servicios',
    descripcion:
      'Ofrece servicios B2C a tus inquilinos: limpieza, wifi, seguros, mudanzas. Comisión del 12% por servicio.',
    categoria: 'premium',
    precioMensual: 0, // Basado en comisiones
    precioAnual: 0,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: null, // Variable por comisiones
    costoUnitario: null,
    destacado: false,
    orden: 26,
  },
  {
    codigo: 'dedicated_support',
    nombre: 'Soporte Dedicado',
    descripcion:
      'Account manager personal, soporte prioritario 24/7, sesiones de formación mensuales y onboarding premium.',
    categoria: 'premium',
    precioMensual: 99,
    precioAnual: 990,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 50, // Costo de personal
    costoUnitario: 49.5,
    destacado: false,
    orden: 27,
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORÍA: FAMILY OFFICE - Gestión Patrimonial Integral
  // Módulo premium para holdings y family offices
  // ══════════════════════════════════════════════════════════════

  {
    codigo: 'fo_starter',
    nombre: 'Family Office Starter',
    descripcion:
      'Dashboard patrimonial 360°, conexión con 3 entidades bancarias, import manual de extractos, reporting básico mensual.',
    categoria: 'premium',
    precioMensual: 299,
    precioAnual: 2990,
    unidades: 1,
    tipoUnidad: 'modulo',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 85,
    costoUnitario: 45,
    destacado: true,
    orden: 28,
  },
  {
    codigo: 'fo_professional',
    nombre: 'Family Office Professional',
    descripcion:
      'Todas las entidades bancarias (PSD2 auto-sync + SWIFT + OCR), módulo Private Equity completo, IA copiloto patrimonial, previsión tesorería, Modelo 720.',
    categoria: 'premium',
    precioMensual: 599,
    precioAnual: 5990,
    unidades: 1,
    tipoUnidad: 'modulo',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 88,
    costoUnitario: 72,
    destacado: true,
    orden: 29,
  },
  {
    codigo: 'fo_enterprise',
    nombre: 'Family Office Enterprise',
    descripcion:
      'Todo de Professional + API para Multi-Family Office (MDFF), reporting custom, optimización fiscal IA, SLA dedicado, onboarding presencial.',
    categoria: 'premium',
    precioMensual: 999,
    precioAnual: 9990,
    unidades: 1,
    tipoUnidad: 'modulo',
    disponiblePara: ['ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 90,
    costoUnitario: 100,
    destacado: false,
    orden: 30,
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORÍA: IA SUITE - Agentes IA Especializados
  // ══════════════════════════════════════════════════════════════

  {
    codigo: 'ia_suite',
    nombre: 'Suite IA Completa',
    descripcion:
      '10 agentes IA especializados: cobros automáticos, renovaciones inteligentes, screening inquilinos, negociador, copiloto financiero, due diligence, detector riesgos, OCR bancario.',
    categoria: 'feature',
    precioMensual: 49,
    precioAnual: 490,
    unidades: 1,
    tipoUnidad: 'modulo',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 70,
    costoUnitario: 15,
    destacado: true,
    orden: 31,
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORÍA: MEDIA ESTANCIA - Portales Premium
  // ══════════════════════════════════════════════════════════════

  {
    codigo: 'media_estancia_pro',
    nombre: 'Media Estancia Pro',
    descripcion:
      'Publicación en 9 portales (Álamo, Spotahome, HousingAnywhere, Badi, Beroomers, Homelike + Idealista, Fotocasa). Webhook de leads automático.',
    categoria: 'feature',
    precioMensual: 39,
    precioAnual: 390,
    unidades: 1,
    tipoUnidad: 'modulo',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 75,
    costoUnitario: 10,
    destacado: false,
    orden: 32,
  },
];

// ═══════════════════════════════════════════════════════════════
// ADD-ONS ESPECÍFICOS EWOORKER (Construcción B2B)
// Complementan los planes base de eWoorker
// ═══════════════════════════════════════════════════════════════

const EWOORKER_ADDONS = [
  // --- VERIFICACIÓN Y COMPLIANCE ---
  {
    codigo: 'ewoorker_verificacion_express',
    nombre: 'Verificación Express 24h',
    descripcion:
      'Verificación prioritaria de documentos y empresa en menos de 24 horas. Incluye revisión REA, seguros y certificaciones. Saltar la cola.',
    categoria: 'feature',
    precioMensual: 29,
    precioAnual: 290,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['OBRERO', 'CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: [],
    margenPorcentaje: 70,
    costoUnitario: 8.7,
    destacado: true,
    orden: 101,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_compliance_alerts',
    nombre: 'Compliance Hub Pro',
    descripcion:
      'Sistema de alertas automáticas para vencimiento de documentos (REA, seguros, PRL). Recordatorios 30, 15 y 7 días antes. Evita sanciones.',
    categoria: 'feature',
    precioMensual: 19,
    precioAnual: 190,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['OBRERO', 'CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 90,
    costoUnitario: 1.9,
    destacado: true,
    orden: 102,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_libro_subcontratacion',
    nombre: 'Libro Subcontratación Digital Pro',
    descripcion:
      'Generación automática del Libro de Subcontratación (Art. 8 Ley 32/2006). Formato oficial para inspección. Exportación PDF/Excel.',
    categoria: 'feature',
    precioMensual: 25,
    precioAnual: 250,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 85,
    costoUnitario: 3.75,
    destacado: false,
    orden: 103,
    vertical: 'ewoorker',
  },

  // --- MATCHING Y MARKETPLACE ---
  {
    codigo: 'ewoorker_matching_ia',
    nombre: 'Matching IA Avanzado',
    descripcion:
      'Algoritmo de IA (Claude) para encontrar subcontratistas ideales. Análisis de especialidad, zona, rating y disponibilidad. +40% match rate.',
    categoria: 'premium',
    precioMensual: 39,
    precioAnual: 390,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 75,
    costoUnitario: 9.75,
    destacado: true,
    orden: 104,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_destacado_marketplace',
    nombre: 'Perfil Destacado Marketplace',
    descripcion:
      'Tu empresa aparece en las primeras posiciones del marketplace. Badge "Empresa Destacada". 3x más visibilidad.',
    categoria: 'feature',
    precioMensual: 49,
    precioAnual: 490,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['OBRERO', 'CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 95,
    costoUnitario: 2.45,
    destacado: false,
    orden: 105,
    vertical: 'ewoorker',
  },

  // --- PAGOS Y ESCROW ---
  {
    codigo: 'ewoorker_escrow_hitos',
    nombre: 'Escrow con Hitos',
    descripcion:
      'Sistema de pagos fraccionados por hitos de obra. Libera pagos automáticamente al completar cada fase. Máxima seguridad.',
    categoria: 'premium',
    precioMensual: 35,
    precioAnual: 350,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 80,
    costoUnitario: 7.0,
    destacado: true,
    orden: 106,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_facturacion_automatica',
    nombre: 'Facturación Automática',
    descripcion:
      'Genera facturas automáticas al certificar hitos. Integración con contabilidad. Cumple SII/TicketBAI.',
    categoria: 'feature',
    precioMensual: 15,
    precioAnual: 150,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 85,
    costoUnitario: 2.25,
    destacado: false,
    orden: 107,
    vertical: 'ewoorker',
  },

  // --- ANALYTICS Y REPORTES ---
  {
    codigo: 'ewoorker_analytics_pro',
    nombre: 'Analytics Dashboard Pro',
    descripcion:
      '20+ KPIs avanzados, tendencias históricas, distribución geográfica, proyecciones. Informes personalizados para dirección.',
    categoria: 'premium',
    precioMensual: 45,
    precioAnual: 450,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 90,
    costoUnitario: 4.5,
    destacado: false,
    orden: 108,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_reportes_obra',
    nombre: 'Reportes de Obra Automáticos',
    descripcion:
      'Genera informes de seguimiento de obra automáticos (semanal/mensual). Partes de trabajo, fichajes, incidencias.',
    categoria: 'feature',
    precioMensual: 19,
    precioAnual: 190,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 85,
    costoUnitario: 2.85,
    destacado: false,
    orden: 109,
    vertical: 'ewoorker',
  },

  // --- USUARIOS Y EQUIPO ---
  {
    codigo: 'ewoorker_usuarios_extra_5',
    nombre: 'Pack 5 Usuarios Extra',
    descripcion:
      'Añade 5 usuarios adicionales a tu cuenta eWoorker. Gestiona tu equipo con roles diferenciados.',
    categoria: 'usage',
    precioMensual: 25,
    precioAnual: 250,
    unidades: 5,
    tipoUnidad: 'usuarios',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: [],
    margenPorcentaje: 90,
    costoUnitario: 2.5,
    destacado: false,
    orden: 110,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_usuarios_ilimitados',
    nombre: 'Usuarios Ilimitados',
    descripcion:
      'Sin límite de usuarios en tu cuenta eWoorker. Ideal para constructoras con equipos grandes.',
    categoria: 'feature',
    precioMensual: 79,
    precioAnual: 790,
    unidades: -1,
    tipoUnidad: 'usuarios',
    disponiblePara: ['CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 95,
    costoUnitario: 3.95,
    destacado: false,
    orden: 111,
    vertical: 'ewoorker',
  },

  // --- FIRMAS Y CONTRATOS ---
  {
    codigo: 'ewoorker_firmas_obra_10',
    nombre: 'Pack 10 Firmas Contrato Obra',
    descripcion:
      'Pack de 10 firmas digitales para contratos de obra. Validez legal según eIDAS. Certificado de firma incluido.',
    categoria: 'usage',
    precioMensual: 20,
    precioAnual: 200,
    unidades: 10,
    tipoUnidad: 'firmas',
    disponiblePara: ['OBRERO', 'CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: [],
    margenPorcentaje: 50,
    costoUnitario: 10.0,
    destacado: true,
    orden: 112,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_firmas_obra_50',
    nombre: 'Pack 50 Firmas Contrato Obra',
    descripcion:
      'Pack empresarial de 50 firmas para contratos y certificaciones de obra. Ahorra 30%.',
    categoria: 'usage',
    precioMensual: 70,
    precioAnual: 700,
    unidades: 50,
    tipoUnidad: 'firmas',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: [],
    margenPorcentaje: 55,
    costoUnitario: 31.5,
    destacado: false,
    orden: 113,
    vertical: 'ewoorker',
  },

  // --- SEGUROS Y GARANTÍAS ---
  {
    codigo: 'ewoorker_seguro_impago',
    nombre: 'Seguro de Impago',
    descripcion:
      'Protección contra impagos en obras. Cobertura hasta 10.000€/obra. Tranquilidad garantizada.',
    categoria: 'premium',
    precioMensual: 59,
    precioAnual: 590,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: [],
    margenPorcentaje: 25,
    costoUnitario: 44.25,
    destacado: true,
    orden: 114,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_garantia_obra',
    nombre: 'Garantía de Obra Extendida',
    descripcion:
      'Garantía extendida de 2 años en trabajos realizados. Cobertura de defectos y reparaciones.',
    categoria: 'premium',
    precioMensual: 39,
    precioAnual: 390,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: [],
    margenPorcentaje: 30,
    costoUnitario: 27.3,
    destacado: false,
    orden: 115,
    vertical: 'ewoorker',
  },

  // --- COMUNICACIÓN ---
  {
    codigo: 'ewoorker_chat_prioritario',
    nombre: 'Chat Prioritario',
    descripcion:
      'Soporte prioritario vía chat con respuesta en menos de 2 horas. Línea directa con Account Manager.',
    categoria: 'feature',
    precioMensual: 15,
    precioAnual: 150,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['OBRERO', 'CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CAPATAZ', 'CONSTRUCTOR'],
    margenPorcentaje: 85,
    costoUnitario: 2.25,
    destacado: false,
    orden: 116,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_notificaciones_obra',
    nombre: 'Notificaciones Obra en Tiempo Real',
    descripcion:
      'Alertas push y SMS para eventos de obra: fichajes, incidencias, certificaciones, pagos.',
    categoria: 'feature',
    precioMensual: 12,
    precioAnual: 120,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 80,
    costoUnitario: 2.4,
    destacado: false,
    orden: 117,
    vertical: 'ewoorker',
  },

  // --- FORMACIÓN Y SOPORTE ---
  {
    codigo: 'ewoorker_onboarding_personalizado',
    nombre: 'Onboarding Personalizado',
    descripcion:
      'Sesión de formación 1:1 con experto eWoorker. Configuración completa de tu cuenta. 2 horas.',
    categoria: 'usage',
    precioMensual: 99,
    precioAnual: 99,
    unidades: 1,
    tipoUnidad: 'sesiones',
    disponiblePara: ['OBRERO', 'CAPATAZ', 'CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 70,
    costoUnitario: 29.7,
    destacado: false,
    orden: 118,
    vertical: 'ewoorker',
  },
  {
    codigo: 'ewoorker_api_access',
    nombre: 'API Access',
    descripcion:
      'Acceso a la API REST de eWoorker. Integra tu ERP/software con el marketplace. Documentación completa.',
    categoria: 'premium',
    precioMensual: 89,
    precioAnual: 890,
    unidades: 1,
    tipoUnidad: 'servicio',
    disponiblePara: ['CONSTRUCTOR'],
    incluidoEn: ['CONSTRUCTOR'],
    margenPorcentaje: 95,
    costoUnitario: 4.45,
    destacado: false,
    orden: 119,
    vertical: 'ewoorker',
  },
];

// ═══════════════════════════════════════════════════════════════
// PLANES EWOORKER (Construcción B2B)
// SINCRONIZADO CON: /app/ewoorker/landing/page.tsx
// ═══════════════════════════════════════════════════════════════

const EWOORKER_PLANS = [
  {
    codigo: 'OBRERO',
    nombre: 'eWoorker Obrero',
    descripcion:
      'Plan gratuito para empezar. Acceso básico al marketplace con comisión por obra cerrada.',
    precioMensual: 0,
    precioAnual: 0,
    maxOfertas: 3,
    comisionEscrow: 5,
    features: [
      'Perfil básico',
      'Ver obras públicas',
      '3 ofertas/mes',
      'Chat básico',
      'Soporte email',
    ],
    socioPercentage: 50,
    plataformaPercentage: 50,
    destacado: false,
    orden: 1,
  },
  {
    codigo: 'CAPATAZ',
    nombre: 'eWoorker Capataz',
    descripcion: 'El más popular. Ofertas ilimitadas, compliance completo y comisión reducida.',
    precioMensual: 49,
    precioAnual: 490,
    maxOfertas: -1,
    comisionEscrow: 2,
    features: [
      'Todo de Obrero',
      'Ofertas ilimitadas',
      'Compliance Hub completo',
      'Chat prioritario',
      'Sistema escrow (+2% comisión)',
      'Certificaciones digitales',
      'Badge "Capataz" visible',
    ],
    socioPercentage: 50,
    plataformaPercentage: 50,
    destacado: true,
    orden: 2,
  },
  {
    codigo: 'CONSTRUCTOR',
    nombre: 'eWoorker Constructor',
    descripcion: 'Para constructoras serias. Sin comisiones, obras ilimitadas y account manager.',
    precioMensual: 149,
    precioAnual: 1490,
    maxOfertas: -1,
    comisionEscrow: 0,
    features: [
      'Todo de Capataz',
      'Obras ilimitadas',
      'Marketplace destacado',
      'API de integración',
      'Dashboard analytics avanzado',
      'Account manager dedicado',
      '0% comisiones en escrow',
      'Multi-usuario (hasta 5)',
      'Prioridad en matching',
    ],
    socioPercentage: 50,
    plataformaPercentage: 50,
    destacado: false,
    orden: 3,
  },
];

async function main() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('🌱 SEED: Add-ons INMOVA + Planes eWoorker');
  console.log('═'.repeat(70));
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // SEED ADD-ONS
  // ═══════════════════════════════════════════════════════════════

  console.log('📦 ADD-ONS INMOVA:');
  console.log('─'.repeat(70));

  let usageCount = 0,
    featureCount = 0,
    premiumCount = 0;

  for (const addon of ADDONS) {
    await prisma.addOn.upsert({
      where: { codigo: addon.codigo },
      update: {
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        categoria: addon.categoria,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual,
        unidades: addon.unidades,
        tipoUnidad: addon.tipoUnidad,
        disponiblePara: addon.disponiblePara,
        incluidoEn: addon.incluidoEn,
        margenPorcentaje: addon.margenPorcentaje,
        costoUnitario: addon.costoUnitario,
        destacado: addon.destacado,
        orden: addon.orden,
        activo: true,
      },
      create: {
        codigo: addon.codigo,
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        categoria: addon.categoria,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual,
        unidades: addon.unidades,
        tipoUnidad: addon.tipoUnidad,
        disponiblePara: addon.disponiblePara,
        incluidoEn: addon.incluidoEn,
        margenPorcentaje: addon.margenPorcentaje,
        costoUnitario: addon.costoUnitario,
        destacado: addon.destacado,
        orden: addon.orden,
        activo: true,
      },
    });

    const precio = addon.precioMensual === 0 ? 'Comisiones' : `€${addon.precioMensual}/mes`;
    const margen = addon.margenPorcentaje ? `${addon.margenPorcentaje}%` : 'Variable';
    const highlight = addon.destacado ? ' ⭐' : '';
    console.log(`  ✅ ${addon.nombre}${highlight}: ${precio} (margen: ${margen})`);

    if (addon.categoria === 'usage') usageCount++;
    else if (addon.categoria === 'feature') featureCount++;
    else premiumCount++;
  }

  // ═══════════════════════════════════════════════════════════════
  // SEED ADD-ONS EWOORKER
  // ═══════════════════════════════════════════════════════════════

  console.log('');
  console.log('🏗️ ADD-ONS EWOORKER:');
  console.log('─'.repeat(70));

  let ewoorkerUsageCount = 0,
    ewoorkerFeatureCount = 0,
    ewoorkerPremiumCount = 0;

  for (const addon of EWOORKER_ADDONS) {
    await prisma.addOn.upsert({
      where: { codigo: addon.codigo },
      update: {
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        categoria: addon.categoria,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual,
        unidades: addon.unidades,
        tipoUnidad: addon.tipoUnidad,
        disponiblePara: addon.disponiblePara,
        incluidoEn: addon.incluidoEn,
        margenPorcentaje: addon.margenPorcentaje,
        costoUnitario: addon.costoUnitario,
        destacado: addon.destacado,
        orden: addon.orden,
        activo: true,
        vertical: 'ewoorker', // Marca como eWoorker
      },
      create: {
        codigo: addon.codigo,
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        categoria: addon.categoria,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual,
        unidades: addon.unidades,
        tipoUnidad: addon.tipoUnidad,
        disponiblePara: addon.disponiblePara,
        incluidoEn: addon.incluidoEn,
        margenPorcentaje: addon.margenPorcentaje,
        costoUnitario: addon.costoUnitario,
        destacado: addon.destacado,
        orden: addon.orden,
        activo: true,
        vertical: 'ewoorker', // Marca como eWoorker
      },
    });

    const precio = addon.precioMensual === 0 ? 'Comisiones' : `€${addon.precioMensual}/mes`;
    const margen = addon.margenPorcentaje ? `${addon.margenPorcentaje}%` : 'Variable';
    const highlight = addon.destacado ? ' ⭐' : '';
    console.log(`  ✅ ${addon.nombre}${highlight}: ${precio} (margen: ${margen})`);

    if (addon.categoria === 'usage') ewoorkerUsageCount++;
    else if (addon.categoria === 'feature') ewoorkerFeatureCount++;
    else ewoorkerPremiumCount++;
  }

  console.log('');
  console.log('🏗️ PLANES EWOORKER:');
  console.log('─'.repeat(70));

  for (const plan of EWOORKER_PLANS) {
    await prisma.ewoorkerPlan.upsert({
      where: { codigo: plan.codigo },
      update: {
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precioMensual: plan.precioMensual,
        precioAnual: plan.precioAnual,
        maxOfertas: plan.maxOfertas,
        comisionEscrow: plan.comisionEscrow,
        features: plan.features,
        socioPercentage: plan.socioPercentage,
        plataformaPercentage: plan.plataformaPercentage,
        destacado: plan.destacado,
        orden: plan.orden,
        activo: true,
      },
      create: {
        codigo: plan.codigo,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precioMensual: plan.precioMensual,
        precioAnual: plan.precioAnual,
        maxOfertas: plan.maxOfertas,
        comisionEscrow: plan.comisionEscrow,
        features: plan.features,
        socioPercentage: plan.socioPercentage,
        plataformaPercentage: plan.plataformaPercentage,
        destacado: plan.destacado,
        orden: plan.orden,
        activo: true,
      },
    });

    const ofertas = plan.maxOfertas === -1 ? 'Ilimitadas' : `${plan.maxOfertas}/mes`;
    const highlight = plan.destacado ? ' ⭐' : '';
    console.log(
      `  ✅ ${plan.nombre}${highlight}: €${plan.precioMensual}/mes | Escrow: ${plan.comisionEscrow}%`
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RESUMEN
  // ═══════════════════════════════════════════════════════════════

  console.log('');
  console.log('═'.repeat(70));
  console.log('');
  console.log('📊 RESUMEN:');
  console.log('');
  console.log(`  Add-ons INMOVA totales: ${ADDONS.length}`);
  console.log(`    - Packs de uso: ${usageCount}`);
  console.log(`    - Funcionalidades: ${featureCount}`);
  console.log(`    - Premium: ${premiumCount}`);
  console.log('');
  console.log(`  Add-ons EWOORKER totales: ${EWOORKER_ADDONS.length}`);
  console.log(`    - Packs de uso: ${ewoorkerUsageCount}`);
  console.log(`    - Funcionalidades: ${ewoorkerFeatureCount}`);
  console.log(`    - Premium: ${ewoorkerPremiumCount}`);
  console.log('');
  console.log(`  Planes eWoorker: ${EWOORKER_PLANS.length}`);
  console.log('');

  // Tabla de precios destacados
  console.log('💰 ADD-ONS DESTACADOS:');
  console.log('┌─────────────────────────────────────┬──────────┬─────────┬─────────┐');
  console.log('│ Add-on                              │ Precio   │ Costo   │ Margen  │');
  console.log('├─────────────────────────────────────┼──────────┼─────────┼─────────┤');
  for (const addon of ADDONS.filter((a) => a.destacado)) {
    const nombre = addon.nombre.substring(0, 35).padEnd(35);
    const precio = `€${addon.precioMensual}`.padEnd(8);
    const costo = `€${addon.costoUnitario || 0}`.padEnd(7);
    const margen = addon.margenPorcentaje ? `${addon.margenPorcentaje}%`.padEnd(7) : 'N/A    ';
    console.log(`│ ${nombre} │ ${precio} │ ${costo} │ ${margen} │`);
  }
  console.log('└─────────────────────────────────────┴──────────┴─────────┴─────────┘');

  console.log('');
  console.log('✅ Seed completado exitosamente');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
