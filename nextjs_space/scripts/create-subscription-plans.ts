import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('Creando planes de suscripción...');

  // Plan Profesional - €149/mes
  let planProfesional = await prisma.subscriptionPlan.findFirst({
    where: { tier: 'profesional' }
  });

  if (planProfesional) {
    planProfesional = await prisma.subscriptionPlan.update({
      where: { id: planProfesional.id },
      data: {
      nombre: 'Profesional',
      descripcion: 'Plan ideal para gestores y pequeñas empresas inmobiliarias. Incluye funcionalidades esenciales para una gestión profesional. Máx. 5 usuarios, 50 propiedades.',
      precioMensual: 149,
      maxUsuarios: 5,
      maxPropiedades: 50,
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
    planProfesional = await prisma.subscriptionPlan.create({
      data: {
        tier: 'profesional',
        nombre: 'Profesional',
        descripcion: 'Plan ideal para gestores y pequeñas empresas inmobiliarias. Incluye funcionalidades esenciales para una gestión profesional. Máx. 5 usuarios, 50 propiedades.',
        precioMensual: 149,
        maxUsuarios: 5,
        maxPropiedades: 50,
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

  console.log('✓ Plan Profesional creado:', planProfesional.nombre, '-', planProfesional.precioMensual, '€/mes');

  // Plan Empresa - €349/mes
  let planEmpresa = await prisma.subscriptionPlan.findFirst({
    where: { tier: 'empresarial' }
  });

  if (planEmpresa) {
    planEmpresa = await prisma.subscriptionPlan.update({
      where: { id: planEmpresa.id },
      data: {
      nombre: 'Empresa',
      descripcion: 'Solución completa para empresas inmobiliarias en crecimiento. Incluye módulos avanzados y mayor capacidad. Máx. 15 usuarios, 200 propiedades.',
      precioMensual: 349,
      maxUsuarios: 15,
      maxPropiedades: 200,
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
    planEmpresa = await prisma.subscriptionPlan.create({
      data: {
        tier: 'empresarial',
        nombre: 'Empresa',
        descripcion: 'Solución completa para empresas inmobiliarias en crecimiento. Incluye módulos avanzados y mayor capacidad. Máx. 15 usuarios, 200 propiedades.',
        precioMensual: 349,
        maxUsuarios: 15,
        maxPropiedades: 200,
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

  console.log('✓ Plan Empresa creado:', planEmpresa.nombre, '-', planEmpresa.precioMensual, '€/mes');

  // Plan Enterprise - €899/mes
  let planEnterprise = await prisma.subscriptionPlan.findFirst({
    where: { tier: 'personalizado' }
  });

  if (planEnterprise) {
    planEnterprise = await prisma.subscriptionPlan.update({
      where: { id: planEnterprise.id },
      data: {
      nombre: 'Enterprise',
      descripcion: 'Solución enterprise para grandes corporaciones. Incluye todos los módulos, integraciones avanzadas y soporte dedicado. Usuarios y propiedades ilimitados.',
      precioMensual: 899,
      maxUsuarios: 999999,
      maxPropiedades: 999999,
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
    planEnterprise = await prisma.subscriptionPlan.create({
      data: {
        tier: 'personalizado',
        nombre: 'Enterprise',
        descripcion: 'Solución enterprise para grandes corporaciones. Incluye todos los módulos, integraciones avanzadas y soporte dedicado. Usuarios y propiedades ilimitados.',
        precioMensual: 899,
        maxUsuarios: 999999,
        maxPropiedades: 999999,
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
  console.log(`- ${planProfesional.nombre}: ${planProfesional.precioMensual}€/mes (${planProfesional.maxUsuarios} usuarios, ${planProfesional.maxPropiedades} propiedades)`);
  console.log(`- ${planEmpresa.nombre}: ${planEmpresa.precioMensual}€/mes (${planEmpresa.maxUsuarios} usuarios, ${planEmpresa.maxPropiedades} propiedades)`);
  console.log(`- ${planEnterprise.nombre}: ${planEnterprise.precioMensual}€/mes (usuarios y propiedades ilimitados)`);
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
