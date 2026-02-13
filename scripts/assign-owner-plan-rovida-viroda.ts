/**
 * Script: Asignar plan Owner (gratuito, todos los módulos) a Rovida y Viroda
 * 
 * Uso: npx tsx scripts/assign-owner-plan-rovida-viroda.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_MODULES = [
  'edificios', 'inquilinos', 'contratos', 'pagos', 'gastos',
  'mantenimiento', 'documentos', 'proveedores', 'calendario',
  'contabilidad', 'seguros', 'valoraciones', 'matching',
  'comunidades', 'coliving', 'crm', 'analytics', 'marketplace',
  'firma_digital', 'ia', 'tours_virtuales', 'portal_inquilino',
  'portal_proveedor', 'portal_propietario', 'automatizaciones',
  'energy', 'flipping', 'media_estancia', 'turismo_alquiler',
  'chatbot', 'social_media', 'api_publica', 'white_label',
];

async function main() {
  console.log('🔍 Buscando empresas Rovida y Viroda...\n');

  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
    select: { id: true, nombre: true, subscriptionPlanId: true },
  });

  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
    select: { id: true, nombre: true, subscriptionPlanId: true },
  });

  if (!rovida) { console.error('❌ Rovida no encontrada'); process.exit(1); }
  if (!viroda) { console.error('❌ Viroda no encontrada'); process.exit(1); }

  console.log(`  Rovida: ${rovida.nombre} (${rovida.id}) - Plan actual: ${rovida.subscriptionPlanId || 'ninguno'}`);
  console.log(`  Viroda: ${viroda.nombre} (${viroda.id}) - Plan actual: ${viroda.subscriptionPlanId || 'ninguno'}`);

  // Buscar o crear plan Owner
  console.log('\n🔍 Buscando plan Owner...');
  let ownerPlan = await prisma.subscriptionPlan.findFirst({
    where: { nombre: { contains: 'Owner', mode: 'insensitive' } },
  });

  if (!ownerPlan) {
    console.log('📝 Creando plan Owner...');
    ownerPlan = await prisma.subscriptionPlan.create({
      data: {
        nombre: 'Owner',
        tier: 'ENTERPRISE',
        descripcion: 'Plan especial para propietarios de la plataforma. Acceso completo a todos los módulos sin coste.',
        precioMensual: 0,
        maxUsuarios: 999,
        maxPropiedades: 9999,
        modulosIncluidos: ALL_MODULES,
        signaturesIncludedMonth: 1000,
        extraSignaturePrice: 0,
        storageIncludedGB: 100,
        extraStorageGBPrice: 0,
        aiTokensIncludedMonth: 1000000,
        extraAITokensPrice: 0,
        smsIncludedMonth: 1000,
        extraSMSPrice: 0,
        activo: true,
        esInterno: true,
      },
    });
    console.log(`  ✅ Plan Owner creado: ${ownerPlan.id}`);
  } else {
    // Actualizar plan existente para asegurar todos los módulos y precio 0
    ownerPlan = await prisma.subscriptionPlan.update({
      where: { id: ownerPlan.id },
      data: {
        precioMensual: 0,
        maxUsuarios: 999,
        maxPropiedades: 9999,
        modulosIncluidos: ALL_MODULES,
        signaturesIncludedMonth: 1000,
        storageIncludedGB: 100,
        aiTokensIncludedMonth: 1000000,
        smsIncludedMonth: 1000,
        esInterno: true,
        activo: true,
      },
    });
    console.log(`  ✅ Plan Owner existente actualizado: ${ownerPlan.id}`);
  }

  // Asignar plan a Rovida
  console.log('\n📋 Asignando plan Owner a Rovida...');
  await prisma.company.update({
    where: { id: rovida.id },
    data: { subscriptionPlanId: ownerPlan.id },
  });
  console.log(`  ✅ Rovida → Plan Owner`);

  // Asignar plan a Viroda
  console.log('📋 Asignando plan Owner a Viroda...');
  await prisma.company.update({
    where: { id: viroda.id },
    data: { subscriptionPlanId: ownerPlan.id },
  });
  console.log(`  ✅ Viroda → Plan Owner`);

  // Verificación
  console.log('\n✅ VERIFICACIÓN:');
  const updated = await prisma.company.findMany({
    where: { id: { in: [rovida.id, viroda.id] } },
    select: {
      nombre: true,
      subscriptionPlan: {
        select: { nombre: true, tier: true, precioMensual: true },
      },
    },
  });

  for (const c of updated) {
    console.log(`  ${c.nombre}: Plan ${c.subscriptionPlan?.nombre} (${c.subscriptionPlan?.tier}) - ${c.subscriptionPlan?.precioMensual}€/mes`);
  }

  console.log('\n✅ Completado.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
