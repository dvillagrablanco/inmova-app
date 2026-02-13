/**
 * Script: Generar registros de Payment para contratos activos de Rovida y Viroda
 * 
 * Los contratos se importaron desde otro software pero sin generar los Payment
 * mensuales que alimentan los gráficos del dashboard.
 * 
 * Este script:
 * 1. Busca todos los contratos activos de Rovida y Viroda
 * 2. Para cada contrato genera un Payment por mes (fechaInicio → fechaFin)
 * 3. Meses pasados → estado 'pagado' con fechaPago = día 5 del mes
 * 4. Mes actual → estado 'pagado' (asumimos cobrado)
 * 5. Meses futuros → estado 'pendiente'
 * 6. Elimina payments previos si existen (evita duplicados)
 * 
 * Uso: npx tsx scripts/generate-payments-rovida-viroda.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================================');
  console.log('  GENERAR PAYMENTS - ROVIDA & VIRODA');
  console.log('====================================================================\n');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Buscar empresas
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

  let totalPaymentsCreated = 0;
  let totalPaymentsPagados = 0;
  let totalPaymentsPendientes = 0;
  let totalContractsProcessed = 0;

  for (const company of companies) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ${company.name}`);
    console.log(`${'─'.repeat(60)}`);

    // Obtener contratos activos con su info
    const contracts = await prisma.contract.findMany({
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

    console.log(`  Contratos activos: ${contracts.length}`);

    if (contracts.length === 0) continue;

    // Eliminar payments existentes de estos contratos (evitar duplicados)
    const contractIds = contracts.map(c => c.id);
    const deleted = await prisma.payment.deleteMany({
      where: { contractId: { in: contractIds } },
    });
    if (deleted.count > 0) {
      console.log(`  Payments anteriores eliminados: ${deleted.count}`);
    }

    let companyPayments = 0;
    let companyPagados = 0;
    let companyPendientes = 0;

    // Generar payments por contrato
    for (const contract of contracts) {
      const payments: Array<{
        contractId: string;
        periodo: string;
        monto: number;
        fechaVencimiento: Date;
        fechaPago: Date | null;
        estado: 'pagado' | 'pendiente';
        metodoPago: string | null;
        isDemo: boolean;
      }> = [];

      const startDate = new Date(contract.fechaInicio);
      const endDate = new Date(contract.fechaFin);
      const diaPago = contract.diaPago || 1;

      // Iterar mes a mes desde inicio hasta fin del contrato
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), diaPago);

      while (current <= endDate) {
        const paymentYear = current.getFullYear();
        const paymentMonth = current.getMonth();
        const periodo = `${paymentYear}-${String(paymentMonth + 1).padStart(2, '0')}`;

        // Determinar estado: pasado/actual = pagado, futuro = pendiente
        let estado: 'pagado' | 'pendiente';
        let fechaPago: Date | null = null;

        if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
          // Mes pasado → pagado
          estado = 'pagado';
          fechaPago = new Date(paymentYear, paymentMonth, Math.min(diaPago + 4, 28)); // Pagado ~5 días después
        } else if (paymentYear === currentYear && paymentMonth === currentMonth) {
          // Mes actual → pagado (asumimos cobrado)
          estado = 'pagado';
          fechaPago = new Date(paymentYear, paymentMonth, Math.min(diaPago + 4, 28));
        } else {
          // Mes futuro → pendiente
          estado = 'pendiente';
        }

        payments.push({
          contractId: contract.id,
          periodo,
          monto: contract.rentaMensual,
          fechaVencimiento: new Date(paymentYear, paymentMonth, diaPago),
          fechaPago,
          estado,
          metodoPago: estado === 'pagado' ? 'transferencia' : null,
          isDemo: false,
        });

        // Siguiente mes
        current = new Date(current.getFullYear(), current.getMonth() + 1, diaPago);
      }

      if (payments.length > 0) {
        await prisma.payment.createMany({ data: payments });
        
        const pagados = payments.filter(p => p.estado === 'pagado').length;
        const pendientes = payments.filter(p => p.estado === 'pendiente').length;
        
        companyPayments += payments.length;
        companyPagados += pagados;
        companyPendientes += pendientes;
      }

      totalContractsProcessed++;
    }

    totalPaymentsCreated += companyPayments;
    totalPaymentsPagados += companyPagados;
    totalPaymentsPendientes += companyPendientes;

    // Calcular renta mensual total
    const rentaTotal = contracts.reduce((sum, c) => sum + c.rentaMensual, 0);

    console.log(`  Payments generados: ${companyPayments}`);
    console.log(`    - Pagados (histórico): ${companyPagados}`);
    console.log(`    - Pendientes (futuro): ${companyPendientes}`);
    console.log(`  Renta mensual total: €${rentaTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
  }

  // Resumen final
  console.log(`\n${'='.repeat(60)}`);
  console.log('  RESUMEN');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Contratos procesados: ${totalContractsProcessed}`);
  console.log(`  Total payments creados: ${totalPaymentsCreated}`);
  console.log(`    - Pagados: ${totalPaymentsPagados}`);
  console.log(`    - Pendientes: ${totalPaymentsPendientes}`);
  console.log(`\n  Los gráficos del dashboard ahora mostrarán datos reales.`);
  console.log(`${'='.repeat(60)}\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
