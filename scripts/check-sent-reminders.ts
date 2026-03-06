/**
 * Script para consultar recordatorios de pago enviados ayer y hoy
 * Ejecutar: npx tsx scripts/check-sent-reminders.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const notifications = await prisma.notification.findMany({
    where: {
      tipo: 'pago_atrasado',
      createdAt: { gte: yesterday },
    },
    include: {
      company: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`RECORDATORIOS DE PAGO ENVIADOS (desde ${yesterday.toLocaleDateString('es-ES')})`);
  console.log(`Total: ${notifications.length}`);
  console.log(`${'='.repeat(80)}\n`);

  if (notifications.length === 0) {
    console.log('No se encontraron recordatorios de pago en este periodo.');
    return;
  }

  const paymentIds = notifications
    .map(n => n.entityId)
    .filter((id): id is string => !!id);

  const payments = await prisma.payment.findMany({
    where: { id: { in: paymentIds } },
    include: {
      contract: {
        include: {
          tenant: { select: { nombreCompleto: true, email: true, telefono: true } },
          unit: {
            include: {
              building: {
                select: { nombre: true, companyId: true },
              },
            },
          },
        },
      },
      sepaPayments: { take: 1 },
    },
  });

  const paymentMap = new Map(payments.map(p => [p.id, p]));

  for (const notif of notifications) {
    const payment = notif.entityId ? paymentMap.get(notif.entityId) : null;
    const tenant = payment?.contract?.tenant;
    const building = payment?.contract?.unit?.building;
    const isSepa = (payment?.sepaPayments?.length ?? 0) > 0;
    const isDomiciliado = payment?.contract?.metodoPago === 'domiciliacion' ||
                          payment?.contract?.metodoPago === 'domiciliación';

    console.log(`----- ${notif.createdAt.toLocaleString('es-ES')} -----`);
    console.log(`  Empresa:    ${notif.company?.nombre || 'N/A'}`);
    console.log(`  Inquilino:  ${tenant?.nombreCompleto || 'N/A'}`);
    console.log(`  Email:      ${tenant?.email || 'N/A'}`);
    console.log(`  Teléfono:   ${tenant?.telefono || 'N/A'}`);
    console.log(`  Edificio:   ${building?.nombre || 'N/A'} - Unidad ${payment?.contract?.unit?.numero || 'N/A'}`);
    console.log(`  Periodo:    ${payment?.periodo || 'N/A'}`);
    console.log(`  Monto:      €${payment?.monto || 'N/A'}`);
    console.log(`  Vencimiento:${payment?.fechaVencimiento ? payment.fechaVencimiento.toLocaleDateString('es-ES') : 'N/A'}`);
    console.log(`  Estado:     ${payment?.estado || 'N/A'}`);
    console.log(`  Método:     ${payment?.contract?.metodoPago || 'N/A'}`);
    console.log(`  SEPA:       ${isSepa ? 'SI (domiciliado)' : 'NO'}`);
    console.log(`  Domiciliado:${isDomiciliado ? 'SI' : 'NO'}`);
    console.log(`  Titulo:     ${notif.titulo}`);
    console.log(`  Prioridad:  ${notif.prioridad}`);
    console.log('');
  }

  const empresas = new Map<string, number>();
  for (const n of notifications) {
    const name = n.company?.nombre || 'Sin empresa';
    empresas.set(name, (empresas.get(name) || 0) + 1);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('RESUMEN POR EMPRESA:');
  for (const [empresa, count] of empresas) {
    console.log(`  ${empresa}: ${count} recordatorio(s)`);
  }
  console.log(`${'='.repeat(80)}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
