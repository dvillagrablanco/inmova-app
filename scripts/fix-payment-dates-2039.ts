/**
 * Fix: Corregir pagos con fechas de vencimiento en el año 2039
 *
 * Problema detectado:
 * - En la sección de Pagos se muestran registros con fechas de vencimiento
 *   como "01 jul 2039", "01 jun 2039", "01 may 2039".
 * - Esto parece un error en la generación o importación de datos de contratos.
 *
 * Este script:
 * 1. Detecta todos los pagos con fechaVencimiento posterior a 5 años desde hoy
 * 2. Intenta corregir las fechas basándose en el contrato asociado
 * 3. Si el contrato también tiene fechas erróneas, ajusta proporcionalmente
 * 4. Muestra un resumen antes de aplicar cambios (dry-run por defecto)
 *
 * Uso:
 *   npx tsx scripts/fix-payment-dates-2039.ts          # Dry run (solo muestra)
 *   npx tsx scripts/fix-payment-dates-2039.ts --apply   # Aplica los cambios
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const MAX_FUTURE_YEARS = 5;
const DRY_RUN = !process.argv.includes('--apply');

async function main() {
  console.log('====================================================================');
  console.log('  FIX: CORREGIR PAGOS CON FECHAS DE VENCIMIENTO EN 2039+');
  console.log(`  Modo: ${DRY_RUN ? 'DRY RUN (sin cambios)' : 'APLICANDO CAMBIOS'}`);
  console.log('====================================================================\n');

  const now = new Date();
  const maxDate = new Date(now.getFullYear() + MAX_FUTURE_YEARS, 11, 31);
  
  // 1. Buscar pagos con fechas futuras anómalas
  const anomalousPayments = await prisma.payment.findMany({
    where: {
      fechaVencimiento: { gt: maxDate },
    },
    include: {
      contract: {
        select: {
          id: true,
          fechaInicio: true,
          fechaFin: true,
          rentaMensual: true,
          tenant: { select: { nombreCompleto: true } },
          unit: { select: { numero: true, building: { select: { nombre: true } } } },
        },
      },
    },
    orderBy: { fechaVencimiento: 'asc' },
  });

  console.log(`Pagos con fechaVencimiento > ${maxDate.getFullYear()}: ${anomalousPayments.length}\n`);

  if (anomalousPayments.length === 0) {
    console.log('No se encontraron pagos con fechas anómalas. Todo correcto.');
    await prisma.$disconnect();
    return;
  }

  // 2. Agrupar por contrato para analizar
  const byContract = new Map<string, typeof anomalousPayments>();
  for (const payment of anomalousPayments) {
    const key = payment.contractId;
    if (!byContract.has(key)) byContract.set(key, []);
    byContract.get(key)!.push(payment);
  }

  console.log(`Contratos afectados: ${byContract.size}\n`);

  let totalFixed = 0;
  let totalSkipped = 0;

  for (const [contractId, payments] of byContract) {
    const contract = payments[0].contract;
    const tenantName = contract?.tenant?.nombreCompleto || 'Desconocido';
    const unitInfo = contract ? `${contract.unit?.building?.nombre} - ${contract.unit?.numero}` : 'Unidad desconocida';
    
    console.log(`--- Contrato: ${contractId}`);
    console.log(`    Inquilino: ${tenantName}`);
    console.log(`    Unidad: ${unitInfo}`);
    console.log(`    Pagos anómalos: ${payments.length}`);

    // Determinar la corrección: 
    // Si el año es 2039, probablemente debería ser 2025 o 2026 (diferencia de ~14 años)
    // Calculamos el offset entre el año anómalo y el rango esperado
    for (const payment of payments) {
      const wrongDate = payment.fechaVencimiento;
      const yearDiff = wrongDate.getFullYear() - now.getFullYear();
      
      // Heurística: si la diferencia es > 5 años, restar la diferencia necesaria
      // para que quede dentro del rango del contrato
      let correctedDate: Date;
      
      if (contract?.fechaInicio && contract?.fechaFin) {
        // Usar el rango del contrato como referencia
        const contractStart = new Date(contract.fechaInicio);
        const contractEnd = new Date(contract.fechaFin);
        const contractYearSpan = contractEnd.getFullYear() - contractStart.getFullYear();
        
        // Si el contrato también tiene fechas anómalas (fin > maxDate), 
        // asumir que el pago debería estar ~yearDiff años antes
        if (contractEnd > maxDate) {
          // Restar años para poner en el rango actual
          const yearsToSubtract = wrongDate.getFullYear() - (now.getFullYear() + 1);
          correctedDate = new Date(wrongDate);
          correctedDate.setFullYear(wrongDate.getFullYear() - yearsToSubtract);
        } else {
          // El contrato tiene fechas normales; el pago debería estar dentro del rango
          correctedDate = new Date(wrongDate);
          correctedDate.setFullYear(contractEnd.getFullYear());
          // Si la fecha corregida es anterior al inicio del contrato, usar el año de inicio
          if (correctedDate < contractStart) {
            correctedDate.setFullYear(contractStart.getFullYear());
          }
        }
      } else {
        // Sin contrato de referencia: restar la diferencia excesiva
        correctedDate = new Date(wrongDate);
        correctedDate.setFullYear(now.getFullYear());
        // Si queda en el pasado lejano, usar año siguiente
        if (correctedDate < new Date(now.getFullYear() - 1, 0, 1)) {
          correctedDate.setFullYear(now.getFullYear() + 1);
        }
      }

      const wrongStr = wrongDate.toISOString().split('T')[0];
      const correctedStr = correctedDate.toISOString().split('T')[0];
      
      console.log(`    Pago ${payment.id}: ${wrongStr} → ${correctedStr} (periodo: ${payment.periodo})`);

      if (!DRY_RUN) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { fechaVencimiento: correctedDate },
        });
        totalFixed++;
      } else {
        totalFixed++;
      }
    }
    console.log('');
  }

  // 3. También verificar contratos con fechaFin anómala
  const anomalousContracts = await prisma.contract.findMany({
    where: {
      fechaFin: { gt: maxDate },
    },
    select: {
      id: true,
      fechaInicio: true,
      fechaFin: true,
      estado: true,
      tenant: { select: { nombreCompleto: true } },
      unit: { select: { numero: true, building: { select: { nombre: true } } } },
    },
  });

  if (anomalousContracts.length > 0) {
    console.log('\n====================================================================');
    console.log(`  CONTRATOS CON FECHAS ANÓMALAS: ${anomalousContracts.length}`);
    console.log('====================================================================\n');
    
    for (const contract of anomalousContracts) {
      const correctedEnd = new Date(contract.fechaFin);
      const yearsToSubtract = correctedEnd.getFullYear() - (now.getFullYear() + 2);
      if (yearsToSubtract > 0) {
        correctedEnd.setFullYear(correctedEnd.getFullYear() - yearsToSubtract);
      }

      console.log(`  Contrato ${contract.id}:`);
      console.log(`    Inquilino: ${contract.tenant?.nombreCompleto || 'N/A'}`);
      console.log(`    Unidad: ${contract.unit?.building?.nombre} - ${contract.unit?.numero}`);
      console.log(`    Fecha fin: ${contract.fechaFin.toISOString().split('T')[0]} → ${correctedEnd.toISOString().split('T')[0]}`);
      console.log(`    Estado: ${contract.estado}`);

      if (!DRY_RUN) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: { fechaFin: correctedEnd },
        });
      }
    }
  }

  console.log('\n====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  Pagos ${DRY_RUN ? 'a corregir' : 'corregidos'}: ${totalFixed}`);
  console.log(`  Contratos con fechas anómalas: ${anomalousContracts.length}`);
  if (DRY_RUN) {
    console.log('\n  ⚠️  Esto fue un DRY RUN. Para aplicar cambios:');
    console.log('     npx tsx scripts/fix-payment-dates-2039.ts --apply');
  } else {
    console.log('\n  ✅ Cambios aplicados correctamente.');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
