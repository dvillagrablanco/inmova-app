/**
 * 📊 Script para registrar actividades de email en el CRM
 * 
 * Este script registra las 4 actividades de email enviadas a los leads
 * de alta prioridad.
 * 
 * Uso:
 *   npx tsx scripts/register-crm-activities.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Registrando actividades de email en el CRM...\n');

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
    console.error('❌ No se encontró la empresa INMOVA.');
    process.exit(1);
  }

  // Obtener el primer usuario admin
  const admin = await prisma.user.findFirst({
    where: {
      companyId: company.id,
      role: { in: ['super_admin', 'administrador'] },
    },
  });

  if (!admin) {
    console.error('❌ No se encontró un usuario administrador.');
    process.exit(1);
  }

  console.log(`✅ Empresa: ${company.nombre}`);
  console.log(`✅ Usuario: ${admin.nombre || admin.email}\n`);

  // Definir los leads y sus emails
  const leadsToContact = [
    {
      email: 'carlos.rodriguez@gestionbcn.es',
      name: 'Carlos Rodríguez',
      subject: 'Email inicial - Automatización para 100+ propiedades',
      description: 'Email de presentación enfocado en automatización de gestión inmobiliaria para su portfolio de 100+ propiedades en Barcelona.',
    },
    {
      email: 'jorge.lopez@vacationmalaga.es',
      name: 'Jorge López',
      subject: 'Email inicial - Channel Manager + Pricing Dinámico STR',
      description: 'Email de presentación enfocado en channel manager y pricing engine para sus 150+ propiedades vacacionales en Costa del Sol.',
    },
    {
      email: 'elena.torres@proptechinnovations.es',
      name: 'Elena Torres',
      subject: 'Email inicial - Partnership Proptech',
      description: 'Email de presentación enfocado en posibles sinergias y colaboración entre PropTech Innovations e INMOVA (APIs, white label, co-desarrollo).',
    },
    {
      email: 'miguel.ruiz@smartbuildings.tech',
      name: 'Miguel Ruiz',
      subject: 'Email inicial - APIs para integración IoT',
      description: 'Email técnico enfocado en integración de APIs de gestión inmobiliaria con sus sensores IoT para Smart Buildings.',
    },
  ];

  let registered = 0;

  for (const leadInfo of leadsToContact) {
    try {
      // Buscar el lead por email
      const lead = await prisma.cRMLead.findFirst({
        where: {
          companyId: company.id,
          email: leadInfo.email,
        },
      });

      if (!lead) {
        console.log(`⏭️  SKIP: ${leadInfo.name} (${leadInfo.email}) - Lead no encontrado en CRM`);
        continue;
      }

      // Registrar actividad de email
      const activity = await prisma.cRMActivity.create({
        data: {
          companyId: company.id,
          leadId: lead.id,
          type: 'email',
          subject: leadInfo.subject,
          description: leadInfo.description,
          outcome: 'sent',
          performedBy: admin.id,
          activityDate: new Date(),
          metadata: {
            emailTo: leadInfo.email,
            emailFrom: admin.email,
            campaignType: 'cold_outreach',
            priority: 'high',
          },
        },
      });

      // Actualizar métricas del lead
      await prisma.cRMLead.update({
        where: { id: lead.id },
        data: {
          emailsSent: { increment: 1 },
          lastContactDate: new Date(),
          status: 'contacted',
        },
      });

      // Crear tarea de follow-up para 48 horas después
      const followUpDate = new Date();
      followUpDate.setHours(followUpDate.getHours() + 48);

      await prisma.cRMTask.create({
        data: {
          companyId: company.id,
          leadId: lead.id,
          title: `Follow-up: ${leadInfo.name}`,
          description: `Follow-up telefónico si no responde al email de ${new Date().toLocaleDateString('es-ES')}`,
          type: 'call',
          priority: 'high',
          dueDate: followUpDate,
          assignedTo: admin.id,
        },
      });

      console.log(`✅ REGISTRADO: ${leadInfo.name}`);
      console.log(`   📧 Email: ${leadInfo.email}`);
      console.log(`   📊 Actividad creada: ${activity.id}`);
      console.log(`   📅 Follow-up programado: ${followUpDate.toLocaleString('es-ES')}`);
      console.log('');

      registered++;
    } catch (error: any) {
      console.error(`❌ ERROR: ${leadInfo.name} - ${error.message}`);
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE REGISTRO DE ACTIVIDADES\n');
  console.log(`✅ Actividades registradas: ${registered}`);
  console.log(`📧 Emails enviados: ${registered}`);
  console.log(`📅 Follow-ups programados: ${registered}`);
  console.log(`👤 Usuario: ${admin.nombre || admin.email}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (registered > 0) {
    console.log('🎉 ¡Actividades registradas exitosamente en el CRM!');
    console.log('🔔 Recordatorio: Revisa el CRM en 48h para hacer follow-up.\n');
  }
}

main()
  .catch((error) => {
    console.error('❌ Error durante el registro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
