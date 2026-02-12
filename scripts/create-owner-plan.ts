/**
 * Script para crear el Plan Owner (Gratuito, Interno)
 * Este plan es solo para empresas del dueño de la plataforma
 * No aparece en landing ni es seleccionable por usuarios externos
 *
 * Ejecutar: npx tsx scripts/create-owner-plan.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OWNER_PLAN = {
  nombre: 'Owner',
  descripcion:
    'Plan interno gratuito para empresas del propietario de la plataforma. Incluye todas las funcionalidades sin límites.',
  tier: 'ENTERPRISE' as const, // Tier ENTERPRISE da acceso a TODOS los módulos
  precioMensual: 0,
  maxUsuarios: 999, // Sin límite práctico
  maxPropiedades: 9999, // Sin límite práctico
  modulosIncluidos: [
    'Dashboard completo',
    'Gestión de propiedades',
    'Gestión de inquilinos',
    'Contratos digitales',
    'CRM con pipeline',
    'Automatizaciones',
    'Informes avanzados',
    'Portal inquilinos',
    'Integraciones completas',
    'Firma digital ilimitada',
    'API access completo',
    'Multi-empresa',
    'Workflows personalizados',
    'White-label',
    'Soporte prioritario',
    'IA y automatización',
    'Todos los módulos',
  ],
  activo: true,
  esInterno: true, // ← CRÍTICO: Marcado como interno (no visible en landing)
  // Límites generosos (prácticamente ilimitados)
  signaturesIncludedMonth: 9999,
  storageIncludedGB: 1000,
  aiTokensIncludedMonth: 10000000,
  smsIncludedMonth: 10000,
  // Precios de excedente a 0 (no se cobran extras)
  extraSignaturePrice: 0,
  extraStorageGBPrice: 0,
  extraAITokensPrice: 0,
  extraSMSPrice: 0,
};

async function main() {
  console.log('🚀 Creando Plan Owner (Gratuito, Interno)...\n');

  try {
    // Verificar si ya existe
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { nombre: 'Owner' },
    });

    if (existing) {
      console.log('⚠️  El plan Owner ya existe. Actualizando...');

      const updated = await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: OWNER_PLAN,
      });

      console.log(`✅ Plan Owner actualizado: ${updated.id}`);
      console.log(`   - Precio: €${updated.precioMensual}/mes`);
      console.log(`   - Interno: ${updated.esInterno ? 'Sí' : 'No'}`);
      console.log(`   - Max usuarios: ${updated.maxUsuarios}`);
      console.log(`   - Max propiedades: ${updated.maxPropiedades}`);
    } else {
      const created = await prisma.subscriptionPlan.create({
        data: OWNER_PLAN,
      });

      console.log(`✅ Plan Owner creado: ${created.id}`);
      console.log(`   - Precio: €${created.precioMensual}/mes`);
      console.log(`   - Interno: ${created.esInterno ? 'Sí' : 'No'}`);
      console.log(`   - Max usuarios: ${created.maxUsuarios}`);
      console.log(`   - Max propiedades: ${created.maxPropiedades}`);
    }

    // Listar todos los planes
    console.log('\n📋 Planes de suscripción actuales:\n');
    const allPlans = await prisma.subscriptionPlan.findMany({
      where: { activo: true },
      orderBy: { precioMensual: 'asc' },
      include: {
        _count: { select: { companies: true } },
      },
    });

    allPlans.forEach((plan, i) => {
      const internalBadge = plan.esInterno ? ' [INTERNO]' : '';
      console.log(`${i + 1}. ${plan.nombre}${internalBadge}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Precio: €${plan.precioMensual}/mes`);
      console.log(`   Empresas: ${plan._count.companies}`);
      console.log('');
    });

    console.log('✅ Plan Owner listo para uso.');
    console.log('   • No aparecerá en landing ni registro público');
    console.log('   • Solo visible desde panel admin');
    console.log('   • Asignable manualmente a empresas propias');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
