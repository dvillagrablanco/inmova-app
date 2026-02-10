/**
 * Import Rovida Contabilidad desde el XLSX del Diario General
 * 
 * Lee el archivo XLSX de contabilidad y carga los asientos como
 * AccountingTransactions para la empresa Rovida.
 * 
 * También actualiza el DocumentImportBatch con los datos extraídos
 * para que el AI Document Assistant tenga contexto.
 * 
 * Uso: npx tsx scripts/import-rovida-contabilidad.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Mapa de subcuentas a categorías contables
function classifySubcuenta(subcuenta: string, titulo: string, debe: number, haber: number): {
  tipo: 'ingreso' | 'gasto';
  categoria: string;
} {
  const sub = String(subcuenta);
  const tit = (titulo || '').toLowerCase();
  
  // Grupo 7: Ingresos
  if (sub.startsWith('7')) {
    if (tit.includes('alquiler') || tit.includes('renta') || tit.includes('arrendamiento')) {
      return { tipo: 'ingreso', categoria: 'ingreso_renta' };
    }
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }
  
  // Grupo 6: Gastos
  if (sub.startsWith('6')) {
    if (tit.includes('seguro')) return { tipo: 'gasto', categoria: 'gasto_seguro' };
    if (tit.includes('impuesto') || tit.includes('tributo') || tit.includes('ibi')) return { tipo: 'gasto', categoria: 'gasto_impuesto' };
    if (tit.includes('mantenimiento') || tit.includes('reparacion') || tit.includes('reparación')) return { tipo: 'gasto', categoria: 'gasto_mantenimiento' };
    if (tit.includes('comunidad') || tit.includes('comunidades')) return { tipo: 'gasto', categoria: 'gasto_comunidad' };
    if (tit.includes('servicio') || tit.includes('suministro') || tit.includes('electricidad') || tit.includes('agua') || tit.includes('gas')) return { tipo: 'gasto', categoria: 'gasto_servicio' };
    if (tit.includes('administracion') || tit.includes('administración') || tit.includes('gestoría') || tit.includes('asesoría')) return { tipo: 'gasto', categoria: 'gasto_administracion' };
    return { tipo: 'gasto', categoria: 'gasto_otro' };
  }
  
  // Por defecto según si es Debe (gasto) o Haber (ingreso)
  if (haber > 0 && debe === 0) {
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }
  return { tipo: 'gasto', categoria: 'gasto_otro' };
}

async function main() {
  console.log('====================================================================');
  console.log('  IMPORTAR CONTABILIDAD ROVIDA - DIARIO GENERAL 2025');
  console.log('====================================================================\n');

  // 1. Buscar empresa Rovida
  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });

  if (!rovida) {
    console.error('Empresa Rovida no encontrada');
    process.exit(1);
  }
  console.log(`Empresa: ${rovida.nombre} (${rovida.id})`);

  // 2. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: 'dvillagra@vidaroinversiones.com' },
  });
  if (!user) {
    console.error('Usuario dvillagra no encontrado');
    process.exit(1);
  }
  console.log(`Usuario: ${user.email} (${user.id})`);

  // 3. Leer XLSX
  const xlsxPath = process.env.XLSX_PATH || '/tmp/rovida_contabilidad.xlsx';
  console.log(`\nLeyendo: ${xlsxPath}`);
  
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  
  console.log(`Filas totales: ${data.length}`);

  // 4. Parsear asientos (empezar desde fila 5, la 4 es el header)
  const asientos: Array<{
    asiento: number;
    apunte: number;
    fecha: Date;
    factura: string;
    documento: string;
    subcuenta: string;
    titulo: string;
    contrapartida: string;
    concepto: string;
    referencia: string;
    debe: number;
    haber: number;
  }> = [];

  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0] || String(row[0]).trim() === '') continue;
    
    const asientoNum = Number(row[0]);
    if (isNaN(asientoNum)) continue;

    let fecha: Date;
    if (row[2] instanceof Date) {
      fecha = row[2];
    } else if (typeof row[2] === 'number') {
      // Excel serial date
      fecha = new Date((row[2] - 25569) * 86400 * 1000);
    } else if (typeof row[2] === 'string') {
      fecha = new Date(row[2]);
    } else {
      fecha = new Date('2025-01-01');
    }

    if (isNaN(fecha.getTime())) {
      fecha = new Date('2025-01-01');
    }

    asientos.push({
      asiento: asientoNum,
      apunte: Number(row[1]) || 0,
      fecha,
      factura: String(row[3] || ''),
      documento: String(row[4] || ''),
      subcuenta: String(row[5] || ''),
      titulo: String(row[6] || ''),
      contrapartida: String(row[7] || ''),
      concepto: String(row[8] || ''),
      referencia: String(row[9] || ''),
      debe: Number(row[10]) || 0,
      haber: Number(row[11]) || 0,
    });
  }

  console.log(`Asientos parseados: ${asientos.length}`);

  // 5. Agrupar por concepto/fecha para crear transacciones significativas
  // (No insertamos 11k filas, agrupamos por asiento contable)
  const asientoGroups = new Map<number, typeof asientos>();
  for (const a of asientos) {
    if (!asientoGroups.has(a.asiento)) {
      asientoGroups.set(a.asiento, []);
    }
    asientoGroups.get(a.asiento)!.push(a);
  }

  console.log(`Asientos únicos: ${asientoGroups.size}`);

  // 6. Eliminar transacciones previas de Rovida (para re-importar limpio)
  const deleted = await prisma.accountingTransaction.deleteMany({
    where: { companyId: rovida.id },
  });
  console.log(`Transacciones previas eliminadas: ${deleted.count}`);

  // 7. Crear transacciones agrupadas por asiento
  let created = 0;
  let errors = 0;
  const batchSize = 100;
  const transactions: any[] = [];

  for (const [asientoNum, entries] of asientoGroups) {
    // Tomar la primera entrada como representativa
    const first = entries[0];
    const totalDebe = entries.reduce((s, e) => s + e.debe, 0);
    const totalHaber = entries.reduce((s, e) => s + e.haber, 0);
    const monto = Math.max(totalDebe, totalHaber);
    
    if (monto === 0) continue;
    
    const { tipo, categoria } = classifySubcuenta(first.subcuenta, first.titulo, totalDebe, totalHaber);
    
    const concepto = first.concepto || first.titulo || `Asiento ${asientoNum}`;
    
    transactions.push({
      companyId: rovida.id,
      tipo,
      categoria,
      concepto: concepto.substring(0, 500),
      monto: Math.round(monto * 100) / 100,
      fecha: first.fecha,
      referencia: `AS-${asientoNum}${first.factura ? ' / ' + first.factura : ''}`,
      notas: `Subcuenta: ${first.subcuenta} - ${first.titulo}. Debe: ${totalDebe.toFixed(2)}, Haber: ${totalHaber.toFixed(2)}`,
    });
  }

  // Insertar en batches
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    try {
      await prisma.accountingTransaction.createMany({
        data: batch,
      });
      created += batch.length;
    } catch (err: any) {
      console.error(`Error en batch ${i}: ${err.message}`);
      errors += batch.length;
    }
    if ((i + batchSize) % 500 === 0) {
      console.log(`  Progreso: ${Math.min(i + batchSize, transactions.length)}/${transactions.length}`);
    }
  }

  console.log(`\nTransacciones creadas: ${created}`);
  console.log(`Errores: ${errors}`);

  // 8. Crear/actualizar DocumentImportBatch para tracking
  const batch = await prisma.documentImportBatch.create({
    data: {
      companyId: rovida.id,
      userId: user.id,
      name: 'Contabilidad Rovida - Diario General 2025',
      description: `Importación automática del Diario General de Rovida S.L. Periodo: Ene-Oct 2025. ${asientos.length} asientos contables, ${asientoGroups.size} transacciones, Total Debe/Haber: ${(asientos.reduce((s, a) => s + a.debe, 0) / 1000000).toFixed(1)}M€`,
      totalFiles: 1,
      processedFiles: 1,
      successfulFiles: 1,
      failedFiles: 0,
      status: 'approved',
      progress: 100,
      autoApprove: true,
      extractedEntities: {
        totalAsientos: asientos.length,
        asientosUnicos: asientoGroups.size,
        transaccionesCreadas: created,
        totalDebe: asientos.reduce((s, a) => s + a.debe, 0),
        totalHaber: asientos.reduce((s, a) => s + a.haber, 0),
        periodoInicio: '2025-01-01',
        periodoFin: '2025-10-31',
        subcuentasUnicas: new Set(asientos.map(a => a.subcuenta)).size,
      },
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
  console.log(`\nDocumentImportBatch creado: ${batch.id}`);

  // 9. Resumen
  const totalDebe = asientos.reduce((s, a) => s + a.debe, 0);
  const totalHaber = asientos.reduce((s, a) => s + a.haber, 0);

  console.log('\n====================================================================');
  console.log('  IMPORTACIÓN COMPLETADA');
  console.log('====================================================================');
  console.log(`  Empresa: ${rovida.nombre}`);
  console.log(`  Periodo: Enero - Octubre 2025`);
  console.log(`  Asientos: ${asientos.length}`);
  console.log(`  Transacciones: ${created}`);
  console.log(`  Total Debe: €${(totalDebe / 1000000).toFixed(2)}M`);
  console.log(`  Total Haber: €${(totalHaber / 1000000).toFixed(2)}M`);
  console.log(`  Subcuentas: ${new Set(asientos.map(a => a.subcuenta)).size}`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
