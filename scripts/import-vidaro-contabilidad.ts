/**
 * Import Contabilidad de Vidaro Inversiones S.L. desde los XLSX del Diario General
 * 
 * Vidaro Inversiones es la sociedad holding del grupo. Sus principales actividades son:
 *   - Gestión de carteras de inversión (CACEIS, Inversis, Pictet, Banca March, Bankinter)
 *   - Participaciones en sociedades del grupo (Rovida, Disfasa, Viroda, Facundo, etc.)
 *   - Facturación de servicios intragrupo (ARC - Acuerdo de Reparto de Costes)
 * 
 * Archivos fuente:
 *   - data/vidaro/diario_general_2025.xlsx (Ene-Dic 2025, ~5.800 líneas, ~1.260 asientos, €253M)
 *   - data/vidaro/diario_general_2026.xlsx (Ene-Feb 2026, ~200 líneas, ~45 asientos, €135K)
 *   - data/vidaro/indice_subcuentas.xlsx (Plan de Cuentas, 1.766 subcuentas)
 * 
 * Uso: npx tsx scripts/import-vidaro-contabilidad.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// CLASIFICACIÓN DE SUBCUENTAS VIDARO
// ============================================================================

function classifySubcuenta(subcuenta: string, titulo: string, debe: number, haber: number): {
  tipo: 'ingreso' | 'gasto';
  categoria: string;
} {
  const sub = String(subcuenta);
  const tit = (titulo || '').toLowerCase();
  
  // Grupo 7: Ingresos
  if (sub.startsWith('7')) {
    if (tit.includes('arrend') || tit.includes('alquiler')) return { tipo: 'ingreso', categoria: 'ingreso_renta' };
    if (tit.includes('servicio') || tit.includes('rep.coste') || tit.includes('prest.')) return { tipo: 'ingreso', categoria: 'ingreso_servicios_intragrupo' };
    if (tit.includes('benef') && (tit.includes('partic') || tit.includes('valor') || tit.includes('vrd'))) return { tipo: 'ingreso', categoria: 'ingreso_beneficio_inversiones' };
    if (tit.includes('dividend') || tit.includes('ingr. y div')) return { tipo: 'ingreso', categoria: 'ingreso_dividendos' };
    if (tit.includes('inter') && (tit.includes('ccc') || tit.includes('ipf') || tit.includes('plaz'))) return { tipo: 'ingreso', categoria: 'ingreso_intereses' };
    if (tit.includes('diferencia') && tit.includes('positiva')) return { tipo: 'ingreso', categoria: 'ingreso_diferencias_cambio' };
    if (tit.includes('enajenación') || tit.includes('enajenacion')) return { tipo: 'ingreso', categoria: 'ingreso_enajenacion_participaciones' };
    if (tit.includes('subvención') || tit.includes('subvencion')) return { tipo: 'ingreso', categoria: 'ingreso_subvencion' };
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }
  
  // Grupo 6: Gastos
  if (sub.startsWith('6')) {
    if (tit.includes('arrend') || tit.includes('alquiler')) return { tipo: 'gasto', categoria: 'gasto_arrendamiento' };
    if (tit.includes('sueldo') || tit.includes('salario')) return { tipo: 'gasto', categoria: 'gasto_personal' };
    if (tit.includes('seguridad social') || tit.includes('seg. social')) return { tipo: 'gasto', categoria: 'gasto_personal' };
    if (tit.includes('consejera') || tit.includes('consejero') || tit.includes('asignación')) return { tipo: 'gasto', categoria: 'gasto_consejeros' };
    if (tit.includes('asesor') || tit.includes('profesional') || tit.includes('consultor') || tit.includes('family office')) return { tipo: 'gasto', categoria: 'gasto_profesionales' };
    if (tit.includes('bancari') || tit.includes('comis') && tit.includes('ctas')) return { tipo: 'gasto', categoria: 'gasto_bancario' };
    if (tit.includes('amortiz') || tit.includes('dotación') || tit.includes('dotac')) return { tipo: 'gasto', categoria: 'gasto_amortizacion' };
    if (tit.includes('pérdida') && (tit.includes('partic') || tit.includes('valor') || tit.includes('acc'))) return { tipo: 'gasto', categoria: 'gasto_perdida_inversiones' };
    if (tit.includes('impuesto') || tit.includes('sociedades')) return { tipo: 'gasto', categoria: 'gasto_impuesto' };
    if (tit.includes('multa') || tit.includes('sanción') || tit.includes('sancion')) return { tipo: 'gasto', categoria: 'gasto_multas' };
    if (tit.includes('gasóil') || tit.includes('gasoil') || tit.includes('gasolina')) return { tipo: 'gasto', categoria: 'gasto_vehiculos' };
    if (tit.includes('reparac') || tit.includes('mantenimiento')) return { tipo: 'gasto', categoria: 'gasto_mantenimiento' };
    if (tit.includes('luz') || tit.includes('suministro') || tit.includes('electricidad')) return { tipo: 'gasto', categoria: 'gasto_suministros' };
    return { tipo: 'gasto', categoria: 'gasto_otro' };
  }
  
  if (haber > 0 && debe === 0) return { tipo: 'ingreso', categoria: 'ingreso_otro' };
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
  periodo: string;
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
// PARSEO DE ÍNDICE DE SUBCUENTAS
// ============================================================================

function parseSubcuentas(xlsxPath: string): Array<{ codigo: string; titulo: string }> {
  console.log(`\nLeyendo índice: ${xlsxPath}`);
  
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  
  const subcuentas: Array<{ codigo: string; titulo: string }> = [];
  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    subcuentas.push({
      codigo: String(row[0]),
      titulo: String(row[1] || '').trim(),
    });
  }
  console.log(`  Subcuentas: ${subcuentas.length}`);
  return subcuentas;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('====================================================================');
  console.log('  IMPORTAR CONTABILIDAD VIDARO INVERSIONES S.L.');
  console.log('  Diarios Generales 2025 + 2026 + Índice de Subcuentas');
  console.log('====================================================================\n');

  // 1. Buscar empresa Vidaro
  const vidaro = await prisma.company.findFirst({
    where: { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
  });

  if (!vidaro) {
    console.error('Empresa Vidaro Inversiones no encontrada');
    process.exit(1);
  }
  console.log(`Empresa: ${vidaro.nombre} (${vidaro.id})`);

  // 2. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: 'dvillagra@vidaroinversiones.com' },
  });
  if (!user) {
    console.error('Usuario dvillagra no encontrado');
    process.exit(1);
  }
  console.log(`Usuario: ${user.email} (${user.id})`);

  // 3. Leer archivos
  const basePath = path.resolve(__dirname, '../data/vidaro');
  
  const asientos2025 = parseXlsx(
    path.join(basePath, 'diario_general_2025.xlsx'), '2025', '2025'
  );
  const asientos2026 = parseXlsx(
    path.join(basePath, 'diario_general_2026.xlsx'), '2026', '2026'
  );
  const subcuentas = parseSubcuentas(
    path.join(basePath, 'indice_subcuentas.xlsx')
  );

  const allAsientos = [...asientos2025, ...asientos2026];
  console.log(`\nTotal líneas combinadas: ${allAsientos.length}`);

  // 4. Agrupar por periodo+asiento
  const asientoGroups = new Map<string, AsientoEntry[]>();
  for (const a of allAsientos) {
    const key = `${a.periodo}-${a.asiento}`;
    if (!asientoGroups.has(key)) asientoGroups.set(key, []);
    asientoGroups.get(key)!.push(a);
  }
  console.log(`Asientos únicos (ambos periodos): ${asientoGroups.size}`);

  // 5. Eliminar transacciones previas
  const deleted = await prisma.accountingTransaction.deleteMany({
    where: { companyId: vidaro.id },
  });
  console.log(`Transacciones previas eliminadas: ${deleted.count}`);

  // 6. Crear transacciones
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
    const subcuentasEnAsiento = [...new Set(entries.map(e => `${e.subcuenta} (${e.titulo})`))];
    
    transactions.push({
      companyId: vidaro.id,
      tipo,
      categoria,
      concepto: concepto.substring(0, 500),
      monto: Math.round(monto * 100) / 100,
      fecha: first.fecha,
      referencia: `${first.periodo}-AS-${first.asiento}${first.factura ? ' / ' + first.factura : ''}`,
      notas: `Periodo: ${first.periodo}. Subcuentas: ${subcuentasEnAsiento.slice(0, 3).join('; ')}${subcuentasEnAsiento.length > 3 ? ` (+${subcuentasEnAsiento.length - 3} más)` : ''}. Debe: ${totalDebe.toFixed(2)}, Haber: ${totalHaber.toFixed(2)}`,
    });
  }

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    try {
      await prisma.accountingTransaction.createMany({ data: batch });
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

  // 7. Estadísticas
  const totalDebe2025 = asientos2025.reduce((s, a) => s + a.debe, 0);
  const totalHaber2025 = asientos2025.reduce((s, a) => s + a.haber, 0);
  const totalDebe2026 = asientos2026.reduce((s, a) => s + a.debe, 0);
  const totalHaber2026 = asientos2026.reduce((s, a) => s + a.haber, 0);
  const asientos2025Unicos = new Set(asientos2025.map(a => a.asiento)).size;
  const asientos2026Unicos = new Set(asientos2026.map(a => a.asiento)).size;

  // Clientes intragrupo
  const clientesSubs = new Map<string, { titulo: string; debe: number; haber: number }>();
  for (const a of allAsientos) {
    if (a.subcuenta.startsWith('43')) {
      if (!clientesSubs.has(a.subcuenta)) clientesSubs.set(a.subcuenta, { titulo: a.titulo, debe: 0, haber: 0 });
      const c = clientesSubs.get(a.subcuenta)!;
      c.debe += a.debe; c.haber += a.haber;
    }
  }

  // Ingresos por tipo
  const ingresosSubs = new Map<string, { titulo: string; haber: number }>();
  for (const a of allAsientos) {
    if (a.subcuenta.startsWith('7')) {
      if (!ingresosSubs.has(a.subcuenta)) ingresosSubs.set(a.subcuenta, { titulo: a.titulo, haber: 0 });
      ingresosSubs.get(a.subcuenta)!.haber += a.haber;
    }
  }

  // Inversiones (25x)
  const inversionesSubs = subcuentas.filter(s => s.codigo.startsWith('25'));
  const proveedoresSubs = subcuentas.filter(s => s.codigo.startsWith('41'));

  // 8. DocumentImportBatch
  const batch = await prisma.documentImportBatch.create({
    data: {
      companyId: vidaro.id,
      userId: user.id,
      name: 'Contabilidad Vidaro Inversiones - Diarios 2025 + 2026 + Índice',
      description: `Importación del Diario General de Vidaro Inversiones S.L. Periodo 2025 (Ene-Dic): ${asientos2025.length} líneas, ${asientos2025Unicos} asientos, ${(totalDebe2025 / 1000000).toFixed(0)}M€. Periodo 2026 (Ene-Feb): ${asientos2026.length} líneas, ${asientos2026Unicos} asientos, ${(totalDebe2026 / 1000).toFixed(0)}K€. Plan de Cuentas: ${subcuentas.length} subcuentas. Total transacciones: ${created}.`,
      totalFiles: 3,
      processedFiles: 3,
      successfulFiles: 3,
      failedFiles: 0,
      status: 'approved',
      progress: 100,
      autoApprove: true,
      extractedEntities: {
        totalLineas: allAsientos.length,
        totalAsientosUnicos: asientoGroups.size,
        transaccionesCreadas: created,
        totalSubcuentas: subcuentas.length,
        inversionesFinancieras: inversionesSubs.length,
        proveedores: proveedoresSubs.length,
        clientesIntragrupo: Array.from(clientesSubs.entries()).map(([s, i]) => ({
          subcuenta: s, titulo: i.titulo, totalDebe: Math.round(i.debe * 100) / 100, totalHaber: Math.round(i.haber * 100) / 100,
        })),
        topIngresos: Array.from(ingresosSubs.entries())
          .sort((a, b) => b[1].haber - a[1].haber)
          .slice(0, 15)
          .map(([s, i]) => ({ subcuenta: s, titulo: i.titulo, totalHaber: Math.round(i.haber * 100) / 100 })),
        periodo2025: {
          lineas: asientos2025.length, asientosUnicos: asientos2025Unicos,
          totalDebe: totalDebe2025, totalHaber: totalHaber2025,
          periodoInicio: '2025-01-01', periodoFin: '2025-12-31',
        },
        periodo2026: {
          lineas: asientos2026.length, asientosUnicos: asientos2026Unicos,
          totalDebe: totalDebe2026, totalHaber: totalHaber2026,
          periodoInicio: '2026-01-01', periodoFin: '2026-02-09',
        },
      },
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
  console.log(`\nDocumentImportBatch creado: ${batch.id}`);

  // 9. Resumen
  console.log('\n====================================================================');
  console.log('  IMPORTACIÓN COMPLETADA - VIDARO INVERSIONES S.L.');
  console.log('====================================================================');
  console.log(`  Empresa: ${vidaro.nombre}`);
  console.log('');
  console.log('  📊 PERIODO 2025 (Enero - Diciembre):');
  console.log(`     Líneas contables: ${asientos2025.length}`);
  console.log(`     Asientos únicos: ${asientos2025Unicos}`);
  console.log(`     Total Debe/Haber: €${(totalDebe2025 / 1000000).toFixed(1)}M`);
  console.log('');
  console.log('  📊 PERIODO 2026 (Enero - Febrero):');
  console.log(`     Líneas contables: ${asientos2026.length}`);
  console.log(`     Asientos únicos: ${asientos2026Unicos}`);
  console.log(`     Total Debe/Haber: €${(totalDebe2026 / 1000).toFixed(1)}K`);
  console.log('');
  console.log('  📊 PLAN DE CUENTAS:');
  console.log(`     Total subcuentas: ${subcuentas.length}`);
  console.log(`     Inversiones financieras (25x): ${inversionesSubs.length}`);
  console.log(`     Proveedores (41x): ${proveedoresSubs.length}`);
  console.log('');
  console.log('  📊 CLIENTES INTRAGRUPO:');
  for (const [sub, info] of clientesSubs) {
    console.log(`     ${info.titulo.padEnd(40)} D:€${info.debe.toFixed(0).padStart(8)} H:€${info.haber.toFixed(0).padStart(8)}`);
  }
  console.log('');
  console.log('  📊 TOP INGRESOS:');
  Array.from(ingresosSubs.entries())
    .sort((a, b) => b[1].haber - a[1].haber)
    .slice(0, 8)
    .forEach(([sub, info]) => {
      console.log(`     ${info.titulo.substring(0, 55).padEnd(55)} €${info.haber.toFixed(0).padStart(10)}`);
    });
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
