/**
 * Import Contabilidad de VIRODA INVERSIONES S.L.U. desde los XLSX del Diario General
 * 
 * Viroda es la filial de inversiones inmobiliarias residenciales del grupo Vidaro.
 * Portfolio: Manuel Silvela 5 (14 unidades), Reina 15 Residencial (10 viviendas),
 * Candelaria Mora 12-14 (6 viviendas), Hernández de Tejada 6 (garajes a Rovida),
 * Menéndez Pelayo (2 viviendas, Palencia).
 * 
 * Archivos fuente:
 *   - data/viroda/diario_general_2025.xlsx (Ene-Dic 2025, ~14.880 líneas, 3.169 asientos, €37.7M)
 *   - data/viroda/diario_general_2026.xlsx (Ene-Feb 2026, ~1.420 líneas, 450 asientos, €463K)
 *   - data/viroda/indice_subcuentas.xlsx (Plan de Cuentas, 1.534 subcuentas)
 * 
 * Uso: npx tsx scripts/import-viroda-contabilidad.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// CLASIFICACIÓN
// ============================================================================

function classifySubcuenta(subcuenta: string, titulo: string, debe: number, haber: number): {
  tipo: 'ingreso' | 'gasto';
  categoria: string;
} {
  const sub = String(subcuenta);
  const tit = (titulo || '').toLowerCase();
  
  if (sub.startsWith('7')) {
    if (tit.includes('arrend') || tit.includes('alquiler')) {
      if (tit.includes('silvela')) return { tipo: 'ingreso', categoria: 'ingreso_renta_silvela' };
      if (tit.includes('reina')) return { tipo: 'ingreso', categoria: 'ingreso_renta_reina' };
      if (tit.includes('candelaria') || tit.includes('mora')) return { tipo: 'ingreso', categoria: 'ingreso_renta_candelaria' };
      if (tit.includes('pelayo')) return { tipo: 'ingreso', categoria: 'ingreso_renta_pelayo' };
      if (tit.includes('tejada') || tit.includes('hernández')) return { tipo: 'ingreso', categoria: 'ingreso_renta_tejada' };
      return { tipo: 'ingreso', categoria: 'ingreso_renta' };
    }
    if (tit.includes('inter')) return { tipo: 'ingreso', categoria: 'ingreso_intereses' };
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }
  
  if (sub.startsWith('6')) {
    if (tit.includes('arrend')) return { tipo: 'gasto', categoria: 'gasto_arrendamiento' };
    if (tit.includes('comunidad') || tit.includes('cdad') || tit.includes('cuota')) return { tipo: 'gasto', categoria: 'gasto_comunidad' };
    if (tit.includes('seguro') || tit.includes('prima')) return { tipo: 'gasto', categoria: 'gasto_seguro' };
    if (tit.includes('impuesto') || tit.includes('ibi') || tit.includes('basura') || tit.includes('tasa')) return { tipo: 'gasto', categoria: 'gasto_impuesto' };
    if (tit.includes('mantenimiento') || tit.includes('reparac') || tit.includes('limpieza') || tit.includes('ascensor')) return { tipo: 'gasto', categoria: 'gasto_mantenimiento' };
    if (tit.includes('luz') || tit.includes('agua') || tit.includes('gas') || tit.includes('suministro') || tit.includes('electricidad')) return { tipo: 'gasto', categoria: 'gasto_suministros' };
    if (tit.includes('amortiz') || tit.includes('dotac')) return { tipo: 'gasto', categoria: 'gasto_amortizacion' };
    if (tit.includes('profesional') || tit.includes('asesor') || tit.includes('gestor') || tit.includes('abogado')) return { tipo: 'gasto', categoria: 'gasto_profesionales' };
    if (tit.includes('sueldo') || tit.includes('salario') || tit.includes('seguridad social')) return { tipo: 'gasto', categoria: 'gasto_personal' };
    if (tit.includes('intragrupo') || tit.includes('vidaro')) return { tipo: 'gasto', categoria: 'gasto_intragrupo' };
    return { tipo: 'gasto', categoria: 'gasto_otro' };
  }
  
  if (haber > 0 && debe === 0) return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  return { tipo: 'gasto', categoria: 'gasto_otro' };
}

// ============================================================================
// PARSEO
// ============================================================================

interface AsientoEntry {
  asiento: number; apunte: number; fecha: Date; factura: string;
  subcuenta: string; titulo: string; concepto: string; referencia: string;
  debe: number; haber: number; periodo: string;
}

function parseXlsx(xlsxPath: string, periodo: string, defaultYear: string): AsientoEntry[] {
  console.log(`\nLeyendo: ${xlsxPath}`);
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  console.log(`  Filas: ${data.length}, Periodo: ${data[1] ? String(data[1][0] || '').trim() : 'N/A'}`);

  const entries: AsientoEntry[] = [];
  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0] || String(row[0]).trim() === '') continue;
    const asientoNum = Number(row[0]);
    if (isNaN(asientoNum)) continue;

    let fecha: Date;
    if (typeof row[2] === 'number') fecha = new Date((row[2] - 25569) * 86400 * 1000);
    else if (row[2] instanceof Date) fecha = row[2];
    else fecha = new Date(`${defaultYear}-01-01`);
    if (isNaN(fecha.getTime())) fecha = new Date(`${defaultYear}-01-01`);

    entries.push({
      asiento: asientoNum, apunte: Number(row[1]) || 0, fecha,
      factura: String(row[3] || ''), subcuenta: String(row[5] || ''),
      titulo: String(row[6] || ''), concepto: String(row[8] || ''),
      referencia: String(row[9] || ''), debe: Number(row[10]) || 0,
      haber: Number(row[11]) || 0, periodo,
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
  console.log('  IMPORTAR CONTABILIDAD VIRODA INVERSIONES S.L.U.');
  console.log('  Diarios Generales 2025 + 2026');
  console.log('====================================================================\n');

  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
  });
  if (!viroda) { console.error('Empresa Viroda no encontrada'); process.exit(1); }
  console.log(`Empresa: ${viroda.nombre} (${viroda.id})`);

  const user = await prisma.user.findUnique({
    where: { email: 'dvillagra@vidaroinversiones.com' },
  });
  if (!user) { console.error('Usuario no encontrado'); process.exit(1); }

  const basePath = path.resolve(__dirname, '../data/viroda');
  const asientos2025 = parseXlsx(path.join(basePath, 'diario_general_2025.xlsx'), '2025', '2025');
  const asientos2026 = parseXlsx(path.join(basePath, 'diario_general_2026.xlsx'), '2026', '2026');
  const allAsientos = [...asientos2025, ...asientos2026];
  console.log(`\nTotal líneas combinadas: ${allAsientos.length}`);

  // Agrupar
  const asientoGroups = new Map<string, AsientoEntry[]>();
  for (const a of allAsientos) {
    const key = `${a.periodo}-${a.asiento}`;
    if (!asientoGroups.has(key)) asientoGroups.set(key, []);
    asientoGroups.get(key)!.push(a);
  }
  console.log(`Asientos únicos: ${asientoGroups.size}`);

  // Eliminar previas
  const deleted = await prisma.accountingTransaction.deleteMany({ where: { companyId: viroda.id } });
  console.log(`Transacciones previas eliminadas: ${deleted.count}`);

  // Crear transacciones
  let created = 0, errors = 0;
  const transactions: any[] = [];
  for (const [key, entries] of asientoGroups) {
    const first = entries[0];
    const totalDebe = entries.reduce((s, e) => s + e.debe, 0);
    const totalHaber = entries.reduce((s, e) => s + e.haber, 0);
    const monto = Math.max(totalDebe, totalHaber);
    if (monto === 0) continue;
    
    // Buscar la subcuenta de grupo 6 o 7 en TODOS los apuntes para clasificar correctamente
    // (el primer apunte suele ser una cuenta de balance, no la de PyG)
    const pygEntry = entries.find(e => String(e.subcuenta).startsWith('7')) 
                  || entries.find(e => String(e.subcuenta).startsWith('6'))
                  || first;
    const { tipo, categoria } = classifySubcuenta(pygEntry.subcuenta, pygEntry.titulo, totalDebe, totalHaber);
    const concepto = first.concepto || pygEntry.titulo || first.titulo || `Asiento ${first.asiento}`;
    const subs = [...new Set(entries.map(e => `${e.subcuenta} (${e.titulo})`))];
    
    transactions.push({
      companyId: viroda.id, tipo, categoria,
      concepto: concepto.substring(0, 500),
      monto: Math.round(monto * 100) / 100,
      fecha: first.fecha,
      referencia: `${first.periodo}-AS-${first.asiento}${first.factura ? ' / ' + first.factura : ''}`,
      notas: `Periodo: ${first.periodo}. Subcuentas: ${subs.slice(0, 3).join('; ')}${subs.length > 3 ? ` (+${subs.length - 3} más)` : ''}. Debe: ${totalDebe.toFixed(2)}, Haber: ${totalHaber.toFixed(2)}`,
    });
  }

  for (let i = 0; i < transactions.length; i += 100) {
    const batch = transactions.slice(i, i + 100);
    try {
      await prisma.accountingTransaction.createMany({ data: batch });
      created += batch.length;
    } catch (err: any) { console.error(`Error batch ${i}: ${err.message}`); errors += batch.length; }
  }

  // Estadísticas
  const td25 = asientos2025.reduce((s, a) => s + a.debe, 0);
  const td26 = asientos2026.reduce((s, a) => s + a.debe, 0);
  const au25 = new Set(asientos2025.map(a => a.asiento)).size;
  const au26 = new Set(asientos2026.map(a => a.asiento)).size;

  const tenants = new Map<string, { titulo: string; debe: number; haber: number }>();
  const ingresos = new Map<string, { titulo: string; haber: number }>();
  for (const a of allAsientos) {
    if (a.subcuenta.startsWith('43')) {
      if (!tenants.has(a.subcuenta)) tenants.set(a.subcuenta, { titulo: a.titulo, debe: 0, haber: 0 });
      const t = tenants.get(a.subcuenta)!; t.debe += a.debe; t.haber += a.haber;
    }
    if (a.subcuenta.startsWith('75')) {
      if (!ingresos.has(a.subcuenta)) ingresos.set(a.subcuenta, { titulo: a.titulo, haber: 0 });
      ingresos.get(a.subcuenta)!.haber += a.haber;
    }
  }

  // DocumentImportBatch
  await prisma.documentImportBatch.create({
    data: {
      companyId: viroda.id, userId: user.id,
      name: 'Contabilidad Viroda Inversiones - Diarios 2025 + 2026',
      description: `Importación Viroda. 2025: ${asientos2025.length} líneas, ${au25} asientos, €${(td25/1e6).toFixed(1)}M. 2026: ${asientos2026.length} líneas, ${au26} asientos, €${(td26/1e3).toFixed(0)}K. ${created} transacciones.`,
      totalFiles: 2, processedFiles: 2, successfulFiles: 2, failedFiles: 0,
      status: 'approved', progress: 100, autoApprove: true,
      extractedEntities: {
        totalLineas: allAsientos.length,
        asientosUnicos: asientoGroups.size,
        transaccionesCreadas: created,
        inquilinosUnicos: tenants.size,
        periodo2025: { lineas: asientos2025.length, asientos: au25, totalDebe: td25, periodoInicio: '2025-01-01', periodoFin: '2025-12-31' },
        periodo2026: { lineas: asientos2026.length, asientos: au26, totalDebe: td26, periodoInicio: '2026-01-01', periodoFin: '2026-02-09' },
        topInquilinos: Array.from(tenants.entries()).sort((a, b) => b[1].debe - a[1].debe).slice(0, 15)
          .map(([s, i]) => ({ subcuenta: s, titulo: i.titulo, totalDebe: Math.round(i.debe), totalHaber: Math.round(i.haber) })),
        topIngresos: Array.from(ingresos.entries()).sort((a, b) => b[1].haber - a[1].haber).slice(0, 15)
          .map(([s, i]) => ({ subcuenta: s, titulo: i.titulo, totalHaber: Math.round(i.haber) })),
      },
      startedAt: new Date(), completedAt: new Date(),
    },
  });

  // Resumen
  console.log('\n====================================================================');
  console.log('  IMPORTACIÓN COMPLETADA - VIRODA INVERSIONES S.L.U.');
  console.log('====================================================================');
  console.log(`  2025: ${asientos2025.length} líneas, ${au25} asientos, €${(td25/1e6).toFixed(1)}M`);
  console.log(`  2026: ${asientos2026.length} líneas, ${au26} asientos, €${(td26/1e3).toFixed(0)}K`);
  console.log(`  Transacciones: ${created} | Inquilinos: ${tenants.size}`);
  console.log('\n  TOP INGRESOS POR INMUEBLE:');
  Array.from(ingresos.entries()).sort((a, b) => b[1].haber - a[1].haber).slice(0, 12)
    .forEach(([, i]) => console.log(`     ${i.titulo.substring(0, 55).padEnd(55)} €${i.haber.toFixed(0).padStart(8)}`));
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error('Error:', e); await prisma.$disconnect(); process.exit(1); });
