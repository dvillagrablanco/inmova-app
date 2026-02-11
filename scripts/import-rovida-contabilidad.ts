/**
 * Import Rovida Contabilidad desde los XLSX del Diario General
 * 
 * Lee los archivos XLSX de contabilidad (2025 completo + 2026 parcial) y carga 
 * los asientos como AccountingTransactions para la empresa Rovida.
 * 
 * También actualiza el DocumentImportBatch con los datos extraídos
 * para que el AI Document Assistant tenga contexto.
 * 
 * Archivos fuente:
 *   - data/rovida/diario_general_2025.xlsx (Ene-Dic 2025, ~13.800 líneas, ~2.800 asientos)
 *   - data/rovida/diario_general_2026.xlsx (Ene-Feb 2026, ~1.360 líneas, ~400 asientos)
 * 
 * Uso: npx tsx scripts/import-rovida-contabilidad.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// CLASIFICACIÓN DE SUBCUENTAS
// ============================================================================

function classifySubcuenta(subcuenta: string, titulo: string, debe: number, haber: number): {
  tipo: 'ingreso' | 'gasto';
  categoria: string;
} {
  const sub = String(subcuenta);
  const tit = (titulo || '').toLowerCase();
  
  // Grupo 7: Ingresos
  if (sub.startsWith('7')) {
    if (tit.includes('arrend') || tit.includes('alquiler') || tit.includes('renta')) {
      // Subcategorías de ingresos por arrendamiento
      if (tit.includes('garaje') || tit.includes('plaza')) return { tipo: 'ingreso', categoria: 'ingreso_renta_garaje' };
      if (tit.includes('local')) return { tipo: 'ingreso', categoria: 'ingreso_renta_local' };
      if (tit.includes('nave') || tit.includes('cuba')) return { tipo: 'ingreso', categoria: 'ingreso_renta_nave' };
      if (tit.includes('oficina') || tit.includes('europa')) return { tipo: 'ingreso', categoria: 'ingreso_renta_oficina' };
      if (tit.includes('piamonte') || tit.includes('edif')) return { tipo: 'ingreso', categoria: 'ingreso_renta_edificio' };
      if (tit.includes('gemelos') || tit.includes('benidorm')) return { tipo: 'ingreso', categoria: 'ingreso_renta_vivienda' };
      if (tit.includes('constitución') || tit.includes('constitucion')) return { tipo: 'ingreso', categoria: 'ingreso_renta_local' };
      if (tit.includes('prado')) return { tipo: 'ingreso', categoria: 'ingreso_renta_local' };
      if (tit.includes('grijota') || tit.includes('finca')) return { tipo: 'ingreso', categoria: 'ingreso_renta_terreno' };
      if (tit.includes('magaz') || tit.includes('castillo')) return { tipo: 'ingreso', categoria: 'ingreso_renta_garaje' };
      if (tit.includes('hernández') || tit.includes('tejada')) return { tipo: 'ingreso', categoria: 'ingreso_renta_garaje' };
      if (tit.includes('pelayo')) return { tipo: 'ingreso', categoria: 'ingreso_renta_garaje' };
      if (tit.includes('reina')) return { tipo: 'ingreso', categoria: 'ingreso_renta_local' };
      if (tit.includes('barquillo')) return { tipo: 'ingreso', categoria: 'ingreso_renta_local' };
      return { tipo: 'ingreso', categoria: 'ingreso_renta' };
    }
    if (tit.includes('redondeo')) return { tipo: 'ingreso', categoria: 'ingreso_otro' };
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }
  
  // Grupo 6: Gastos
  if (sub.startsWith('6')) {
    if (tit.includes('seguro') || tit.includes('prima')) return { tipo: 'gasto', categoria: 'gasto_seguro' };
    if (tit.includes('impuesto') || tit.includes('tributo') || tit.includes('i.b.i') || tit.includes('ibi') || tit.includes('basura') || tit.includes('tasa')) return { tipo: 'gasto', categoria: 'gasto_impuesto' };
    if (tit.includes('mantenimiento') || tit.includes('reparacion') || tit.includes('reparación') || tit.includes('reforma')) return { tipo: 'gasto', categoria: 'gasto_mantenimiento' };
    if (tit.includes('comunidad') || tit.includes('cdad') || tit.includes('manc')) return { tipo: 'gasto', categoria: 'gasto_comunidad' };
    if (tit.includes('suministro') || tit.includes('electricidad') || tit.includes('agua') || tit.includes('gas') || tit.includes('luz')) return { tipo: 'gasto', categoria: 'gasto_servicio' };
    if (tit.includes('administracion') || tit.includes('administración') || tit.includes('gestoría') || tit.includes('asesoría') || tit.includes('profesional')) return { tipo: 'gasto', categoria: 'gasto_administracion' };
    if (tit.includes('sueldo') || tit.includes('salario') || tit.includes('seg. social') || tit.includes('seguridad social')) return { tipo: 'gasto', categoria: 'gasto_personal' };
    if (tit.includes('amortiz') || tit.includes('dot. am') || tit.includes('dot.am') || tit.includes('dotac')) return { tipo: 'gasto', categoria: 'gasto_amortizacion' };
    if (tit.includes('intragrupo') || tit.includes('vidaro')) return { tipo: 'gasto', categoria: 'gasto_intragrupo' };
    if (tit.includes('sociedades')) return { tipo: 'gasto', categoria: 'gasto_impuesto_sociedades' };
    return { tipo: 'gasto', categoria: 'gasto_otro' };
  }
  
  // Por defecto según si es Debe (gasto) o Haber (ingreso)
  if (haber > 0 && debe === 0) {
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }
  return { tipo: 'gasto', categoria: 'gasto_otro' };
}

// ============================================================================
// PARSEO DE XLSX
// ============================================================================

interface AsientoEntry {
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
  periodo: string; // '2025' o '2026'
}

function parseXlsx(xlsxPath: string, periodo: string, defaultYear: string): AsientoEntry[] {
  console.log(`\nLeyendo: ${xlsxPath}`);
  
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  
  console.log(`  Filas totales: ${data.length}`);
  console.log(`  Periodo: ${data[1] ? String(data[1][0] || '').trim() : 'N/A'}`);

  const entries: AsientoEntry[] = [];

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
      fecha = new Date(`${defaultYear}-01-01`);
    }

    if (isNaN(fecha.getTime())) {
      fecha = new Date(`${defaultYear}-01-01`);
    }

    entries.push({
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
      periodo,
    });
  }

  console.log(`  Líneas parseadas: ${entries.length}`);
  return entries;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('====================================================================');
  console.log('  IMPORTAR CONTABILIDAD ROVIDA - DIARIOS GENERALES 2025 + 2026');
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

  // 3. Leer ambos XLSX
  const basePath = path.resolve(__dirname, '../data/rovida');
  
  const asientos2025 = parseXlsx(
    path.join(basePath, 'diario_general_2025.xlsx'),
    '2025',
    '2025'
  );
  
  const asientos2026 = parseXlsx(
    path.join(basePath, 'diario_general_2026.xlsx'),
    '2026',
    '2026'
  );

  const allAsientos = [...asientos2025, ...asientos2026];
  console.log(`\nTotal líneas combinadas: ${allAsientos.length}`);

  // 4. Agrupar por asiento+periodo para crear transacciones significativas
  // Usamos periodo+asiento como clave para evitar colisiones entre años
  const asientoGroups = new Map<string, AsientoEntry[]>();
  for (const a of allAsientos) {
    const key = `${a.periodo}-${a.asiento}`;
    if (!asientoGroups.has(key)) {
      asientoGroups.set(key, []);
    }
    asientoGroups.get(key)!.push(a);
  }

  console.log(`Asientos únicos (ambos periodos): ${asientoGroups.size}`);

  // 5. Eliminar transacciones previas de Rovida (re-importar limpio)
  const deleted = await prisma.accountingTransaction.deleteMany({
    where: { companyId: rovida.id },
  });
  console.log(`Transacciones previas eliminadas: ${deleted.count}`);

  // 6. Crear transacciones agrupadas por asiento
  let created = 0;
  let errors = 0;
  const batchSize = 100;
  const transactions: any[] = [];

  for (const [key, entries] of asientoGroups) {
    const first = entries[0];
    const totalDebe = entries.reduce((s, e) => s + e.debe, 0);
    const totalHaber = entries.reduce((s, e) => s + e.haber, 0);
    const monto = Math.max(totalDebe, totalHaber);
    
    if (monto === 0) continue;
    
    const { tipo, categoria } = classifySubcuenta(first.subcuenta, first.titulo, totalDebe, totalHaber);
    
    const concepto = first.concepto || first.titulo || `Asiento ${first.asiento}`;
    
    // Recopilar todas las subcuentas del asiento para referencia
    const subcuentasEnAsiento = [...new Set(entries.map(e => `${e.subcuenta} (${e.titulo})`))];
    
    transactions.push({
      companyId: rovida.id,
      tipo,
      categoria,
      concepto: concepto.substring(0, 500),
      monto: Math.round(monto * 100) / 100,
      fecha: first.fecha,
      referencia: `${first.periodo}-AS-${first.asiento}${first.factura ? ' / ' + first.factura : ''}`,
      notas: `Periodo: ${first.periodo}. Subcuentas: ${subcuentasEnAsiento.slice(0, 3).join('; ')}${subcuentasEnAsiento.length > 3 ? ` (+${subcuentasEnAsiento.length - 3} más)` : ''}. Debe: ${totalDebe.toFixed(2)}, Haber: ${totalHaber.toFixed(2)}`,
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
    if ((i + batchSize) % 500 === 0 || i + batchSize >= transactions.length) {
      console.log(`  Progreso: ${Math.min(i + batchSize, transactions.length)}/${transactions.length}`);
    }
  }

  console.log(`\nTransacciones creadas: ${created}`);
  console.log(`Errores: ${errors}`);

  // 7. Crear DocumentImportBatch para tracking
  const totalDebe2025 = asientos2025.reduce((s, a) => s + a.debe, 0);
  const totalHaber2025 = asientos2025.reduce((s, a) => s + a.haber, 0);
  const totalDebe2026 = asientos2026.reduce((s, a) => s + a.debe, 0);
  const totalHaber2026 = asientos2026.reduce((s, a) => s + a.haber, 0);
  const totalDebe = totalDebe2025 + totalDebe2026;
  const totalHaber = totalHaber2025 + totalHaber2026;

  // Contar asientos únicos por periodo
  const asientos2025Unicos = new Set(asientos2025.map(a => a.asiento)).size;
  const asientos2026Unicos = new Set(asientos2026.map(a => a.asiento)).size;

  // Extraer subcuentas de inquilinos (43x) para referencia
  const tenantSubcuentas = new Map<string, { titulo: string; debe: number; haber: number }>();
  for (const a of allAsientos) {
    if (a.subcuenta.startsWith('43')) {
      if (!tenantSubcuentas.has(a.subcuenta)) {
        tenantSubcuentas.set(a.subcuenta, { titulo: a.titulo, debe: 0, haber: 0 });
      }
      const t = tenantSubcuentas.get(a.subcuenta)!;
      t.debe += a.debe;
      t.haber += a.haber;
    }
  }

  // Extraer subcuentas de ingresos (75x)
  const incomeSubcuentas = new Map<string, { titulo: string; haber: number }>();
  for (const a of allAsientos) {
    if (a.subcuenta.startsWith('75')) {
      if (!incomeSubcuentas.has(a.subcuenta)) {
        incomeSubcuentas.set(a.subcuenta, { titulo: a.titulo, haber: 0 });
      }
      incomeSubcuentas.get(a.subcuenta)!.haber += a.haber;
    }
  }

  const batch = await prisma.documentImportBatch.create({
    data: {
      companyId: rovida.id,
      userId: user.id,
      name: 'Contabilidad Rovida - Diarios Generales 2025 + 2026',
      description: `Importación automática del Diario General de Rovida S.L. Periodo 2025 (Ene-Dic): ${asientos2025.length} líneas, ${asientos2025Unicos} asientos, ${(totalDebe2025 / 1000000).toFixed(1)}M€. Periodo 2026 (Ene-Feb): ${asientos2026.length} líneas, ${asientos2026Unicos} asientos, ${(totalDebe2026 / 1000).toFixed(0)}K€. Total transacciones: ${created}.`,
      totalFiles: 2,
      processedFiles: 2,
      successfulFiles: 2,
      failedFiles: 0,
      status: 'approved',
      progress: 100,
      autoApprove: true,
      extractedEntities: {
        // Resumen general
        totalLineas: allAsientos.length,
        totalAsientosUnicos: asientoGroups.size,
        transaccionesCreadas: created,
        totalDebe,
        totalHaber,
        subcuentasUnicas: new Set(allAsientos.map(a => a.subcuenta)).size,
        inquilinosUnicos: tenantSubcuentas.size,
        subcuentasIngreso: incomeSubcuentas.size,
        
        // Desglose por periodo
        periodo2025: {
          lineas: asientos2025.length,
          asientosUnicos: asientos2025Unicos,
          totalDebe: totalDebe2025,
          totalHaber: totalHaber2025,
          periodoInicio: '2025-01-01',
          periodoFin: '2025-12-31',
        },
        periodo2026: {
          lineas: asientos2026.length,
          asientosUnicos: asientos2026Unicos,
          totalDebe: totalDebe2026,
          totalHaber: totalHaber2026,
          periodoInicio: '2026-01-01',
          periodoFin: '2026-02-09',
        },
        
        // Top ingresos por inmueble
        topIngresosInmueble: Array.from(incomeSubcuentas.entries())
          .sort((a, b) => b[1].haber - a[1].haber)
          .slice(0, 15)
          .map(([sub, info]) => ({
            subcuenta: sub,
            titulo: info.titulo,
            ingresoTotal: Math.round(info.haber * 100) / 100,
          })),
        
        // Top inquilinos por volumen
        topInquilinos: Array.from(tenantSubcuentas.entries())
          .sort((a, b) => b[1].debe - a[1].debe)
          .slice(0, 20)
          .map(([sub, info]) => ({
            subcuenta: sub,
            titulo: info.titulo,
            totalDebe: Math.round(info.debe * 100) / 100,
            totalHaber: Math.round(info.haber * 100) / 100,
          })),
      },
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
  console.log(`\nDocumentImportBatch creado: ${batch.id}`);

  // 8. Resumen
  console.log('\n====================================================================');
  console.log('  IMPORTACIÓN COMPLETADA');
  console.log('====================================================================');
  console.log(`  Empresa: ${rovida.nombre}`);
  console.log('');
  console.log('  📊 PERIODO 2025 (Enero - Diciembre):');
  console.log(`     Líneas contables: ${asientos2025.length}`);
  console.log(`     Asientos únicos: ${asientos2025Unicos}`);
  console.log(`     Total Debe: €${(totalDebe2025 / 1000000).toFixed(2)}M`);
  console.log(`     Total Haber: €${(totalHaber2025 / 1000000).toFixed(2)}M`);
  console.log('');
  console.log('  📊 PERIODO 2026 (Enero - Febrero):');
  console.log(`     Líneas contables: ${asientos2026.length}`);
  console.log(`     Asientos únicos: ${asientos2026Unicos}`);
  console.log(`     Total Debe: €${(totalDebe2026 / 1000).toFixed(1)}K`);
  console.log(`     Total Haber: €${(totalHaber2026 / 1000).toFixed(1)}K`);
  console.log('');
  console.log('  📊 TOTALES COMBINADOS:');
  console.log(`     Transacciones: ${created}`);
  console.log(`     Total Debe: €${(totalDebe / 1000000).toFixed(2)}M`);
  console.log(`     Total Haber: €${(totalHaber / 1000000).toFixed(2)}M`);
  console.log(`     Subcuentas: ${new Set(allAsientos.map(a => a.subcuenta)).size}`);
  console.log(`     Inquilinos: ${tenantSubcuentas.size}`);
  console.log('');
  console.log('  📊 TOP INGRESOS POR INMUEBLE:');
  Array.from(incomeSubcuentas.entries())
    .sort((a, b) => b[1].haber - a[1].haber)
    .slice(0, 10)
    .forEach(([sub, info]) => {
      console.log(`     ${info.titulo.substring(0, 55).padEnd(55)} €${info.haber.toFixed(0).padStart(8)}`);
    });
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
