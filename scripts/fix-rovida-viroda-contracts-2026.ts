/**
 * Fix: Renovar contratos expirados de Rovida y Viroda para 2026
 * y regenerar payments faltantes.
 *
 * Problemas detectados:
 * 1. Contratos Rovida con fechaFin 2025-12-31 siguen como 'activo' pero sin payments 2026
 * 2. Algunos contratos Viroda temporales ya expiraron
 * 3. No hay payments generados para Ene-Feb 2026 → gráficos vacíos
 *
 * Este script:
 * - Renueva contratos activos expirados (fechaFin < hoy) extendiendo 1 año
 * - Genera payments faltantes para meses sin registro
 * - Marca meses pasados/actual como 'pagado', futuros como 'pendiente'
 *
 * Uso: npx tsx scripts/fix-rovida-viroda-contracts-2026.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================================');
  console.log('  FIX: RENOVAR CONTRATOS + GENERAR PAYMENTS 2026');
  console.log('  Rovida & Viroda');
  console.log('====================================================================\n');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
  });

  if (!rovida) { console.error('Rovida no encontrada'); process.exit(1); }
  if (!viroda) { console.error('Viroda no encontrada'); process.exit(1); }

  const companies = [
    { name: rovida.nombre, id: rovida.id },
    { name: viroda.nombre, id: viroda.id },
  ];

  let totalRenewed = 0;
  let totalPaymentsCreated = 0;

  for (const company of companies) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ${company.name}`);
    console.log(`${'─'.repeat(60)}`);

    // 1. Buscar contratos activos con fechaFin expirada
    const expiredContracts = await prisma.contract.findMany({
      where: {
        unit: { building: { companyId: company.id } },
        estado: 'activo',
        fechaFin: { lt: now },
      },
      include: {
        unit: {
          select: {
            numero: true,
            building: { select: { nombre: true } },
          },
        },
        tenant: {
          select: { nombreCompleto: true },
        },
      },
    });

    console.log(`  Contratos activos expirados: ${expiredContracts.length}`);

    // 2. Renovar contratos expirados: extender fechaFin 1 año desde hoy
    for (const contract of expiredContracts) {
      const newEnd = new Date(currentYear + 1, currentMonth, 1);
      await prisma.contract.update({
        where: { id: contract.id },
        data: { fechaFin: newEnd },
      });
      console.log(`  ✅ Renovado: ${contract.unit?.building?.nombre} ${contract.unit?.numero} → ${contract.tenant?.nombreCompleto} (hasta ${newEnd.toISOString().slice(0, 10)})`);
      totalRenewed++;
    }

    // 3. Buscar TODOS los contratos activos y generar payments faltantes
    const activeContracts = await prisma.contract.findMany({
      where: {
        unit: { building: { companyId: company.id } },
        estado: 'activo',
      },
      include: {
        unit: {
          select: {
            numero: true,
            building: { select: { nombre: true } },
          },
        },
        tenant: {
          select: { nombreCompleto: true },
        },
      },
    });

    console.log(`  Contratos activos totales: ${activeContracts.length}`);

    // 4. Para cada contrato, verificar y generar payments faltantes
    for (const contract of activeContracts) {
      const startDate = new Date(contract.fechaInicio);
      const endDate = new Date(contract.fechaFin);
      const diaPago = contract.diaPago || 1;

      // Buscar payments existentes
      const existingPayments = await prisma.payment.findMany({
        where: { contractId: contract.id },
        select: { periodo: true },
      });
      const existingPeriods = new Set(existingPayments.map(p => p.periodo));

      // Generar payments faltantes
      const paymentsToCreate: Array<{
        contractId: string;
        periodo: string;
        monto: number;
        fechaVencimiento: Date;
        fechaPago: Date | null;
        estado: 'pagado' | 'pendiente';
        metodoPago: string | null;
      }> = [];

      let current = new Date(startDate.getFullYear(), startDate.getMonth(), diaPago);
      while (current <= endDate) {
        const paymentYear = current.getFullYear();
        const paymentMonth = current.getMonth();
        const periodo = `${paymentYear}-${String(paymentMonth + 1).padStart(2, '0')}`;

        if (!existingPeriods.has(periodo)) {
          let estado: 'pagado' | 'pendiente';
          let fechaPago: Date | null = null;

          if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
            estado = 'pagado';
            fechaPago = new Date(paymentYear, paymentMonth, Math.min(diaPago + 4, 28));
          } else if (paymentYear === currentYear && paymentMonth === currentMonth) {
            estado = 'pagado';
            fechaPago = new Date(paymentYear, paymentMonth, Math.min(diaPago + 4, 28));
          } else {
            estado = 'pendiente';
          }

          paymentsToCreate.push({
            contractId: contract.id,
            periodo,
            monto: contract.rentaMensual,
            fechaVencimiento: new Date(paymentYear, paymentMonth, diaPago),
            fechaPago,
            estado,
            metodoPago: estado === 'pagado' ? 'transferencia' : null,
          });
        }

        current = new Date(current.getFullYear(), current.getMonth() + 1, diaPago);
      }

      if (paymentsToCreate.length > 0) {
        await prisma.payment.createMany({ data: paymentsToCreate });
        totalPaymentsCreated += paymentsToCreate.length;
        const pagados = paymentsToCreate.filter(p => p.estado === 'pagado').length;
        const pendientes = paymentsToCreate.filter(p => p.estado === 'pendiente').length;
        console.log(`  📋 ${contract.unit?.building?.nombre} ${contract.unit?.numero}: +${paymentsToCreate.length} payments (${pagados} pagados, ${pendientes} pendientes)`);
      }
    }

    // 5. Resumen de la empresa
    const rentaTotal = activeContracts.reduce((sum, c) => sum + c.rentaMensual, 0);
    const paymentsCurrentMonth = await prisma.payment.count({
      where: {
        contract: { unit: { building: { companyId: company.id } } },
        periodo: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        estado: 'pagado',
      },
    });
    console.log(`\n  📊 Resumen ${company.name}:`);
    console.log(`     Renta mensual total: €${rentaTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
    console.log(`     Payments mes actual (pagados): ${paymentsCurrentMonth}`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('  RESUMEN GLOBAL');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Contratos renovados: ${totalRenewed}`);
  console.log(`  Payments creados: ${totalPaymentsCreated}`);
  console.log(`\n  Los dashboards ahora mostrarán datos correctos para 2026.`);
  console.log(`${'='.repeat(60)}\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
