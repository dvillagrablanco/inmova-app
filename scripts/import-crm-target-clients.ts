/**
 * 📊 Script de Importación de Clientes Objetivo del CRM
 * 
 * Este script importa automáticamente los 8 clientes objetivo predefinidos
 * de INMOVA en el CRM.
 * 
 * Uso:
 *   npx tsx scripts/import-crm-target-clients.ts
 * 
 * O via API:
 *   POST /api/crm/import
 *   Body: { source: 'target_clients' }
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando importación de clientes objetivo del CRM...\n');

  // Obtener la primera empresa (INMOVA)
  const company = await prisma.company.findFirst({
    where: {
      OR: [
        { nombre: { contains: 'INMOVA', mode: 'insensitive' } },
        { nombre: { contains: 'inmova', mode: 'insensitive' } },
      ],
    },
  });

  if (!company) {
    console.error('❌ No se encontró la empresa INMOVA en la base de datos.');
    console.log('💡 Tip: Ejecuta este script después de crear al menos una empresa.');
    process.exit(1);
  }

  console.log(`✅ Empresa encontrada: ${company.nombre} (${company.id})\n`);

  // Definir clientes objetivo
  const targetLeads = [
    {
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@madridpropiedades.es',
      phone: '+34 911 234 567',
      jobTitle: 'Property Manager',
      companyName: 'Madrid Propiedades SL',
      companySize: 'small' as const,
      industry: 'Real Estate',
      city: 'Madrid',
      region: 'Comunidad de Madrid',
      country: 'ES',
      source: 'website' as const,
      notes: 'Gestiona +50 propiedades en Madrid. Interesada en automatización de gestión de alquileres.',
      tags: ['property_manager', 'madrid', 'target', 'inmova_initial_batch'],
    },
    {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@gestionbcn.es',
      phone: '+34 933 456 789',
      jobTitle: 'Director de Operaciones',
      companyName: 'Gestión Inmobiliaria Barcelona',
      companySize: 'medium' as const,
      industry: 'Real Estate',
      city: 'Barcelona',
      region: 'Cataluña',
      country: 'ES',
      source: 'website' as const,
      notes: 'Empresa con 100+ propiedades. Buscan solución integral de gestión.',
      tags: ['operations', 'barcelona', 'target', 'inmova_initial_batch'],
    },
    {
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@adminabc.es',
      phone: '+34 963 789 012',
      jobTitle: 'Administradora de Fincas',
      companyName: 'Administraciones ABC',
      companySize: 'small' as const,
      industry: 'Property Management',
      city: 'Valencia',
      region: 'Comunidad Valenciana',
      country: 'ES',
      source: 'website' as const,
      notes: 'Administra 80 comunidades. Interesada en digitalizar procesos.',
      tags: ['admin_fincas', 'valencia', 'target', 'inmova_initial_batch'],
    },
    {
      firstName: 'Jorge',
      lastName: 'López',
      email: 'jorge.lopez@vacationmalaga.es',
      phone: '+34 952 345 678',
      jobTitle: 'Revenue Manager',
      companyName: 'Vacation Rentals Costa del Sol',
      companySize: 'medium' as const,
      industry: 'Vacation Rentals',
      city: 'Málaga',
      region: 'Andalucía',
      country: 'ES',
      source: 'referral' as const,
      notes: 'Gestiona pricing de 150+ propiedades vacacionales. Alto interés en channel manager.',
      tags: ['revenue_manager', 'malaga', 'str', 'target', 'inmova_initial_batch'],
    },
    {
      firstName: 'Laura',
      lastName: 'Fernández',
      email: 'laura.fernandez@airbnbsevilla.es',
      phone: '+34 954 567 890',
      jobTitle: 'Channel Manager',
      companyName: 'Airbnb Properties Management',
      companySize: 'small' as const,
      industry: 'Vacation Rentals',
      city: 'Sevilla',
      region: 'Andalucía',
      country: 'ES',
      source: 'linkedin' as const,
      linkedInUrl: 'https://www.linkedin.com/in/laurafernandez',
      notes: 'Gestiona listados en Airbnb, Booking, Vrbo. Necesita integración multi-plataforma.',
      tags: ['channel_manager', 'sevilla', 'str', 'target', 'inmova_initial_batch'],
    },
    {
      firstName: 'David',
      lastName: 'Sánchez',
      email: 'david.sanchez@urbancoliving.es',
      phone: '+34 911 678 901',
      jobTitle: 'Community Manager',
      companyName: 'Urban Coliving Madrid',
      companySize: 'small' as const,
      industry: 'Coliving',
      city: 'Madrid',
      region: 'Comunidad de Madrid',
      country: 'ES',
      source: 'event' as const,
      notes: '3 espacios coliving con 120 residentes. Interesado en gestión de comunidad.',
      tags: ['coliving', 'community_manager', 'madrid', 'target', 'inmova_initial_batch'],
    },
    {
      firstName: 'Elena',
      lastName: 'Torres',
      email: 'elena.torres@proptechinnovations.es',
      phone: '+34 933 789 012',
      jobTitle: 'CEO & Founder',
      companyName: 'PropTech Innovations',
      companySize: 'micro' as const,
      industry: 'Real Estate Technology',
      city: 'Barcelona',
      region: 'Cataluña',
      country: 'ES',
      source: 'partner' as const,
      linkedInUrl: 'https://www.linkedin.com/in/elenatorres',
      notes: 'Startup proptech buscando partners tecnológicos. Potencial colaboración.',
      tags: ['founder', 'proptech', 'barcelona', 'innovator', 'target', 'inmova_initial_batch'],
    },
    {
      firstName: 'Miguel',
      lastName: 'Ruiz',
      email: 'miguel.ruiz@smartbuildings.tech',
      phone: '+34 911 890 123',
      jobTitle: 'Co-founder & CTO',
      companyName: 'Smart Buildings Tech',
      companySize: 'micro' as const,
      industry: 'Real Estate Technology',
      city: 'Madrid',
      region: 'Comunidad de Madrid',
      country: 'ES',
      source: 'partner' as const,
      linkedInUrl: 'https://www.linkedin.com/in/miguelruiz',
      notes: 'CTO de startup IoT para edificios. Interés en integración de sensores.',
      tags: ['founder', 'proptech', 'tech', 'madrid', 'target', 'inmova_initial_batch'],
    },
  ];

  console.log(`📊 Importando ${targetLeads.length} clientes objetivo...\n`);

  let imported = 0;
  let skipped = 0;

  for (const leadData of targetLeads) {
    try {
      // Verificar si ya existe
      const existing = await prisma.cRMLead.findFirst({
        where: {
          companyId: company.id,
          email: leadData.email,
        },
      });

      if (existing) {
        console.log(`⏭️  SKIP: ${leadData.firstName} ${leadData.lastName} (${leadData.email}) - Ya existe`);
        skipped++;
        continue;
      }

      // Calcular score inicial
      let score = 0;
      
      // Datos de empresa
      if (leadData.companySize) score += 15;
      if (leadData.industry) score += 5;
      
      // Datos de contacto
      if (leadData.phone) score += 5;
      if (leadData.jobTitle) score += 5;
      
      // Authority (basado en job title)
      const authorityTitles = ['director', 'ceo', 'founder', 'manager'];
      if (authorityTitles.some(title => leadData.jobTitle?.toLowerCase().includes(title))) {
        score += 20;
      }

      // Crear lead
      const lead = await prisma.cRMLead.create({
        data: {
          companyId: company.id,
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          email: leadData.email,
          phone: leadData.phone,
          jobTitle: leadData.jobTitle,
          companyName: leadData.companyName,
          companySize: leadData.companySize,
          industry: leadData.industry,
          city: leadData.city,
          region: leadData.region,
          country: leadData.country,
          source: leadData.source,
          status: 'new',
          priority: 'high',
          score,
          notes: leadData.notes,
          tags: leadData.tags,
          linkedInUrl: leadData.linkedInUrl,
        },
      });

      console.log(`✅ IMPORTADO: ${lead.firstName} ${lead.lastName} (${lead.email}) - Score: ${score}`);
      imported++;
    } catch (error: any) {
      console.error(`❌ ERROR: ${leadData.firstName} ${leadData.lastName} - ${error.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE IMPORTACIÓN');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Importados: ${imported}`);
  console.log(`⏭️  Omitidos (duplicados): ${skipped}`);
  console.log(`📁 Total procesados: ${targetLeads.length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (imported > 0) {
    console.log('🎉 ¡Clientes objetivo importados exitosamente!');
    console.log('🚀 Accede a https://inmova.app/dashboard/crm para verlos.\n');
  }
}

main()
  .catch((error) => {
    console.error('❌ Error durante la importación:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
