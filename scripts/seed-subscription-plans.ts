/**
 * @deprecated Use `scripts/sync-plans-landing.ts` instead.
 * This script has outdated plan definitions that don't match the landing page.
 * Run: npx tsx scripts/sync-plans-landing.ts
 */
/**
 * Script para poblar planes de suscripción según el plan de negocio 2026
 * Ejecutar: npx tsx scripts/seed-subscription-plans.ts
 */

import prisma from '../lib/db';

const PLANES_NEGOCIO_2026 = [
  {
    nombre: 'Basic',
    descripcion:
      'Plan perfecto para empezar a digitalizar tu gestión inmobiliaria. Ideal para propietarios con pocas propiedades.',
    tier: 'basico',
    precioMensual: 49,
    maxUsuarios: 2,
    maxPropiedades: 5,
    maxVerticales: 1,
    modulosIncluidos: [
      'Gestión de Propiedades',
      'Portal Inquilino Básico',
      'Contratos Digitales',
      'Notificaciones Email',
    ],
    features: [
      'Dashboard básico',
      'Gestión de hasta 5 propiedades',
      '2 usuarios incluidos',
      '1 vertical incluido',
      'Soporte por email (48h)',
      'Portal inquilino web',
      'Documentos básicos',
      'App móvil',
    ],
    activo: true,
  },
  {
    nombre: 'Professional',
    descripcion:
      'Plan avanzado para gestores profesionales. Incluye herramientas de CRM, automatización y análisis.',
    tier: 'profesional',
    precioMensual: 149,
    maxUsuarios: 10,
    maxPropiedades: 25,
    maxVerticales: 2,
    modulosIncluidos: [
      'Gestión de Propiedades',
      'CRM Inmobiliario',
      'Portal Inquilino Avanzado',
      'Contratos Digitales',
      'Gestión de Pagos',
      'Informes y Analytics',
      'Notificaciones Multi-canal',
      'API Access (Básico)',
      '1 Módulo Transversal GRATIS',
    ],
    features: [
      'Todo lo de Basic',
      'Hasta 25 propiedades',
      '10 usuarios incluidos',
      '2 verticales incluidos',
      'CRM con pipeline de ventas',
      'Automatizaciones básicas',
      'Informes personalizados',
      'Soporte prioritario (24h)',
      '1 módulo add-on gratis',
      'Integraciones con terceros',
      'Firma digital de contratos',
    ],
    activo: true,
  },
  {
    nombre: 'Business',
    descripcion:
      'Solución completa para empresas y gestoras grandes. Multi-vertical, usuarios ilimitados, y todos los módulos premium.',
    tier: 'empresarial',
    precioMensual: 349,
    maxUsuarios: null, // Ilimitado
    maxPropiedades: null, // Ilimitado
    maxVerticales: 6,
    modulosIncluidos: [
      'Gestión de Propiedades',
      'CRM Inmobiliario Avanzado',
      'Portal Inquilino Premium',
      'Contratos Digitales + Firma',
      'Gestión de Pagos',
      'Contabilidad Integrada',
      'Gestión de Comunidades',
      'Gestión de Incidencias',
      'Informes y Analytics Avanzado',
      'Notificaciones Multi-canal',
      'API Access (Completo)',
      'Automatizaciones Avanzadas',
      '3 Módulos Transversales INCLUIDOS',
    ],
    features: [
      'Todo lo de Professional',
      'Propiedades ilimitadas',
      'Usuarios ilimitados',
      'Hasta 6 verticales',
      'Todos los módulos core',
      '3 módulos add-on incluidos',
      'Multi-empresa',
      'Workflows personalizados',
      'Integraciones avanzadas',
      'Soporte 24/7',
      'Account manager dedicado',
      'Capacitación incluida',
    ],
    activo: true,
  },
  {
    nombre: 'Enterprise',
    descripcion:
      'Solución enterprise con desarrollo a medida, SLA premium, y soporte white-label. Para grandes corporaciones y fondos de inversión.',
    tier: 'premium',
    precioMensual: 2000,
    maxUsuarios: null, // Ilimitado
    maxPropiedades: null, // Ilimitado
    maxVerticales: 6,
    modulosIncluidos: [
      'TODO LO DE BUSINESS',
      'Desarrollo Custom',
      'White-Label',
      'SSO / SAML',
      'Migración de Datos Asistida',
      'Capacitación On-site',
      'TODOS los Módulos Transversales',
      'Prioridad en Roadmap',
      'Infraestructura Dedicada (Opcional)',
    ],
    features: [
      'Todo lo de Business',
      'Desarrollo a medida',
      'White-label disponible',
      'SLA 99.9% garantizado',
      'Infraestructura dedicada',
      'Todos los add-ons incluidos',
      'Consultoría estratégica',
      'Soporte 24/7 premium',
      'Account manager senior',
      'Acceso anticipado a nuevas features',
      'Integraciones custom',
      'Capacitación ilimitada',
    ],
    activo: true,
  },
  // Plan para Partners (referencia)
  {
    nombre: 'Partner Referral',
    descripcion:
      'Plan especial para clientes referidos por partners. Precio negociado según acuerdo con partner.',
    tier: 'profesional',
    precioMensual: 149,
    maxUsuarios: 10,
    maxPropiedades: 25,
    maxVerticales: 2,
    modulosIncluidos: [
      'Según configuración de Partner',
      'Comisión 20% para Partner',
      'Co-branding opcional',
    ],
    features: [
      'Características según tier Professional',
      'Comisión recurrente al partner',
      'Descuentos por volumen disponibles',
      'Soporte compartido',
    ],
    activo: false, // No visible públicamente
  },
  // Plan Demo (para demostraciones del superadmin)
  {
    nombre: 'Demo',
    descripcion:
      'Plan especial para demostraciones a potenciales clientes. Incluye todas las funcionalidades y datos de ejemplo.',
    tier: 'premium',
    precioMensual: 0, // Gratis
    maxUsuarios: null, // Ilimitado
    maxPropiedades: null, // Ilimitado
    maxVerticales: 6,
    modulosIncluidos: [
      'TODAS las funcionalidades',
      'Datos de ejemplo precargados',
      'Acceso completo a todos los módulos',
      'Todos los verticales activos',
      'Todos los módulos transversales',
      'Sin limitaciones',
    ],
    features: [
      'Todas las características Enterprise',
      'Datos demo precargados',
      'Perfecto para demostraciones',
      'Acceso completo e ilimitado',
      'Sin costo',
      'Solo para uso interno',
    ],
    activo: false, // No visible públicamente, solo para superadmin
  },
];

async function main() {
  console.log('🚀 Iniciando seed de planes de suscripción...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const planData of PLANES_NEGOCIO_2026) {
    try {
      // Verificar si el plan ya existe por nombre
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: { nombre: planData.nombre },
      });

      if (existingPlan) {
        // Actualizar plan existente
        await prisma.subscriptionPlan.update({
          where: { id: existingPlan.id },
          data: {
            descripcion: planData.descripcion,
            tier: planData.tier,
            precioMensual: planData.precioMensual,
            maxUsuarios: planData.maxUsuarios,
            maxPropiedades: planData.maxPropiedades,
            modulosIncluidos: planData.modulosIncluidos,
            activo: planData.activo,
          },
        });

        console.log(`✅ Plan "${planData.nombre}" actualizado - €${planData.precioMensual}/mes`);
        updated++;
      } else {
        // Crear nuevo plan
        await prisma.subscriptionPlan.create({
          data: {
            nombre: planData.nombre,
            descripcion: planData.descripcion,
            tier: planData.tier,
            precioMensual: planData.precioMensual,
            maxUsuarios: planData.maxUsuarios,
            maxPropiedades: planData.maxPropiedades,
            modulosIncluidos: planData.modulosIncluidos,
            activo: planData.activo,
          },
        });

        console.log(`🆕 Plan "${planData.nombre}" creado - €${planData.precioMensual}/mes`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Error procesando plan "${planData.nombre}":`, error);
      skipped++;
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`  • Planes creados: ${created}`);
  console.log(`  • Planes actualizados: ${updated}`);
  console.log(`  • Errores: ${skipped}`);
  console.log(`  • Total procesados: ${created + updated + skipped}\n`);

  // Mostrar planes activos
  const activeePlans = await prisma.subscriptionPlan.findMany({
    where: { activo: true },
    orderBy: { precioMensual: 'asc' },
  });

  console.log('📋 Planes activos en el sistema:');
  activeePlans.forEach((plan) => {
    const propiedades = plan.maxPropiedades ? `${plan.maxPropiedades} props` : 'Ilimitado';
    const usuarios = plan.maxUsuarios ? `${plan.maxUsuarios} users` : 'Ilimitado';
    console.log(`  • ${plan.nombre} - €${plan.precioMensual}/mes (${propiedades}, ${usuarios})`);
  });

  console.log('\n✅ Seed completado exitosamente!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
