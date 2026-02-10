/**
 * Script: Corregir datos de Viroda Inversiones tras auditoría
 * 
 * Correcciones identificadas:
 * 1. Añadir unidad garaje en Marbella (Camilo José Cela)
 * 2. Corregir tipo de edificio Menéndez Pelayo → residencial
 * 3. Corregir tipo de edificio Reina → residencial (para Viroda)
 * 4. Eliminar inquilinos demo y añadir los reales de contabilidad
 * 5. Reimportar contabilidad completa (12.068 asientos)
 * 6. Enlazar documentos Google Drive (contabilidad, seguros, contratos)
 * 
 * Uso: npx tsx scripts/fix-viroda-audit.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Inquilinos REALES de Viroda (subcuentas 43000xxxxx, sin duplicados 431x/436x)
const VIRODA_TENANTS = [
  { nombre: 'Pilates Lab S.L.', sub: '4300000001', grupo: 'silvela' },
  { nombre: 'Sandra Mazoy Sánchez', sub: '4300000004', grupo: 'silvela' },
  { nombre: 'María Sanz Ruiz', sub: '4300000005', grupo: 'silvela' },
  { nombre: 'Antonio Álvarez Cañibano', sub: '4300000008', grupo: 'silvela' },
  { nombre: 'Jorge Andújar Hernández', sub: '4300000011', grupo: 'silvela' },
  { nombre: 'Maria Luisa Maestro de las Casas', sub: '4300000015', grupo: 'silvela' },
  { nombre: 'Sofia Lazaro Mozo', sub: '4300000016', grupo: 'silvela' },
  { nombre: 'Tommaso Landi', sub: '4300000017', grupo: 'silvela' },
  { nombre: 'Beatriz Ballesteros Gadea', sub: '4300000023', grupo: 'silvela' },
  { nombre: 'Ana Camila Chavez Castañeda', sub: '4300000025', grupo: 'silvela' },
  { nombre: 'Iria Melendez Perez', sub: '4300002000', grupo: 'reina' },
  { nombre: 'Carlos Espin Hidalgo', sub: '4300002002', grupo: 'reina' },
  { nombre: 'Dagoberto Martinez Alvarez', sub: '4300002004', grupo: 'reina' },
  { nombre: 'Daniel Cuesta Villegas', sub: '4300002006', grupo: 'reina' },
  { nombre: 'Maria Jose Nava Sacristan', sub: '4300002007', grupo: 'reina' },
  { nombre: 'Jiaxiang Zhang', sub: '4300002008', grupo: 'reina' },
  { nombre: 'Salvador David Minguez Baena', sub: '4300002011', grupo: 'reina' },
  { nombre: 'AMERICAN TOWER ESPAÑA SLU', sub: '4300002013', grupo: 'silvela' },
  { nombre: 'Coraline Roxane Collet', sub: '4300002014', grupo: 'reina' },
  { nombre: 'Violeta Atkinson', sub: '4300002025', grupo: 'reina' },
  { nombre: 'Sofía Olegovna Goldakova', sub: '4300002031', grupo: 'reina' },
  { nombre: 'Sandra González Alonso', sub: '4300002032', grupo: 'reina' },
  { nombre: 'Tomás Cortina Campo', sub: '4300002037', grupo: 'candelaria' },
  { nombre: 'Yazmine Alaoui Smaili', sub: '4300002039', grupo: 'candelaria' },
  { nombre: 'Camille Dams', sub: '4300002040', grupo: 'candelaria' },
  { nombre: 'Domenico Arena', sub: '4300002041', grupo: 'candelaria' },
  { nombre: 'Veronika Chernetsova', sub: '4300002042', grupo: 'candelaria' },
  { nombre: 'Vittorio Murdaca', sub: '4300002044', grupo: 'candelaria' },
  { nombre: 'Joel Boroff', sub: '4300002045', grupo: 'candelaria' },
  { nombre: 'Ella María Tahan', sub: '4300002046', grupo: 'candelaria' },
  { nombre: 'Daniel Falkenhain López', sub: '4300002047', grupo: 'candelaria' },
  { nombre: 'David Achar Haiat', sub: '4300002048', grupo: 'candelaria' },
  { nombre: 'Marjorie Marie Emmanuel Colas', sub: '4300002049', grupo: 'hernandez' },
  { nombre: 'Khaled Mohammad Feras Bader', sub: '4300002050', grupo: 'hernandez' },
  { nombre: 'Patricia Pérez Fernández', sub: '4300002051', grupo: 'hernandez' },
  { nombre: 'Annie Yumi Joh Lee', sub: '4300002052', grupo: 'hernandez' },
  { nombre: 'Francisco José Batista Hernández', sub: '4300002053', grupo: 'hernandez' },
  { nombre: 'Secundino Ntutumu Mba Ncham', sub: '4300002054', grupo: 'hernandez' },
  { nombre: 'Maria Fernanda del Valle Álvarez', sub: '4300002055', grupo: 'hernandez' },
  { nombre: 'Séléna Emmanuelle Jeanne Bost', sub: '4300002056', grupo: 'hernandez' },
  { nombre: 'Julian Abou-Jaoude', sub: '4300002057', grupo: 'hernandez' },
  { nombre: 'Ana Marisa Honold', sub: '4300002058', grupo: 'hernandez' },
  { nombre: 'DODICI GROUP SRL', sub: '4300002059', grupo: 'hernandez' },
  { nombre: 'Roams Tic, SL', sub: '4300002060', grupo: 'silvela' },
  { nombre: 'María Llanos Corominas Clemente', sub: '4300002061', grupo: 'reina' },
  { nombre: 'Claudio Enrique Ortiz Ortiz', sub: '4300002062', grupo: 'reina' },
  { nombre: 'Natalia Arana', sub: '4300002063', grupo: 'reina' },
  { nombre: 'Michael William Roberts', sub: '4300002064', grupo: 'reina' },
  { nombre: 'Michael Anthony Duffer Ramos-Lynch', sub: '4300002065', grupo: 'reina' },
  { nombre: 'Ryan Alexander Arias Delafosse', sub: '4300002067', grupo: 'reina' },
  { nombre: 'Daniela Alba Bajatta', sub: '4300002068', grupo: 'reina' },
  { nombre: 'Emma Arango Lago', sub: '4300002069', grupo: 'reina' },
  { nombre: 'Federico Pensado', sub: '4300002070', grupo: 'reina' },
  { nombre: 'Jean Claude Khoury', sub: '4300002071', grupo: 'reina' },
  { nombre: 'Dan Sholomo Sheena', sub: '4300002072', grupo: 'reina' },
  { nombre: 'Antonio Dominguez Machuca', sub: '4300002073', grupo: 'candelaria' },
  { nombre: 'Andelija Dikic', sub: '4300002074', grupo: 'candelaria' },
  { nombre: 'Caterina Gilio', sub: '4300002075', grupo: 'candelaria' },
  { nombre: 'Jennifer Mary Lloyd', sub: '4300002076', grupo: 'candelaria' },
  { nombre: 'David Setton Katz', sub: '4300002077', grupo: 'candelaria' },
  { nombre: 'Dylan Marco Becker', sub: '4300002078', grupo: 'candelaria' },
  { nombre: 'Rodrigo Flores Rosas', sub: '4300002079', grupo: 'reina' },
  { nombre: 'Giovanni Innamorato', sub: '4300002080', grupo: 'reina' },
  { nombre: 'David Villagrá Blanco', sub: '4300002081', grupo: 'reina' },
  { nombre: 'Lisbeth Esther Rodriguez Rivera', sub: '4300002082', grupo: 'reina' },
  { nombre: 'Raya Atanasova Radeva', sub: '4300002083', grupo: 'reina' },
  { nombre: 'Isaac Garza Coindreau', sub: '4300002084', grupo: 'reina' },
  { nombre: 'Vincent Leo Gotthelf', sub: '4300002085', grupo: 'reina' },
  { nombre: 'Josephine Marie Zélie Lourme', sub: '4300002086', grupo: 'reina' },
  { nombre: 'Charles Etienne Bernard Massy', sub: '4300002087', grupo: 'reina' },
  { nombre: 'Maximilian Wiesbacher', sub: '4300002088', grupo: 'reina' },
  { nombre: 'Gabriel Assouline', sub: '4300002089', grupo: 'reina' },
  { nombre: 'Valentina Gomez Leataud', sub: '4300002090', grupo: 'reina' },
  { nombre: 'Maria Fernanda Martinez Guerra', sub: '4300002091', grupo: 'reina' },
  { nombre: 'Lina Kayal', sub: '4300002092', grupo: 'reina' },
  { nombre: 'Maria Antonia Sanchez Giraldo', sub: '4300002093', grupo: 'reina' },
  { nombre: 'Niccolo Pipitone', sub: '4300002094', grupo: 'reina' },
  { nombre: 'HULUMA CONSULTING SOCIEDAD LIMITADA', sub: '4300002095', grupo: 'silvela' },
  { nombre: 'Marc Glawe', sub: '4300002096', grupo: 'reina' },
  { nombre: 'Yi Ding', sub: '4300002097', grupo: 'reina' },
  { nombre: 'Pedro Corbalan Tutau', sub: '4300002098', grupo: 'reina' },
];

async function main() {
  console.log('====================================================================');
  console.log('  CORRECCIONES VIRODA INVERSIONES - AUDITORÍA');
  console.log('====================================================================\n');

  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
  });
  if (!viroda) { console.error('Viroda no encontrada'); process.exit(1); }
  console.log(`Empresa: ${viroda.nombre} (${viroda.id})\n`);

  // ── 1. Corregir tipo edificios ──
  console.log('=== 1. CORREGIR TIPOS DE EDIFICIO ===');
  for (const fix of [
    { nombre: 'Menendez Pelayo', nuevoTipo: 'residencial' },
    { nombre: 'Reina', nuevoTipo: 'residencial' },
  ]) {
    const b = await prisma.building.findFirst({
      where: { companyId: viroda.id, nombre: { contains: fix.nombre, mode: 'insensitive' } },
    });
    if (b && b.tipo !== fix.nuevoTipo) {
      await prisma.building.update({ where: { id: b.id }, data: { tipo: fix.nuevoTipo as any } });
      console.log(`  ✅ ${b.nombre}: ${b.tipo} → ${fix.nuevoTipo}`);
    } else if (b) {
      console.log(`  ✅ ${b.nombre}: ya es ${b.tipo}`);
    }
  }

  // ── 2. Añadir garaje Marbella ──
  console.log('\n=== 2. AÑADIR GARAJE MARBELLA ===');
  const marbella = await prisma.building.findFirst({
    where: { companyId: viroda.id, nombre: { contains: 'Camilo', mode: 'insensitive' } },
  });
  if (marbella) {
    const existingGaraje = await prisma.unit.findFirst({
      where: { buildingId: marbella.id, numero: { contains: 'Garaje', mode: 'insensitive' } },
    });
    if (!existingGaraje) {
      await prisma.unit.create({
        data: {
          buildingId: marbella.id,
          numero: 'Garaje',
          tipo: 'garaje',
          estado: 'disponible',
          superficie: 15,
          rentaMensual: 80,
          planta: -1,
        },
      });
      await prisma.building.update({
        where: { id: marbella.id },
        data: { numeroUnidades: 2 },
      });
      console.log(`  ✅ Garaje añadido a ${marbella.nombre}`);
    } else {
      console.log(`  ✅ Garaje ya existe en ${marbella.nombre}`);
    }
  }

  // ── 3. Limpiar inquilinos demo y añadir reales ──
  console.log('\n=== 3. SINCRONIZAR INQUILINOS ===');
  
  // Contar demo
  const demoTenants = await prisma.tenant.count({
    where: { companyId: viroda.id, isDemo: true },
  });
  console.log(`  Inquilinos demo: ${demoTenants}`);

  // Eliminar inquilinos demo sin contratos activos
  if (demoTenants > 0) {
    const deleted = await prisma.tenant.deleteMany({
      where: {
        companyId: viroda.id,
        isDemo: true,
        contracts: { none: {} },
      },
    });
    console.log(`  Eliminados ${deleted.count} inquilinos demo sin contratos`);
  }

  // Añadir inquilinos reales que falten
  let added = 0;
  let existing = 0;
  for (const t of VIRODA_TENANTS) {
    const emailBase = t.nombre.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').substring(0, 40);
    const uniqueEmail = `${emailBase}.${t.sub.slice(-4)}@viroda-tenant.local`;
    const uniqueDni = `VIR-${t.sub.slice(-6)}`;

    const exists = await prisma.tenant.findFirst({
      where: {
        companyId: viroda.id,
        OR: [
          { nombreCompleto: t.nombre },
          { email: uniqueEmail },
          { dni: uniqueDni },
        ],
      },
    });

    if (exists) { existing++; continue; }

    try {
      await prisma.tenant.create({
        data: {
          companyId: viroda.id,
          nombreCompleto: t.nombre,
          email: uniqueEmail,
          telefono: '+34 000 000 000',
          dni: uniqueDni,
          fechaNacimiento: new Date('1985-01-01'),
          notas: `Subcuenta contable: ${t.sub}. Edificio: ${t.grupo}`,
        },
      });
      added++;
    } catch { existing++; }
  }
  console.log(`  Inquilinos añadidos: ${added}, ya existentes: ${existing}`);

  // ── 4. Reimportar contabilidad completa ──
  console.log('\n=== 4. REIMPORTAR CONTABILIDAD ===');
  const xlsxPath = process.env.XLSX_PATH || '/tmp/viroda_contabilidad.xlsx';
  
  try {
    const wb = XLSX.readFile(xlsxPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    const asientos: any[] = [];
    for (let i = 4; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0] || String(row[0]).trim() === '') continue;
      const num = Number(row[0]);
      if (isNaN(num)) continue;

      let fecha: Date;
      if (row[2] instanceof Date) fecha = row[2];
      else if (typeof row[2] === 'number') fecha = new Date((row[2] - 25569) * 86400 * 1000);
      else fecha = new Date(String(row[2] || '2025-01-01'));
      if (isNaN(fecha.getTime())) fecha = new Date('2025-01-01');

      asientos.push({ num, fecha, sub: String(row[5] || ''), titulo: String(row[6] || ''), concepto: String(row[8] || ''), debe: Number(row[10]) || 0, haber: Number(row[11]) || 0 });
    }

    // Agrupar por asiento
    const groups = new Map<number, typeof asientos>();
    for (const a of asientos) {
      if (!groups.has(a.num)) groups.set(a.num, []);
      groups.get(a.num)!.push(a);
    }

    // Eliminar transacciones anteriores
    const del = await prisma.accountingTransaction.deleteMany({ where: { companyId: viroda.id } });
    console.log(`  Anteriores eliminadas: ${del.count}`);

    // Clasificar y crear
    const txns: any[] = [];
    for (const [num, entries] of groups) {
      const first = entries[0];
      const totalDebe = entries.reduce((s, e) => s + e.debe, 0);
      const totalHaber = entries.reduce((s, e) => s + e.haber, 0);
      const monto = Math.max(totalDebe, totalHaber);
      if (monto === 0) continue;

      const sub = first.sub;
      let tipo: 'ingreso' | 'gasto' = 'gasto';
      let cat = 'gasto_otro';
      if (sub.startsWith('7')) { tipo = 'ingreso'; cat = first.titulo.toLowerCase().includes('alquiler') ? 'ingreso_renta' : 'ingreso_otro'; }
      else if (sub.startsWith('6')) {
        const t = first.titulo.toLowerCase();
        if (t.includes('seguro')) cat = 'gasto_seguro';
        else if (t.includes('impuesto') || t.includes('ibi')) cat = 'gasto_impuesto';
        else if (t.includes('mantenimiento') || t.includes('reparac')) cat = 'gasto_mantenimiento';
        else if (t.includes('comunidad')) cat = 'gasto_comunidad';
        else if (t.includes('servicio') || t.includes('suministro')) cat = 'gasto_servicio';
        else if (t.includes('administrac') || t.includes('gestoría')) cat = 'gasto_administracion';
      }
      else if (totalHaber > 0 && totalDebe === 0) { tipo = 'ingreso'; cat = 'ingreso_otro'; }

      txns.push({
        companyId: viroda.id,
        tipo, categoria: cat,
        concepto: (first.concepto || first.titulo || `Asiento ${num}`).substring(0, 500),
        monto: Math.round(monto * 100) / 100,
        fecha: first.fecha,
        referencia: `AS-${num}`,
        notas: `Subcuenta: ${first.sub} - ${first.titulo}`,
      });
    }

    let created = 0;
    for (let i = 0; i < txns.length; i += 100) {
      const batch = txns.slice(i, i + 100);
      await prisma.accountingTransaction.createMany({ data: batch });
      created += batch.length;
    }
    console.log(`  Transacciones creadas: ${created} (de ${asientos.length} asientos, ${groups.size} agrupados)`);
  } catch (err: any) {
    console.error(`  Error importando contabilidad: ${err.message}`);
  }

  // ── 5. Enlazar documentos Google Drive ──
  console.log('\n=== 5. ENLAZAR DOCUMENTOS GOOGLE DRIVE ===');

  // Crear carpetas
  let rootFolder = await prisma.documentFolder.findFirst({
    where: { companyId: viroda.id, nombre: 'Documentos Viroda', parentFolderId: null },
  });
  if (!rootFolder) {
    rootFolder = await prisma.documentFolder.create({
      data: { companyId: viroda.id, nombre: 'Documentos Viroda', descripcion: 'Documentación Viroda Inversiones S.L.U.', color: '#dc2626', icono: 'Building2' },
    });
  }

  const folders = [
    { nombre: 'Contabilidad Viroda', desc: 'Contabilidad y asientos', color: '#2563eb', icono: 'Calculator' },
    { nombre: 'Seguros Viroda', desc: 'Pólizas de seguros', color: '#dc2626', icono: 'Shield' },
    { nombre: 'Contratos Viroda', desc: 'Contratos de arrendamiento', color: '#16a34a', icono: 'FileText' },
  ];

  const folderIds: Record<string, string> = {};
  for (const f of folders) {
    let folder = await prisma.documentFolder.findFirst({
      where: { companyId: viroda.id, nombre: f.nombre, parentFolderId: rootFolder.id },
    });
    if (!folder) {
      folder = await prisma.documentFolder.create({
        data: { companyId: viroda.id, nombre: f.nombre, descripcion: f.desc, color: f.color, icono: f.icono, parentFolderId: rootFolder.id },
      });
      console.log(`  ✅ Carpeta creada: ${f.nombre}`);
    }
    folderIds[f.nombre] = folder.id;
  }

  const docs = [
    { nombre: 'Contabilidad Viroda - Diario General 2025', tipo: 'contabilidad', url: 'https://docs.google.com/spreadsheets/d/1WRWB6PvIXnyF3f8lSi5AWCqQXXYlHy1L/edit?usp=drive_link&ouid=108061909101070644079&rtpof=true&sd=true', folder: 'Contabilidad Viroda', tags: ['contabilidad', 'viroda', '2025', 'google-drive'] },
    { nombre: 'Seguros Viroda - Pólizas', tipo: 'seguro', url: 'https://drive.google.com/drive/folders/1tdvsqZ2d5lJZTx8bsMIY4Sk1BL0JGC8D?usp=drive_link', folder: 'Seguros Viroda', tags: ['seguros', 'viroda', 'polizas', 'google-drive'] },
    { nombre: 'Contratos Viroda - Carpeta Completa', tipo: 'contrato', url: 'https://drive.google.com/drive/folders/1W1ioURCrDBSrbfjwxJ6IvZoXCpzI5ghs?usp=drive_link', folder: 'Contratos Viroda', tags: ['contratos', 'viroda', 'arrendamiento', 'google-drive'] },
  ];

  const user = await prisma.user.findUnique({ where: { email: 'dvillagra@vidaroinversiones.com' } });

  for (const d of docs) {
    const exists = await prisma.document.findFirst({
      where: { cloudStoragePath: d.url, folderId: folderIds[d.folder] },
    });
    if (exists) { console.log(`  ✅ Ya existe: ${d.nombre}`); continue; }

    const doc = await prisma.document.create({
      data: {
        nombre: d.nombre,
        tipo: d.tipo as any,
        cloudStoragePath: d.url,
        tags: d.tags,
        folderId: folderIds[d.folder],
        descripcion: `Documento enlazado desde Google Drive para ${viroda.nombre}`,
      },
    });
    if (user) {
      await prisma.documentVersion.create({
        data: { documentId: doc.id, versionNumero: 1, cloud_storage_path: d.url, tamano: 0, uploadedBy: user.id, comentario: 'Enlace Google Drive' },
      });
    }
    console.log(`  📄 Registrado: ${d.nombre}`);
  }

  // ── RESUMEN ──
  const finalTenants = await prisma.tenant.count({ where: { companyId: viroda.id } });
  const finalInsurance = await prisma.insurance.count({ where: { companyId: viroda.id } });
  const finalContracts = await prisma.contract.count({ where: { unit: { building: { companyId: viroda.id } } } });
  const finalTxns = await prisma.accountingTransaction.count({ where: { companyId: viroda.id } });
  const finalDocs = await prisma.document.count({ where: { folder: { companyId: viroda.id } } });

  console.log('\n====================================================================');
  console.log('  VIRODA INVERSIONES - POST-AUDITORÍA');
  console.log('====================================================================');
  console.log(`  Inquilinos: ${finalTenants}`);
  console.log(`  Seguros: ${finalInsurance}`);
  console.log(`  Contratos: ${finalContracts}`);
  console.log(`  Transacciones contables: ${finalTxns}`);
  console.log(`  Documentos Google Drive: ${finalDocs}`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error('Error:', e); await prisma.$disconnect(); process.exit(1); });
