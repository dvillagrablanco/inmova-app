import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('Creando planes de suscripción...');

  // Plan Starter (tier: basico) - €89/mes
  let planStarter = await prisma.subscriptionPlan.findFirst({
    where: { tier: 'basico' }
  });

  if (planStarter) {
    planStarter = await prisma.subscriptionPlan.update({
      where: { id: planStarter.id },
      data: {
      nombre: 'Starter',
      descripcion: 'Plan ideal para emprendedores y pequeños gestores. Todos los 56 módulos incluidos desde el primer día. Máx. 3 usuarios, 25 propiedades.',
      precioMensual: 89,
      maxUsuarios: 3,
      maxPropiedades: 25,
      modulosIncluidos: [
        'gestion_edificios',
        'gestion_unidades',
        'gestion_inquilinos',
        'gestion_contratos',
        'gestion_pagos',
        'mantenimiento',
        'calendario',
        'chat_inquilinos',
        'documentos',
        'reportes_basicos',
        'portal_inquilino',
        'notificaciones'
      ],
      activo: true,
      }
    });
  } else {
    planStarter = await prisma.subscriptionPlan.create({
      data: {
        tier: 'basico',
        nombre: 'Starter',
        descripcion: 'Plan ideal para emprendedores y pequeños gestores. Todos los 56 módulos incluidos desde el primer día. Máx. 3 usuarios, 25 propiedades.',
        precioMensual: 89,
        maxUsuarios: 3,
        maxPropiedades: 25,
        modulosIncluidos: [
          'gestion_edificios',
          'gestion_unidades',
          'gestion_inquilinos',
          'gestion_contratos',
          'gestion_pagos',
          'mantenimiento',
          'calendario',
          'chat_inquilinos',
          'documentos',
          'reportes_basicos',
          'portal_inquilino',
          'notificaciones'
        ],
        activo: true,
      }
    });
  }

  console.log('✓ Plan Starter creado:', planStarter.nombre, '-', planStarter.precioMensual, '€/mes');

  // Plan Profesional - €169/mes
  let planProfesional = await prisma.subscriptionPlan.findFirst({
    where: { tier: 'profesional' }
  });

  if (planProfesional) {
    planProfesional = await prisma.subscriptionPlan.update({
      where: { id: planProfesional.id },
      data: {
      nombre: 'Profesional',
      descripcion: 'Plan para gestoras en crecimiento. Todos los 56 módulos + Portal inquilino y propietario + Firma Digital + CRM. Máx. 10 usuarios, 100 propiedades.',
      precioMensual: 169,
      maxUsuarios: 10,
      maxPropiedades: 100,
      modulosIncluidos: [
        // Módulos del plan Profesional
        'gestion_edificios',
        'gestion_unidades',
        'gestion_inquilinos',
        'gestion_contratos',
        'gestion_pagos',
        'mantenimiento',
        'calendario',
        'chat_inquilinos',
        'documentos',
        'portal_inquilino',
        'notificaciones',
        // Módulos adicionales del plan Empresa
        'mantenimiento_preventivo',
        'candidatos_screening',
        'firma_digital',
        'facturacion_avanzada',
        'contabilidad',
        'analytics',
        'bi_reportes',
        'gastos',
        'proveedores',
        'ordenes_trabajo',
        'crm',
        'portal_propietario',
        'galerias_fotos',
        'valoraciones',
        'publicaciones',
        'sms',
        'reservas_espacios',
        'seguros',
        'certificaciones'
      ],
      activo: true,
      }
    });
  } else {
    planProfesional = await prisma.subscriptionPlan.create({
      data: {
        tier: 'profesional',
        nombre: 'Profesional',
        descripcion: 'Plan para gestoras en crecimiento. Todos los 56 módulos + Portal inquilino y propietario + Firma Digital + CRM. Máx. 10 usuarios, 100 propiedades.',
        precioMensual: 169,
        maxUsuarios: 10,
        maxPropiedades: 100,
      modulosIncluidos: [
        'gestion_edificios',
        'gestion_unidades',
        'gestion_inquilinos',
        'gestion_contratos',
        'gestion_pagos',
        'mantenimiento',
        'calendario',
        'chat_inquilinos',
        'documentos',
        'portal_inquilino',
        'notificaciones',
        'mantenimiento_preventivo',
        'candidatos_screening',
        'firma_digital',
        'facturacion_avanzada',
        'contabilidad',
        'analytics',
        'bi_reportes',
        'gastos',
        'proveedores',
        'ordenes_trabajo',
        'crm',
        'portal_propietario',
        'galerias_fotos',
        'valoraciones',
        'publicaciones',
        'sms',
        'reservas_espacios',
        'seguros',
        'certificaciones'
      ],
      activo: true,
      }
    });
  }

  console.log('✓ Plan Profesional creado:', planProfesional.nombre, '-', planProfesional.precioMensual, '€/mes');

  // Plan Empresa - €329/mes
  let planEmpresa = await prisma.subscriptionPlan.findFirst({
    where: { tier: 'empresarial' }
  });

  if (planEmpresa) {
    planEmpresa = await prisma.subscriptionPlan.update({
      where: { id: planEmpresa.id },
      data: {
      nombre: 'Empresa',
      descripcion: 'Solución completa para empresas consolidadas. White Label + Integraciones ERP + SLA 99.9%. Máx. 25 usuarios, 250 propiedades.',
      precioMensual: 329,
      maxUsuarios: 25,
      maxPropiedades: 250,
      modulosIncluidos: [
        // Todos los módulos del plan Empresa
        'gestion_edificios',
        'gestion_unidades',
        'gestion_inquilinos',
        'gestion_contratos',
        'gestion_pagos',
        'mantenimiento',
        'calendario',
        'chat_inquilinos',
        'documentos',
        'portal_inquilino',
        'notificaciones',
        'mantenimiento_preventivo',
        'candidatos_screening',
        'firma_digital',
        'facturacion_avanzada',
        'contabilidad',
        'analytics',
        'bi_reportes',
        'gastos',
        'proveedores',
        'ordenes_trabajo',
        'crm',
        'portal_propietario',
        'galerias_fotos',
        'valoraciones',
        'publicaciones',
        'sms',
        'reservas_espacios',
        'seguros',
        'certificaciones',
        // Módulos exclusivos Enterprise
        'mantenimiento_pro',
        'ai_asistente',
        'ocr',
        'blockchain',
        'open_banking',
        'iot_smart_buildings',
        'energia',
        'esg',
        'marketplace_servicios',
        'ar_vr_tours',
        'pricing_dinamico',
        'economia_circular',
        'comunidad_social',
        'seguridad_compliance',
        'integraciones_contables',
        'str_alquileres',
        'flipping_properties',
        'construction_management',
        'professional_services',
        'room_rental',
        'facturacion_b2b',
        'backup_export',
        'api_access',
        'white_label'
      ],
      activo: true,
      }
    });
  } else {
    planEmpresa = await prisma.subscriptionPlan.create({
      data: {
        tier: 'empresarial',
        nombre: 'Empresa',
        descripcion: 'Solución completa para empresas consolidadas. White Label + Integraciones ERP + SLA 99.9%. Máx. 25 usuarios, 250 propiedades.',
        precioMensual: 329,
        maxUsuarios: 25,
        maxPropiedades: 250,
      modulosIncluidos: [
        'gestion_edificios',
        'gestion_unidades',
        'gestion_inquilinos',
        'gestion_contratos',
        'gestion_pagos',
        'mantenimiento',
        'calendario',
        'chat_inquilinos',
        'documentos',
        'portal_inquilino',
        'notificaciones',
        'mantenimiento_preventivo',
        'candidatos_screening',
        'firma_digital',
        'facturacion_avanzada',
        'contabilidad',
        'analytics',
        'bi_reportes',
        'gastos',
        'proveedores',
        'ordenes_trabajo',
        'crm',
        'portal_propietario',
        'galerias_fotos',
        'valoraciones',
        'publicaciones',
        'sms',
        'reservas_espacios',
        'seguros',
        'certificaciones',
        'mantenimiento_pro',
        'ai_asistente',
        'ocr',
        'blockchain',
        'open_banking',
        'iot_smart_buildings',
        'energia',
        'esg',
        'marketplace_servicios',
        'ar_vr_tours',
        'pricing_dinamico',
        'economia_circular',
        'comunidad_social',
        'seguridad_compliance',
        'integraciones_contables',
        'str_alquileres',
        'flipping_properties',
        'construction_management',
        'professional_services',
        'room_rental',
        'facturacion_b2b',
        'backup_export',
        'api_access',
        'white_label'
      ],
      activo: true,
      }
    });
  }

  console.log('✓ Plan Empresa creado:', planEmpresa.nombre, '-', planEmpresa.precioMensual, '€/mes');

  // Plan Enterprise - €599/mes
  let planEnterprise = await prisma.subscriptionPlan.findFirst({
    where: { tier: 'personalizado' }
  });

  if (planEnterprise) {
    planEnterprise = await prisma.subscriptionPlan.update({
      where: { id: planEnterprise.id },
      data: {
      nombre: 'Enterprise',
      descripcion: 'Solución enterprise para grandes corporaciones. Todos los módulos + desarrollos custom + Multi-región + SLA 99.95% + Soporte 24/7. Máx. 50 usuarios, 500 propiedades.',
      precioMensual: 599,
      maxUsuarios: 50,
      maxPropiedades: 500,
      modulosIncluidos: [
        // Todos los módulos
        'gestion_edificios',
        'gestion_unidades',
        'gestion_inquilinos',
        'gestion_contratos',
        'gestion_pagos',
        'mantenimiento',
        'calendario',
        'chat_inquilinos',
        'documentos',
        'portal_inquilino',
        'notificaciones',
        'mantenimiento_preventivo',
        'candidatos_screening',
        'firma_digital',
        'facturacion_avanzada',
        'contabilidad',
        'analytics',
        'bi_reportes',
        'gastos',
        'proveedores',
        'ordenes_trabajo',
        'crm',
        'portal_propietario',
        'galerias_fotos',
        'valoraciones',
        'publicaciones',
        'sms',
        'reservas_espacios',
        'seguros',
        'certificaciones',
        'mantenimiento_pro',
        'ai_asistente',
        'ocr',
        'blockchain',
        'open_banking',
        'iot_smart_buildings',
        'energia',
        'esg',
        'marketplace_servicios',
        'ar_vr_tours',
        'pricing_dinamico',
        'economia_circular',
        'comunidad_social',
        'seguridad_compliance',
        'integraciones_contables',
        'str_alquileres',
        'flipping_properties',
        'construction_management',
        'professional_services',
        'room_rental',
        'facturacion_b2b',
        'backup_export',
        'api_access',
        'white_label'
      ],
      activo: true,
      }
    });
  } else {
    planEnterprise = await prisma.subscriptionPlan.create({
      data: {
        tier: 'personalizado',
        nombre: 'Enterprise',
        descripcion: 'Solución enterprise para grandes corporaciones. Todos los módulos + desarrollos custom + Multi-región + SLA 99.95% + Soporte 24/7. Máx. 50 usuarios, 500 propiedades.',
        precioMensual: 599,
        maxUsuarios: 50,
        maxPropiedades: 500,
      modulosIncluidos: [
        'gestion_edificios',
        'gestion_unidades',
        'gestion_inquilinos',
        'gestion_contratos',
        'gestion_pagos',
        'mantenimiento',
        'calendario',
        'chat_inquilinos',
        'documentos',
        'portal_inquilino',
        'notificaciones',
        'mantenimiento_preventivo',
        'candidatos_screening',
        'firma_digital',
        'facturacion_avanzada',
        'contabilidad',
        'analytics',
        'bi_reportes',
        'gastos',
        'proveedores',
        'ordenes_trabajo',
        'crm',
        'portal_propietario',
        'galerias_fotos',
        'valoraciones',
        'publicaciones',
        'sms',
        'reservas_espacios',
        'seguros',
        'certificaciones',
        'mantenimiento_pro',
        'ai_asistente',
        'ocr',
        'blockchain',
        'open_banking',
        'iot_smart_buildings',
        'energia',
        'esg',
        'marketplace_servicios',
        'ar_vr_tours',
        'pricing_dinamico',
        'economia_circular',
        'comunidad_social',
        'seguridad_compliance',
        'integraciones_contables',
        'str_alquileres',
        'flipping_properties',
        'construction_management',
        'professional_services',
        'room_rental',
        'facturacion_b2b',
        'backup_export',
        'api_access',
        'white_label'
      ],
      activo: true,
      }
    });
  }

  console.log('✓ Plan Enterprise creado:', planEnterprise.nombre, '-', planEnterprise.precioMensual, '€/mes');

  console.log('\n✅ Todos los planes de suscripción han sido creados correctamente.');
  console.log('\nResumen:');
  console.log(`- ${planStarter.nombre}: ${planStarter.precioMensual}€/mes (${planStarter.maxUsuarios} usuarios, ${planStarter.maxPropiedades} propiedades)`);
  console.log(`- ${planProfesional.nombre}: ${planProfesional.precioMensual}€/mes (${planProfesional.maxUsuarios} usuarios, ${planProfesional.maxPropiedades} propiedades)`);
  console.log(`- ${planEmpresa.nombre}: ${planEmpresa.precioMensual}€/mes (${planEmpresa.maxUsuarios} usuarios, ${planEmpresa.maxPropiedades} propiedades)`);
  console.log(`- ${planEnterprise.nombre}: ${planEnterprise.precioMensual}€/mes (${planEnterprise.maxUsuarios} usuarios, ${planEnterprise.maxPropiedades} propiedades)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error al crear planes de suscripción:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
