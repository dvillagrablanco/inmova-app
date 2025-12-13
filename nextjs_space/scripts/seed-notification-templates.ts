import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding notification templates...');

  // Plantillas Globales de Notificación
  const templates = [
    {
      nombre: 'Recordatorio de Pago',
      categoria: 'pagos',
      asuntoEmail: 'Recordatorio: Pago Próximo a Vencer',
      mensajeEmail: `Hola {nombre_inquilino},\n\nEste es un recordatorio amistoso de que tu pago de {monto} vencerá el {fecha_vencimiento}.\n\nPor favor, asegúrate de realizar el pago antes de la fecha indicada para evitar cargos adicionales.\n\nGracias por tu atención.\n\nSaludos,\n{empresa}`,
      mensajePush: 'Tu pago de {monto} vence el {fecha_vencimiento}. ¡No olvides pagarlo!',
      mensajeSMS: 'Recordatorio: Pago de {monto} vence {fecha_vencimiento}. Realiza tu pago en {empresa}.',
      variables: ['nombre_inquilino', 'monto', 'fecha_vencimiento', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
    {
      nombre: 'Pago Vencido',
      categoria: 'pagos',
      asuntoEmail: 'Aviso Importante: Pago Vencido',
      mensajeEmail: `Estimado/a {nombre_inquilino},\n\nNos permitimos informarte que tu pago de {monto} con fecha de vencimiento {fecha_vencimiento} se encuentra vencido.\n\nTe solicitamos realizar el pago lo antes posible para regularizar tu situación y evitar intereses moratorios.\n\nSi ya realizaste el pago, por favor ignora este mensaje.\n\nAtentamente,\n{empresa}`,
      mensajePush: '¡Atención! Tu pago de {monto} está vencido desde {fecha_vencimiento}',
      mensajeSMS: 'URGENTE: Pago vencido de {monto}. Regulariza tu situación en {empresa}.',
      variables: ['nombre_inquilino', 'monto', 'fecha_vencimiento', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
    {
      nombre: 'Confirmación de Pago Recibido',
      categoria: 'pagos',
      asuntoEmail: 'Pago Recibido Exitosamente',
      mensajeEmail: `Hola {nombre_inquilino},\n\nConfirmamos que hemos recibido tu pago de {monto} correspondiente a {propiedad} - {unidad}.\n\nFecha de pago: {fecha_pago}\nMétodo de pago: {metodo_pago}\n\nGracias por tu puntualidad.\n\nSaludos,\n{empresa}`,
      mensajePush: '¡Pago recibido! Gracias por tu pago de {monto}',
      mensajeSMS: 'Confirmado: Pago de {monto} recibido. Gracias por tu puntualidad.',
      variables: ['nombre_inquilino', 'monto', 'propiedad', 'unidad', 'fecha_pago', 'metodo_pago', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
    {
      nombre: 'Contrato Próximo a Vencer',
      categoria: 'contratos',
      asuntoEmail: 'Aviso: Tu Contrato Vence Pronto',
      mensajeEmail: `Estimado/a {nombre_inquilino},\n\nTe informamos que tu contrato de arrendamiento para {propiedad} - {unidad} vencerá el {fecha_vencimiento}.\n\nSi deseas renovar tu contrato, por favor contáctanos con al menos 30 días de anticipación.\n\nQuedamos atentos a tus comentarios.\n\nSaludos,\n{empresa}`,
      mensajePush: 'Tu contrato vence el {fecha_vencimiento}. ¿Deseas renovar?',
      mensajeSMS: 'Aviso: Contrato vence {fecha_vencimiento}. Contacta {empresa} para renovar.',
      variables: ['nombre_inquilino', 'propiedad', 'unidad', 'fecha_vencimiento', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
    {
      nombre: 'Fin de Contrato',
      categoria: 'contratos',
      asuntoEmail: 'Finalización de Contrato de Arrendamiento',
      mensajeEmail: `Estimado/a {nombre_inquilino},\n\nTu contrato de arrendamiento para {propiedad} - {unidad} finaliza el {fecha_vencimiento}.\n\nPor favor, coordina la entrega de llaves y la inspección final de la propiedad.\n\nRecuerda que debes dejar la propiedad en las mismas condiciones en que la recibiste.\n\nGracias por tu confianza.\n\n{empresa}`,
      mensajePush: 'Tu contrato finaliza el {fecha_vencimiento}. Coordina la entrega.',
      mensajeSMS: 'Fin de contrato {fecha_vencimiento}. Programa entrega de llaves con {empresa}.',
      variables: ['nombre_inquilino', 'propiedad', 'unidad', 'fecha_vencimiento', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
    {
      nombre: 'Solicitud de Mantenimiento Recibida',
      categoria: 'mantenimiento',
      asuntoEmail: 'Solicitud de Mantenimiento Registrada',
      mensajeEmail: `Hola {nombre_inquilino},\n\nHemos recibido tu solicitud de mantenimiento para {propiedad} - {unidad}.\n\nDescripción: {descripcion}\nPrioridad: {prioridad}\nNúmero de ticket: {numero_ticket}\n\nNuestro equipo revisará tu solicitud y te contactará pronto.\n\nGracias por reportarlo.\n\n{empresa}`,
      mensajePush: 'Solicitud de mantenimiento #{numero_ticket} registrada',
      mensajeSMS: 'Mantenimiento solicitado. Ticket #{numero_ticket}. Te contactaremos pronto.',
      variables: ['nombre_inquilino', 'propiedad', 'unidad', 'descripcion', 'prioridad', 'numero_ticket', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
    {
      nombre: 'Mantenimiento Programado',
      categoria: 'mantenimiento',
      asuntoEmail: 'Mantenimiento Programado para tu Propiedad',
      mensajeEmail: `Estimado/a {nombre_inquilino},\n\nTe informamos que se ha programado un mantenimiento para {propiedad} - {unidad}.\n\nFecha: {fecha_mantenimiento}\nHora: {hora_mantenimiento}\nTipo: {tipo_mantenimiento}\nTécnico: {tecnico}\n\nPor favor, asegúrate de estar disponible o de coordinar el acceso.\n\nSaludos,\n{empresa}`,
      mensajePush: 'Mantenimiento programado para {fecha_mantenimiento} a las {hora_mantenimiento}',
      mensajeSMS: 'Mantenimiento {fecha_mantenimiento} {hora_mantenimiento}. Por favor confirma disponibilidad.',
      variables: ['nombre_inquilino', 'propiedad', 'unidad', 'fecha_mantenimiento', 'hora_mantenimiento', 'tipo_mantenimiento', 'tecnico', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
    {
      nombre: 'Mantenimiento Urgente',
      categoria: 'mantenimiento',
      asuntoEmail: 'URGENTE: Mantenimiento de Emergencia',
      mensajeEmail: `Estimado/a {nombre_inquilino},\n\nSe ha detectado una situación que requiere atención urgente en {propiedad} - {unidad}.\n\nDescripción: {descripcion}\n\nNuestro equipo de mantenimiento se pondrá en contacto contigo de inmediato para coordinar la visita.\n\nGracias por tu comprensión.\n\n{empresa}`,
      mensajePush: '¡URGENTE! Mantenimiento de emergencia necesario en tu propiedad',
      mensajeSMS: 'URGENTE: Mantenimiento de emergencia. Te contactaremos de inmediato.',
      variables: ['nombre_inquilino', 'propiedad', 'unidad', 'descripcion', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
    {
      nombre: 'Documento Pendiente de Firma',
      categoria: 'general',
      asuntoEmail: 'Documento Pendiente de Firma',
      mensajeEmail: `Hola {nombre_inquilino},\n\nTienes un documento pendiente de firma en nuestro sistema.\n\nDocumento: {nombre_documento}\nTipo: {tipo_documento}\n\nPor favor, accede a tu portal para revisar y firmar el documento lo antes posible.\n\nSaludos,\n{empresa}`,
      mensajePush: 'Tienes un documento pendiente de firma: {nombre_documento}',
      mensajeSMS: 'Documento pendiente: {nombre_documento}. Ingresa al portal para firmar.',
      variables: ['nombre_inquilino', 'nombre_documento', 'tipo_documento', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
    {
      nombre: 'Bienvenida Nuevo Inquilino',
      categoria: 'general',
      asuntoEmail: '¡Bienvenido a {empresa}!',
      mensajeEmail: `Hola {nombre_inquilino},\n\n¡Te damos la más cordial bienvenida a {empresa}!\n\nEstamos encantados de tenerte como nuevo inquilino en {propiedad} - {unidad}.\n\nEn los próximos días recibirás toda la información necesaria sobre tu propiedad, reglas de la comunidad y cómo acceder a nuestro portal en línea.\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\n¡Bienvenido a tu nuevo hogar!\n\n{empresa}`,
      mensajePush: '¡Bienvenido a {empresa}! Estamos contentos de tenerte con nosotros',
      mensajeSMS: 'Bienvenido a {empresa}! Pronto recibirás toda la información de tu propiedad.',
      variables: ['nombre_inquilino', 'propiedad', 'unidad', 'empresa'],
      esPlantillaGlobal: true,
      activa: true,
    },
  ];

  console.log(`Creating ${templates.length} notification templates...`);

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: {
        // Using a composite unique constraint based on name and global flag
        // Since we don't have a unique constraint in the schema, we'll use create/update pattern
        id: 'temp-' + template.nombre.toLowerCase().replace(/\s+/g, '-'),
      },
      update: template,
      create: {
        ...template,
        companyId: null, // Global templates
      },
    }).catch(async () => {
      // If upsert fails (ID not found), just create
      await prisma.notificationTemplate.create({
        data: {
          ...template,
          companyId: null,
        },
      });
    });
  }

  console.log('✓ Notification templates seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding notification templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
