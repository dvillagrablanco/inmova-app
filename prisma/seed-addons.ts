/**
 * Seed: Add-ons y Planes eWoorker
 * 
 * Este script crea/actualiza:
 * 1. Add-ons disponibles para suscriptores de INMOVA
 * 2. Planes de suscripción de eWoorker (construcción B2B)
 * 
 * Los add-ons mostrados en la landing DEBEN coincidir con esta configuración:
 * - Pack 10 Firmas: €15/mes
 * - Pack 10GB Storage: €5/mes
 * - Pack IA Avanzada: €10/mes (50K tokens)
 * - Pack 50 SMS: €8/mes
 * - White-label: €49/mes
 * - Acceso API: €29/mes
 * 
 * Planes eWoorker (construcción B2B):
 * - Obrero: €29/mes
 * - Capataz: €79/mes
 * - Constructor: €199/mes
 * 
 * Ejecutar: npx tsx prisma/seed-addons.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// ADD-ONS INMOVA (Mejoras opcionales)
// ═══════════════════════════════════════════════════════════════

const ADDONS = [
  {
    codigo: 'signatures_pack_10',
    nombre: 'Pack 10 Firmas',
    descripcion: 'Pack de 10 firmas digitales adicionales por mes. Ideal si excedes el límite de tu plan.',
    categoria: 'usage',
    precioMensual: 15,
    precioAnual: 150, // 2 meses gratis
    unidades: 10,
    tipoUnidad: 'firmas',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 33, // Costo: €10 (10 firmas × €1)
    costoUnitario: 10,
    destacado: true,
    orden: 1,
  },
  {
    codigo: 'storage_pack_10gb',
    nombre: 'Pack 10GB Storage',
    descripcion: 'Almacenamiento adicional de 10GB para documentos, fotos y contratos.',
    categoria: 'usage',
    precioMensual: 5,
    precioAnual: 50,
    unidades: 10,
    tipoUnidad: 'GB',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 95, // Costo: €0.23 (10GB × €0.023)
    costoUnitario: 0.23,
    destacado: false,
    orden: 2,
  },
  {
    codigo: 'ai_pack_50k',
    nombre: 'Pack IA Avanzada',
    descripcion: '50,000 tokens de IA adicionales por mes. Valoraciones automáticas, asistente inteligente y más.',
    categoria: 'usage',
    precioMensual: 10,
    precioAnual: 100,
    unidades: 50000,
    tipoUnidad: 'tokens',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 97, // Costo: €0.25 (50K tokens × €0.005/1K)
    costoUnitario: 0.25,
    destacado: true,
    orden: 3,
  },
  {
    codigo: 'sms_pack_50',
    nombre: 'Pack 50 SMS',
    descripcion: 'Pack de 50 notificaciones SMS para recordatorios de pago, alertas y comunicaciones urgentes.',
    categoria: 'usage',
    precioMensual: 8,
    precioAnual: 80,
    unidades: 50,
    tipoUnidad: 'sms',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    margenPorcentaje: 53, // Costo: €3.75 (50 SMS × €0.075)
    costoUnitario: 3.75,
    destacado: false,
    orden: 4,
  },
  {
    codigo: 'whitelabel',
    nombre: 'White-label',
    descripcion: 'Tu marca, tu dominio. Elimina la marca INMOVA y personaliza completamente la plataforma.',
    categoria: 'premium',
    precioMensual: 49,
    precioAnual: 490,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 90, // Costo estimado: €5 (mantenimiento)
    costoUnitario: 5,
    destacado: true,
    orden: 5,
  },
  {
    codigo: 'api_access',
    nombre: 'Acceso API',
    descripcion: 'Acceso completo a la API REST de INMOVA para integraciones personalizadas con tus sistemas.',
    categoria: 'premium',
    precioMensual: 29,
    precioAnual: 290,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['STARTER', 'PROFESSIONAL'],
    incluidoEn: ['BUSINESS', 'ENTERPRISE'],
    margenPorcentaje: 100, // Costo: €0 (infraestructura ya cubierta)
    costoUnitario: 0,
    destacado: false,
    orden: 6,
  },
  // Add-ons adicionales de valor (para planes superiores)
  {
    codigo: 'esg_module',
    nombre: 'Módulo ESG & Sostenibilidad',
    descripcion: 'Huella de carbono, certificaciones verdes y reportes CSRD para compliance europeo.',
    categoria: 'feature',
    precioMensual: 50,
    precioAnual: 500,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 80,
    costoUnitario: 10,
    destacado: false,
    orden: 7,
  },
  {
    codigo: 'pricing_ia',
    nombre: 'Pricing Dinámico IA',
    descripcion: 'Optimización de precios para STR y Coliving con Machine Learning. +15-30% ingresos.',
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
    orden: 8,
  },
  {
    codigo: 'tours_vr',
    nombre: 'Tours Virtuales AR/VR',
    descripcion: 'Tours 360°, realidad virtual y aumentada para tus propiedades. +40% conversión.',
    categoria: 'feature',
    precioMensual: 30,
    precioAnual: 300,
    unidades: null,
    tipoUnidad: null,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    margenPorcentaje: 80,
    costoUnitario: 6,
    destacado: false,
    orden: 9,
  },
];

// ═══════════════════════════════════════════════════════════════
// PLANES EWOORKER (Construcción B2B)
// 
// SINCRONIZADO CON: /app/ewoorker/landing/page.tsx
//
// Modelo de negocio freemium + comisión:
// - Obrero: Gratis + 5% comisión (adquisición)
// - Capataz: €49/mes + 2% comisión (conversión)
// - Constructor: €149/mes + 0% comisión (retención premium)
// ═══════════════════════════════════════════════════════════════

const EWOORKER_PLANS = [
  {
    codigo: 'OBRERO',
    nombre: 'eWoorker Obrero',
    descripcion: 'Plan gratuito para empezar. Acceso básico al marketplace con comisión por obra cerrada.',
    precioMensual: 0, // Gratuito - modelo freemium
    precioAnual: 0,
    maxOfertas: 3,
    comisionEscrow: 5, // 5% por obra cerrada
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
    precioMensual: 49, // €49/mes
    precioAnual: 490,
    maxOfertas: -1, // Ilimitado
    comisionEscrow: 2, // 2% por obra cerrada (reducido)
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
    precioMensual: 149, // €149/mes
    precioAnual: 1490,
    maxOfertas: -1, // Ilimitado
    comisionEscrow: 0, // 0% - SIN comisiones extra
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
  console.log('🌱 Seeding Add-ons y Planes eWoorker...\n');

  // ═══════════════════════════════════════════════════════════════
  // SEED ADD-ONS
  // ═══════════════════════════════════════════════════════════════
  
  console.log('📦 ADD-ONS INMOVA:');
  console.log('─'.repeat(70));
  
  for (const addon of ADDONS) {
    const result = await prisma.addOn.upsert({
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
    
    const margen = addon.margenPorcentaje ? `${addon.margenPorcentaje}%` : 'N/A';
    console.log(`  ✅ ${addon.nombre}: €${addon.precioMensual}/mes (margen: ${margen})`);
  }

  console.log('');
  console.log('🏗️ PLANES EWOORKER:');
  console.log('─'.repeat(70));
  
  for (const plan of EWOORKER_PLANS) {
    const result = await prisma.ewoorkerPlan.upsert({
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
    console.log(`  ✅ ${plan.nombre}: €${plan.precioMensual}/mes | Ofertas: ${ofertas} | Escrow: ${plan.comisionEscrow}%`);
  }

  console.log('');
  console.log('═'.repeat(70));
  console.log('');
  console.log('📊 RESUMEN DE PRECIOS:');
  console.log('');
  console.log('ADD-ONS DESTACADOS:');
  console.log('┌─────────────────────────────┬──────────┬─────────┬───────────┐');
  console.log('│ Add-on                      │ Precio   │ Costo   │ Margen    │');
  console.log('├─────────────────────────────┼──────────┼─────────┼───────────┤');
  for (const addon of ADDONS.filter(a => a.destacado)) {
    const nombre = addon.nombre.padEnd(27);
    const precio = `€${addon.precioMensual}/mes`.padEnd(8);
    const costo = `€${addon.costoUnitario}`.padEnd(7);
    const margen = `${addon.margenPorcentaje}%`.padEnd(9);
    console.log(`│ ${nombre} │ ${precio} │ ${costo} │ ${margen} │`);
  }
  console.log('└─────────────────────────────┴──────────┴─────────┴───────────┘');
  console.log('');
  console.log('PLANES EWOORKER:');
  console.log('┌─────────────────────────────┬──────────┬──────────┬───────────┐');
  console.log('│ Plan                        │ Precio   │ Escrow   │ Split     │');
  console.log('├─────────────────────────────┼──────────┼──────────┼───────────┤');
  for (const plan of EWOORKER_PLANS) {
    const nombre = plan.nombre.padEnd(27);
    const precio = `€${plan.precioMensual}/mes`.padEnd(8);
    const escrow = `${plan.comisionEscrow}%`.padEnd(8);
    const split = `${plan.socioPercentage}/${plan.plataformaPercentage}`.padEnd(9);
    console.log(`│ ${nombre} │ ${precio} │ ${escrow} │ ${split} │`);
  }
  console.log('└─────────────────────────────┴──────────┴──────────┴───────────┘');
  console.log('');
  console.log('✅ Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
