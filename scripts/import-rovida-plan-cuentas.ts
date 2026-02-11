/**
 * Import Índice de Subcuentas de Rovida S.L.
 * 
 * Lee el archivo XLSX del Plan de Cuentas y almacena la estructura
 * como referencia para el AI Document Assistant y los módulos de contabilidad.
 * 
 * El Índice de Subcuentas contiene 1.571 subcuentas organizadas por grupo:
 *   Grupo 1: Financiación Básica (Capital, Reservas, Deudas LP) - 199 subcuentas
 *   Grupo 2: Activo No Corriente (Inmovilizado, Inversiones) - 183 subcuentas
 *   Grupo 4: Acreedores/Deudores (Clientes, Proveedores, Hacienda) - 641 subcuentas
 *   Grupo 5: Cuentas Financieras (Bancos, Inversiones CP) - 13 subcuentas
 *   Grupo 6: Gastos - 451 subcuentas
 *   Grupo 7: Ingresos - 84 subcuentas
 * 
 * Archivo fuente: data/rovida/indice_subcuentas.xlsx
 * 
 * Uso: npx tsx scripts/import-rovida-plan-cuentas.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// PARSING
// ============================================================================

interface Subcuenta {
  codigo: string;
  titulo: string;
  grupo: string;
  cuentaIVA: string;
  tipoIVA: string;
}

function parseSubcuentas(xlsxPath: string): Subcuenta[] {
  console.log(`Leyendo: ${xlsxPath}`);
  
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  
  console.log(`  Filas totales: ${data.length}`);

  const subcuentas: Subcuenta[] = [];
  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    subcuentas.push({
      codigo: String(row[0]),
      titulo: String(row[1] || '').trim(),
      grupo: String(row[2] || '').trim(),
      cuentaIVA: String(row[3] || '').trim(),
      tipoIVA: String(row[4] || '').trim(),
    });
  }

  console.log(`  Subcuentas parseadas: ${subcuentas.length}`);
  return subcuentas;
}

// ============================================================================
// CLASIFICACIÓN INTELIGENTE
// ============================================================================

function classifySubcuenta(s: Subcuenta): {
  grupoContable: string;
  tipoInmueble: string | null;
  ubicacion: string | null;
} {
  const cod = s.codigo;
  const tit = s.titulo.toLowerCase();
  
  // Grupo contable
  const grupoMap: Record<string, string> = {
    '1': 'financiacion_basica',
    '2': 'activo_no_corriente',
    '3': 'existencias',
    '4': 'acreedores_deudores',
    '5': 'cuentas_financieras',
    '6': 'gastos',
    '7': 'ingresos',
  };
  const grupoContable = grupoMap[cod[0]] || 'otro';
  
  // Tipo de inmueble
  let tipoInmueble: string | null = null;
  if (tit.includes('garaje') || tit.includes('plaza')) tipoInmueble = 'garaje';
  else if (tit.includes('local')) tipoInmueble = 'local';
  else if (tit.includes('nave')) tipoInmueble = 'nave';
  else if (tit.includes('oficina') || tit.includes('europa')) tipoInmueble = 'oficina';
  else if (tit.includes('edificio') || tit.includes('piamonte')) tipoInmueble = 'edificio';
  else if (tit.includes('gemelos') || tit.includes('apartamento') || tit.includes('piso')) tipoInmueble = 'vivienda';
  else if (tit.includes('finca') || tit.includes('terreno') || tit.includes('grijota')) tipoInmueble = 'terreno';
  else if (tit.includes('tomillar') || tit.includes('nagüelles')) tipoInmueble = 'vivienda';
  else if (tit.includes('constitución') || tit.includes('constitucion')) tipoInmueble = 'local';
  else if (tit.includes('prado')) tipoInmueble = 'local';
  else if (tit.includes('barquillo')) tipoInmueble = 'local';
  else if (tit.includes('reina')) tipoInmueble = 'local';
  else if (tit.includes('magaz') || tit.includes('castillo')) tipoInmueble = 'vivienda';
  
  // Ubicación
  let ubicacion: string | null = null;
  if (tit.includes('madrid') || tit.includes('espronceda') || tit.includes('barquillo') || tit.includes('reina') || tit.includes('piamonte') || tit.includes('europa') || tit.includes('prado') || tit.includes('tejada')) ubicacion = 'madrid';
  else if (tit.includes('palencia') || tit.includes('pelayo') || tit.includes('cuba') || tit.includes('grijota')) ubicacion = 'palencia';
  else if (tit.includes('valladolid') || tit.includes('constitución') || tit.includes('constitucion') || tit.includes('metal') || tit.includes('argales')) ubicacion = 'valladolid';
  else if (tit.includes('benidorm') || tit.includes('gemelos')) ubicacion = 'benidorm';
  else if (tit.includes('nagüelles') || tit.includes('tomillar') || tit.includes('marbella')) ubicacion = 'marbella';
  else if (tit.includes('magaz') || tit.includes('castillo')) ubicacion = 'magaz_palencia';
  
  return { grupoContable, tipoInmueble, ubicacion };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('====================================================================');
  console.log('  IMPORTAR ÍNDICE DE SUBCUENTAS - ROVIDA S.L.');
  console.log('====================================================================\n');

  // 1. Buscar empresa Rovida
  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  if (!rovida) { console.error('Empresa Rovida no encontrada'); process.exit(1); }
  console.log(`Empresa: ${rovida.nombre} (${rovida.id})`);

  // 2. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: 'dvillagra@vidaroinversiones.com' },
  });
  if (!user) { console.error('Usuario dvillagra no encontrado'); process.exit(1); }

  // 3. Leer XLSX
  const xlsxPath = path.resolve(__dirname, '../data/rovida/indice_subcuentas.xlsx');
  const subcuentas = parseSubcuentas(xlsxPath);

  // 4. Clasificar y agrupar
  const groups: Record<string, number> = {};
  const inmuebleTypes: Record<string, number> = {};
  const ubicaciones: Record<string, number> = {};
  
  // Subcuentas clave para referencia
  const inquilinos = subcuentas.filter(s => s.codigo.startsWith('430'));
  const efectosCobrar = subcuentas.filter(s => s.codigo.startsWith('431'));
  const proveedores = subcuentas.filter(s => s.codigo.startsWith('41'));
  const fianzas = subcuentas.filter(s => s.codigo.startsWith('18'));
  const ingresosArrend = subcuentas.filter(s => s.codigo.startsWith('752'));
  const gastosComunidad = subcuentas.filter(s => s.codigo.startsWith('622'));
  const gastosSeguros = subcuentas.filter(s => s.codigo.startsWith('625'));
  const gastosIBI = subcuentas.filter(s => s.codigo.startsWith('631'));
  const amortizaciones = subcuentas.filter(s => s.codigo.startsWith('681'));
  
  for (const s of subcuentas) {
    const { grupoContable, tipoInmueble, ubicacion } = classifySubcuenta(s);
    groups[grupoContable] = (groups[grupoContable] || 0) + 1;
    if (tipoInmueble) inmuebleTypes[tipoInmueble] = (inmuebleTypes[tipoInmueble] || 0) + 1;
    if (ubicacion) ubicaciones[ubicacion] = (ubicaciones[ubicacion] || 0) + 1;
  }

  // 5. Crear DocumentImportBatch con toda la información
  const batch = await prisma.documentImportBatch.create({
    data: {
      companyId: rovida.id,
      userId: user.id,
      name: 'Rovida S.L. - Índice de Subcuentas (Plan de Cuentas)',
      description: `Plan General Contable de Rovida S.L. con ${subcuentas.length} subcuentas. Incluye ${inquilinos.length} clientes/inquilinos, ${proveedores.length} proveedores, ${fianzas.length} fianzas, ${ingresosArrend.length} subcuentas de ingresos por arrendamiento, ${amortizaciones.length} amortizaciones de inmuebles.`,
      totalFiles: 1,
      processedFiles: 1,
      successfulFiles: 1,
      failedFiles: 0,
      status: 'approved',
      progress: 100,
      autoApprove: true,
      extractedEntities: {
        totalSubcuentas: subcuentas.length,
        
        // Distribución por grupo
        gruposContables: groups,
        
        // Inmuebles por tipo
        inmueblesPorTipo: inmuebleTypes,
        
        // Ubicaciones
        ubicaciones,
        
        // Resumen de clientes/inquilinos
        inquilinos: {
          total: inquilinos.length,
          efectosCobrar: efectosCobrar.length,
          localesOficinas: inquilinos.filter(s => s.codigo.startsWith('4300000')).length,
          garajesEspronceda: inquilinos.filter(s => s.codigo.startsWith('4300002')).length,
          garajesPalenciaValladolid: inquilinos.filter(s => s.codigo.startsWith('4300003')).length,
          lista: inquilinos.map(s => ({ codigo: s.codigo, nombre: s.titulo })),
        },
        
        // Proveedores
        proveedores: {
          total: proveedores.length,
          lista: proveedores.map(s => ({ codigo: s.codigo, nombre: s.titulo })),
        },
        
        // Fianzas (detalle de plazas)
        fianzas: {
          total: fianzas.length,
          espronceda: fianzas.filter(s => s.titulo.toLowerCase().includes('espronceda')).length,
          menendezPelayo: fianzas.filter(s => s.titulo.toLowerCase().includes('pelayo')).length,
          hernandezTejada: fianzas.filter(s => s.titulo.toLowerCase().includes('tejada')).length,
          constitucion: fianzas.filter(s => s.titulo.toLowerCase().includes('constitución') || s.titulo.toLowerCase().includes('constitucion')).length,
          otros: fianzas.filter(s => 
            !s.titulo.toLowerCase().includes('espronceda') && 
            !s.titulo.toLowerCase().includes('pelayo') &&
            !s.titulo.toLowerCase().includes('tejada') &&
            !s.titulo.toLowerCase().includes('constitución') &&
            !s.titulo.toLowerCase().includes('constitucion')
          ).length,
        },
        
        // Subcuentas de ingreso por arrendamiento
        ingresosArrendamiento: {
          total: ingresosArrend.length,
          lista: ingresosArrend.map(s => ({ codigo: s.codigo, descripcion: s.titulo })),
        },
        
        // Gastos por categoría
        gastos: {
          comunidad: gastosComunidad.length,
          seguros: gastosSeguros.length,
          ibi: gastosIBI.length,
          amortizaciones: amortizaciones.length,
        },
      },
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
  console.log(`\nDocumentImportBatch creado: ${batch.id}`);

  // 6. Resumen
  console.log('\n====================================================================');
  console.log('  ÍNDICE DE SUBCUENTAS IMPORTADO');
  console.log('====================================================================');
  console.log(`  Total subcuentas: ${subcuentas.length}`);
  console.log('');
  console.log('  📊 Distribución por grupo:');
  for (const [g, n] of Object.entries(groups).sort()) {
    console.log(`     ${g.padEnd(25)} ${String(n).padStart(4)}`);
  }
  console.log('');
  console.log('  🏢 Clientes/Inquilinos:');
  console.log(`     Locales/Oficinas (4300000xxx): ${inquilinos.filter(s => s.codigo.startsWith('4300000')).length}`);
  console.log(`     Garajes Espronceda (4300002xxx): ${inquilinos.filter(s => s.codigo.startsWith('4300002')).length}`);
  console.log(`     Garajes Palencia/Valladolid (4300003xxx): ${inquilinos.filter(s => s.codigo.startsWith('4300003')).length}`);
  console.log(`     Efectos a cobrar (431xxx): ${efectosCobrar.length}`);
  console.log('');
  console.log('  🏠 Inmuebles por tipo:');
  for (const [t, n] of Object.entries(inmuebleTypes).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${t.padEnd(15)} ${String(n).padStart(4)}`);
  }
  console.log('');
  console.log('  📍 Ubicaciones:');
  for (const [u, n] of Object.entries(ubicaciones).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${u.padEnd(20)} ${String(n).padStart(4)}`);
  }
  console.log('');
  console.log('  🔑 Fianzas registradas:');
  console.log(`     Espronceda: ${fianzas.filter(s => s.titulo.toLowerCase().includes('espronceda')).length}`);
  console.log(`     Menéndez Pelayo: ${fianzas.filter(s => s.titulo.toLowerCase().includes('pelayo')).length}`);
  console.log(`     Hernández de Tejada: ${fianzas.filter(s => s.titulo.toLowerCase().includes('tejada')).length}`);
  console.log(`     Total: ${fianzas.length}`);
  console.log('');
  console.log('  💰 Subcuentas de ingresos por arrendamiento: ' + ingresosArrend.length);
  console.log('  📄 Proveedores/Acreedores: ' + proveedores.length);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
