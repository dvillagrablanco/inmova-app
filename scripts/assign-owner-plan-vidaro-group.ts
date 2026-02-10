/**
 * Script: Asignar Plan Owner a Rovida, Viroda y Vidaro
 *
 * Este script:
 * 1. Crea o encuentra el plan Owner (interno, gratuito, ENTERPRISE)
 * 2. Asigna el plan Owner a las 3 sociedades del grupo Vidaro
 * 3. Activa TODOS los módulos para las 3 sociedades
 * 4. Actualiza los límites de usuarios y propiedades (ilimitados)
 *
 * Ejecutar: npx tsx scripts/assign-owner-plan-vidaro-group.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Todos los módulos disponibles en la plataforma
const ALL_MODULES = [
  // Core
  'dashboard',
  'edificios',
  'unidades',
  'inquilinos',
  'contratos',
  'pagos',
  'mantenimiento',
  'chat',
  'calendario',
  'seguros',
  // Gestión
  'documentos',
  'proveedores',
  'gastos',
  // Financiero
  'reportes',
  'contabilidad',
  'analytics',
  'bi',
  // Comunicación
  'notificaciones',
  'sms',
  // Avanzado
  'crm',
  'legal',
  'marketplace',
  'mantenimiento_pro',
  'valoraciones',
  'publicaciones',
  'screening',
  'energia',
  'esg',
  'tours_virtuales',
  'pricing_dinamico',
  'iot',
  'blockchain',
  'ai_assistant',
  'economia_circular',
  'comunidad_social',
  'seguridad_compliance',
  // Comunidad
  'incidencias',
  'votaciones',
  'anuncios',
  'reuniones',
  'reservas',
  'galerias',
  // Portales
  'portal_inquilino',
  'portal_propietario',
  'portal_proveedor',
  // Admin
  'usuarios',
  'configuracion',
  'auditoria',
  // Multi-vertical
  'str_listings',
  'str_bookings',
  'str_channels',
  'flipping_projects',
  'construction_projects',
  'professional_projects',
  'room_rental',
  'alquiler_comercial',
  // Extras
  'ocr',
  'firma_digital',
  'open_banking',
  'tareas',
  'candidatos',
  'inspecciones',
  'visitas',
  'ordenes_trabajo',
  'certificaciones',
];

async function main() {
  console.log('====================================================================');
  console.log('  ASIGNAR PLAN OWNER - GRUPO VIDARO (Rovida, Viroda, Vidaro)');
  console.log('====================================================================\n');

  // ══════════════════════════════════════════════════════════════
  // PASO 1: Crear o encontrar el Plan Owner
  // ══════════════════════════════════════════════════════════════
  console.log('1. Buscando/creando Plan Owner...\n');

  let ownerPlan = await prisma.subscriptionPlan.findFirst({
    where: { nombre: 'Owner' },
  });

  const ownerPlanData = {
    nombre: 'Owner',
    descripcion:
      'Plan interno gratuito para empresas del propietario de la plataforma. Incluye todas las funcionalidades sin límites.',
    tier: 'ENTERPRISE' as const,
    precioMensual: 0,
    maxUsuarios: 999,
    maxPropiedades: 9999,
    modulosIncluidos: ALL_MODULES,
    activo: true,
    esInterno: true,
    signaturesIncludedMonth: 9999,
    storageIncludedGB: 1000,
    aiTokensIncludedMonth: 10000000,
    smsIncludedMonth: 10000,
    extraSignaturePrice: 0,
    extraStorageGBPrice: 0,
    extraAITokensPrice: 0,
    extraSMSPrice: 0,
  };

  if (ownerPlan) {
    ownerPlan = await prisma.subscriptionPlan.update({
      where: { id: ownerPlan.id },
      data: ownerPlanData,
    });
    console.log(`   Plan Owner actualizado (ID: ${ownerPlan.id})`);
  } else {
    ownerPlan = await prisma.subscriptionPlan.create({
      data: ownerPlanData,
    });
    console.log(`   Plan Owner creado (ID: ${ownerPlan.id})`);
  }

  console.log(`   - Tier: ${ownerPlan.tier}`);
  console.log(`   - Precio: ${ownerPlan.precioMensual}€/mes (gratuito)`);
  console.log(`   - Interno: ${ownerPlan.esInterno ? 'Sí' : 'No'}`);
  console.log(`   - Max usuarios: ${ownerPlan.maxUsuarios}`);
  console.log(`   - Max propiedades: ${ownerPlan.maxPropiedades}`);
  console.log(`   - Módulos incluidos: ${ALL_MODULES.length}`);

  // ══════════════════════════════════════════════════════════════
  // PASO 2: Buscar las 3 sociedades
  // ══════════════════════════════════════════════════════════════
  console.log('\n2. Buscando sociedades del grupo Vidaro...\n');

  const sociedades = [
    {
      label: 'Vidaro Inversiones S.L.',
      search: [
        { id: 'vidaro-inversiones' },
        { nombre: { contains: 'Vidaro', mode: 'insensitive' as const } },
      ],
    },
    {
      label: 'Rovida S.L.',
      search: [
        { id: 'rovida-sl' },
        { id: 'rovida-gestion' },
        { nombre: { contains: 'Rovida', mode: 'insensitive' as const } },
      ],
    },
    {
      label: 'Viroda Inversiones S.L.U.',
      search: [
        { id: 'viroda-inversiones' },
        { nombre: { contains: 'Viroda', mode: 'insensitive' as const } },
      ],
    },
  ];

  const companies: Array<{ id: string; nombre: string; label: string }> = [];

  for (const soc of sociedades) {
    const company = await prisma.company.findFirst({
      where: { OR: soc.search },
      select: {
        id: true,
        nombre: true,
        subscriptionPlanId: true,
        maxUsuarios: true,
        maxPropiedades: true,
      },
    });

    if (!company) {
      console.log(`   ⚠️  ${soc.label} NO encontrada. Omitiendo.`);
      continue;
    }

    companies.push({ id: company.id, nombre: company.nombre, label: soc.label });
    console.log(`   Encontrada: ${company.nombre} (ID: ${company.id})`);
    console.log(`     Plan actual: ${company.subscriptionPlanId || 'ninguno'}`);
  }

  if (companies.length === 0) {
    console.log('\n   No se encontraron sociedades. Abortando.');
    await prisma.$disconnect();
    return;
  }

  // ══════════════════════════════════════════════════════════════
  // PASO 3: Asignar Plan Owner a cada sociedad
  // ══════════════════════════════════════════════════════════════
  console.log('\n3. Asignando Plan Owner a las sociedades...\n');

  for (const company of companies) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionPlanId: ownerPlan.id,
        maxUsuarios: 999,
        maxPropiedades: 9999,
        maxEdificios: 9999,
      },
    });
    console.log(`   ${company.nombre} → Plan Owner asignado`);
  }

  // ══════════════════════════════════════════════════════════════
  // PASO 4: Activar TODOS los módulos para cada sociedad
  // ══════════════════════════════════════════════════════════════
  console.log('\n4. Activando TODOS los módulos...\n');

  for (const company of companies) {
    let activatedCount = 0;
    let updatedCount = 0;

    for (const moduloCodigo of ALL_MODULES) {
      const existing = await prisma.companyModule.findUnique({
        where: {
          companyId_moduloCodigo: {
            companyId: company.id,
            moduloCodigo,
          },
        },
      });

      if (existing) {
        if (!existing.activo) {
          await prisma.companyModule.update({
            where: { id: existing.id },
            data: { activo: true, updatedAt: new Date() },
          });
          updatedCount++;
        }
      } else {
        await prisma.companyModule.create({
          data: {
            companyId: company.id,
            moduloCodigo,
            activo: true,
            activadoPor: 'system-owner-plan',
          },
        });
        activatedCount++;
      }
    }

    console.log(`   ${company.nombre}:`);
    console.log(`     - ${activatedCount} módulos nuevos activados`);
    console.log(`     - ${updatedCount} módulos reactivados`);
    console.log(`     - Total: ${ALL_MODULES.length} módulos activos`);
  }

  // ══════════════════════════════════════════════════════════════
  // PASO 5: Verificación final
  // ══════════════════════════════════════════════════════════════
  console.log('\n5. Verificación final...\n');

  for (const company of companies) {
    const updated = await prisma.company.findUnique({
      where: { id: company.id },
      select: {
        id: true,
        nombre: true,
        subscriptionPlanId: true,
        maxUsuarios: true,
        maxPropiedades: true,
        maxEdificios: true,
        subscriptionPlan: {
          select: { nombre: true, tier: true, precioMensual: true, esInterno: true },
        },
      },
    });

    const moduleCount = await prisma.companyModule.count({
      where: { companyId: company.id, activo: true },
    });

    console.log(`   ${updated?.nombre}`);
    console.log(
      `     Plan: ${updated?.subscriptionPlan?.nombre} (${updated?.subscriptionPlan?.tier})`
    );
    console.log(`     Precio: ${updated?.subscriptionPlan?.precioMensual}€/mes`);
    console.log(`     Interno: ${updated?.subscriptionPlan?.esInterno ? 'Sí' : 'No'}`);
    console.log(`     Max usuarios: ${updated?.maxUsuarios}`);
    console.log(`     Max propiedades: ${updated?.maxPropiedades}`);
    console.log(`     Max edificios: ${updated?.maxEdificios}`);
    console.log(`     Módulos activos: ${moduleCount}`);
    console.log('');
  }

  console.log('====================================================================');
  console.log('  RESULTADO');
  console.log('====================================================================');
  console.log('');
  for (const company of companies) {
    console.log(`  ✅ ${company.nombre} → Plan Owner (todos los módulos)`);
  }
  console.log('');
  console.log('  Plan Owner:');
  console.log('    - Gratuito (0€/mes)');
  console.log('    - Interno (no visible en landing)');
  console.log('    - Tier ENTERPRISE (acceso completo)');
  console.log(`    - ${ALL_MODULES.length} módulos activos`);
  console.log('    - Sin límites de usuarios, propiedades ni edificios');
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
