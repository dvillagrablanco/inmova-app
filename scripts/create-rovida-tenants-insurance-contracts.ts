/**
 * Script: Alta de inquilinos, seguros y contratos de Rovida S.L.
 * 
 * Datos extraídos de:
 * - Contabilidad: subcuentas 43x (clientes/inquilinos), 180x (fianzas), 625x (seguros)
 * - Contratos Google Drive: estructura de carpetas
 * - Seguros Google Drive: carpeta pólizas
 * 
 * Uso: npx tsx scripts/create-rovida-tenants-insurance-contracts.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// INQUILINOS extraídos de subcuentas 43x del Plan General Contable
// ============================================================================
// Código subcuenta → tipo de inmueble:
//   4300000xxx = locales/oficinas/edificios
//   4300002xxx = garajes Espronceda (Madrid)
//   4300003xxx = garajes Palencia / Valladolid

const TENANTS_DATA: Array<{
  nombre: string;
  tipo: 'persona' | 'empresa';
  subcuenta: string;
  // grupo indica a qué edificio se asocian
  grupo: 'locales_oficinas' | 'espronceda' | 'hernandez_tejada' | 'palencia_valladolid' | 'benidorm' | 'otro';
}> = [
  // ── LOCALES / OFICINAS / EDIFICIOS ──
  { nombre: 'NOMMAD SHOWROOM SL', tipo: 'empresa', subcuenta: '4300000034', grupo: 'locales_oficinas' },
  { nombre: 'PROJECTS BC 2016 SL', tipo: 'empresa', subcuenta: '4300000044', grupo: 'locales_oficinas' },
  { nombre: 'Grupo Ézaro Servicios Jurídicos, SLP', tipo: 'empresa', subcuenta: '4300000038', grupo: 'locales_oficinas' },
  { nombre: 'Patricia Viforcos Martínez', tipo: 'persona', subcuenta: '4300000039', grupo: 'locales_oficinas' },
  { nombre: 'The Stage Ventures S.L', tipo: 'empresa', subcuenta: '4300000041', grupo: 'locales_oficinas' },
  { nombre: 'Impulsa Hub Sur, S.L.', tipo: 'empresa', subcuenta: '4300000043', grupo: 'locales_oficinas' },
  { nombre: 'HIPER CH DISTRIBUCION SL', tipo: 'empresa', subcuenta: '4300000048', grupo: 'locales_oficinas' },
  { nombre: 'DOMUS CAPITAL SL', tipo: 'empresa', subcuenta: '4300000047', grupo: 'locales_oficinas' },
  { nombre: 'Red Hospitalaria Recoletas S.L', tipo: 'empresa', subcuenta: '4300000028', grupo: 'locales_oficinas' },
  { nombre: 'Audita2 Pradilla S.L.P', tipo: 'empresa', subcuenta: '4300000025', grupo: 'locales_oficinas' },
  { nombre: 'Maria Luisa Garcia-Nieto Alonso', tipo: 'persona', subcuenta: '4300000026', grupo: 'locales_oficinas' },
  { nombre: 'Ticmoveo SL', tipo: 'empresa', subcuenta: '4300000035', grupo: 'locales_oficinas' },
  { nombre: 'ANA MARÍA HERNÁNDEZ DE PAZ', tipo: 'persona', subcuenta: '4300000045', grupo: 'locales_oficinas' },
  { nombre: 'MARÍA DE LOS DOLORES CHICO GONZÁLEZ', tipo: 'persona', subcuenta: '4300000046', grupo: 'locales_oficinas' },
  { nombre: 'IGNACIO PÉREZ DEL VALLE', tipo: 'persona', subcuenta: '4300000049', grupo: 'locales_oficinas' },
  { nombre: 'IGNACIO NEVARES HERRERO', tipo: 'persona', subcuenta: '4300000050', grupo: 'locales_oficinas' },
  { nombre: 'MARIA MERCEDES VAZQUEZ CORTES', tipo: 'persona', subcuenta: '4300000051', grupo: 'locales_oficinas' },
  { nombre: 'ALMUDENA NOGUEIRA ABAD', tipo: 'persona', subcuenta: '4300000052', grupo: 'locales_oficinas' },
  { nombre: 'BELEN ALCALA SANTAELLA CHEN', tipo: 'persona', subcuenta: '4300000053', grupo: 'locales_oficinas' },
  { nombre: 'MARTA NOGUEIRA ABAD', tipo: 'persona', subcuenta: '4300000054', grupo: 'locales_oficinas' },
  { nombre: 'MARIA JESÚS SUANZES RODRÍGUEZ', tipo: 'persona', subcuenta: '4300000055', grupo: 'locales_oficinas' },
  { nombre: 'MAURICIO RAMÓN UBEDA SORIANO', tipo: 'persona', subcuenta: '4300000056', grupo: 'locales_oficinas' },
  // ── GARAJES ESPRONCEDA ──
  { nombre: 'Jesus Marco Lopez', tipo: 'persona', subcuenta: '4300002006', grupo: 'espronceda' },
  { nombre: 'Isaac Nuñez Aragoneses', tipo: 'persona', subcuenta: '4300002008', grupo: 'espronceda' },
  { nombre: 'Benovi 2008 SL', tipo: 'empresa', subcuenta: '4300002011', grupo: 'espronceda' },
  { nombre: 'Juan Pablo Garcia Fresnadillo', tipo: 'persona', subcuenta: '4300002012', grupo: 'espronceda' },
  { nombre: 'Angel Manuel Merino Palomar', tipo: 'persona', subcuenta: '4300002013', grupo: 'espronceda' },
  { nombre: 'Juan Bravo Diaz', tipo: 'persona', subcuenta: '4300002014', grupo: 'espronceda' },
  { nombre: 'Maria Pilar Martinez Donaire', tipo: 'persona', subcuenta: '4300002015', grupo: 'espronceda' },
  { nombre: 'Arabico SA', tipo: 'empresa', subcuenta: '4300002016', grupo: 'espronceda' },
  { nombre: 'Jose Elgarresta Ramirez de Haro', tipo: 'persona', subcuenta: '4300002023', grupo: 'espronceda' },
  { nombre: 'Carlos Sanchez-Horneros Calderon', tipo: 'persona', subcuenta: '4300002024', grupo: 'espronceda' },
  { nombre: 'Juan Antonio Balmaseda Mera', tipo: 'persona', subcuenta: '4300002025', grupo: 'espronceda' },
  { nombre: 'Natalia Zumarraga Eguidazu', tipo: 'persona', subcuenta: '4300002027', grupo: 'espronceda' },
  { nombre: 'PARUVI S.L', tipo: 'empresa', subcuenta: '4300002029', grupo: 'espronceda' },
  { nombre: 'Rafael Romero Rodriguez', tipo: 'persona', subcuenta: '4300002030', grupo: 'espronceda' },
  { nombre: 'Maria Ascension Medina Rojo', tipo: 'persona', subcuenta: '4300002033', grupo: 'espronceda' },
  { nombre: 'Alfonso José Vaamonde Messia de la Cerda', tipo: 'persona', subcuenta: '4300002034', grupo: 'espronceda' },
  { nombre: 'Laura Pesquera Serrano', tipo: 'persona', subcuenta: '4300002035', grupo: 'espronceda' },
  { nombre: 'COCONUT VENTURES, S.L.', tipo: 'empresa', subcuenta: '4300002036', grupo: 'espronceda' },
  { nombre: 'DISTRIBUCIÓN SUPERMERCADOS, SLU', tipo: 'empresa', subcuenta: '4300002037', grupo: 'espronceda' },
  { nombre: 'Maria Victoria Primo Salgado', tipo: 'persona', subcuenta: '4300002041', grupo: 'espronceda' },
  { nombre: 'Ignacio Maria Barrena Azorin', tipo: 'persona', subcuenta: '4300002044', grupo: 'espronceda' },
  { nombre: 'Emilio Alberto Linares-Rivas Balius', tipo: 'persona', subcuenta: '4300002046', grupo: 'espronceda' },
  { nombre: 'María José Crespo San Martín', tipo: 'persona', subcuenta: '4300002048', grupo: 'espronceda' },
  { nombre: 'José Miguel Blanc Molina', tipo: 'persona', subcuenta: '4300002050', grupo: 'espronceda' },
  { nombre: 'CIAMAN COMERCIAL, S.L', tipo: 'empresa', subcuenta: '4300002051', grupo: 'espronceda' },
  { nombre: 'Teresa Romero Arroyo', tipo: 'persona', subcuenta: '4300002052', grupo: 'espronceda' },
  { nombre: 'Luis Maria Huete Arrieta', tipo: 'persona', subcuenta: '4300002055', grupo: 'espronceda' },
  { nombre: 'TESLA SPAIN SLU', tipo: 'empresa', subcuenta: '4300002056', grupo: 'espronceda' },
  { nombre: 'Santiago Alvarez de Toledo', tipo: 'persona', subcuenta: '4300002058', grupo: 'espronceda' },
  { nombre: 'Ponce y Mugar SL', tipo: 'empresa', subcuenta: '4300002063', grupo: 'espronceda' },
  { nombre: 'CASAPEIPLUS SL', tipo: 'empresa', subcuenta: '4300002064', grupo: 'espronceda' },
  { nombre: 'Edmond de Rothschild Europe', tipo: 'empresa', subcuenta: '4300002065', grupo: 'espronceda' },
  { nombre: 'Edmond de Rothschild Asset Management SA', tipo: 'empresa', subcuenta: '4300002066', grupo: 'espronceda' },
  { nombre: 'Marta Verdyguer Cuevas', tipo: 'persona', subcuenta: '4300002067', grupo: 'espronceda' },
  { nombre: 'David Pinilla Galán', tipo: 'persona', subcuenta: '4300002068', grupo: 'espronceda' },
  { nombre: 'Marina Pérez Escudero', tipo: 'persona', subcuenta: '4300002070', grupo: 'espronceda' },
  { nombre: 'José Francisco Martín Fernández', tipo: 'persona', subcuenta: '4300002072', grupo: 'espronceda' },
  { nombre: 'Carmen Sánchez Caballero', tipo: 'persona', subcuenta: '4300002073', grupo: 'espronceda' },
  { nombre: 'Carlos Luis Badillo Bercebal', tipo: 'persona', subcuenta: '4300002078', grupo: 'espronceda' },
  { nombre: 'Cayetano Mendoza Cañavate', tipo: 'persona', subcuenta: '4300002079', grupo: 'espronceda' },
  { nombre: 'FOEDERIS ARCA S.L', tipo: 'empresa', subcuenta: '4300002080', grupo: 'espronceda' },
  { nombre: 'Jose Israel Casanova Lafuente', tipo: 'persona', subcuenta: '4300002084', grupo: 'espronceda' },
  { nombre: 'Pablo Gómez Hernangomez', tipo: 'persona', subcuenta: '4300002085', grupo: 'espronceda' },
  { nombre: 'Carlos Pombo Bravo', tipo: 'persona', subcuenta: '4300002086', grupo: 'espronceda' },
  { nombre: 'Juan Fernández Martínez', tipo: 'persona', subcuenta: '4300002088', grupo: 'espronceda' },
  { nombre: 'Israel Navas Malpartida', tipo: 'persona', subcuenta: '4300002089', grupo: 'espronceda' },
  { nombre: 'Jose Luis Pascual Pedraza', tipo: 'persona', subcuenta: '4300002090', grupo: 'espronceda' },
  { nombre: 'Ignacio José Taboada Fernandez Navarrete', tipo: 'persona', subcuenta: '4300002091', grupo: 'espronceda' },
  { nombre: 'Esteban Arza Bombin', tipo: 'persona', subcuenta: '4300002092', grupo: 'espronceda' },
  { nombre: 'Yolanda Amalia Aznar Gonzalez', tipo: 'persona', subcuenta: '4300002093', grupo: 'espronceda' },
  { nombre: 'Jean Lahoud Rodriguez', tipo: 'persona', subcuenta: '4300002094', grupo: 'espronceda' },
  { nombre: 'Pedro Pujol Garrido', tipo: 'persona', subcuenta: '4300002095', grupo: 'espronceda' },
  { nombre: 'Juan Bartolome Segui Muret', tipo: 'persona', subcuenta: '4300002096', grupo: 'espronceda' },
  { nombre: 'Luis de Argüelles González', tipo: 'persona', subcuenta: '4300002097', grupo: 'espronceda' },
  { nombre: 'Seegman Servicios Juridicos SLP', tipo: 'empresa', subcuenta: '4300002098', grupo: 'espronceda' },
  { nombre: 'Lucía María Merediz Atozqui', tipo: 'persona', subcuenta: '4300002099', grupo: 'espronceda' },
  { nombre: 'Fernando García Muñoz', tipo: 'persona', subcuenta: '4300002100', grupo: 'espronceda' },
  { nombre: 'Andrés Galán Sierra', tipo: 'persona', subcuenta: '4300002102', grupo: 'espronceda' },
  { nombre: 'Alexander Guittard', tipo: 'persona', subcuenta: '4300002103', grupo: 'espronceda' },
  { nombre: 'Fernando Jimenez Ruiz-Carriedo', tipo: 'persona', subcuenta: '4300002104', grupo: 'espronceda' },
  { nombre: 'Castellana Partners SL', tipo: 'empresa', subcuenta: '4300002105', grupo: 'espronceda' },
  { nombre: 'Lucas Manuel Blanque Rey', tipo: 'persona', subcuenta: '4300002106', grupo: 'espronceda' },
  { nombre: 'Manuel Segimon de Manzanos', tipo: 'persona', subcuenta: '4300002107', grupo: 'espronceda' },
  { nombre: 'Jose Luis Muñiz Cacho', tipo: 'persona', subcuenta: '4300002108', grupo: 'espronceda' },
  { nombre: 'AEON-T COMPOSITE TECHNOLOGIES SL', tipo: 'empresa', subcuenta: '4300002109', grupo: 'espronceda' },
  { nombre: 'Ruth Carlota Mars Crespo', tipo: 'persona', subcuenta: '4300002110', grupo: 'espronceda' },
  { nombre: 'Ignacio Saez Anguiano', tipo: 'persona', subcuenta: '4300002111', grupo: 'espronceda' },
  { nombre: 'Antonio Pérez Fresno', tipo: 'persona', subcuenta: '4300002112', grupo: 'espronceda' },
  { nombre: 'Martín Miguel Rubino Gurtubay', tipo: 'persona', subcuenta: '4300002113', grupo: 'espronceda' },
  { nombre: 'Blanca María Soria Sancho', tipo: 'persona', subcuenta: '4300002114', grupo: 'espronceda' },
  { nombre: 'IDEEMATEC SPAIN S.L', tipo: 'empresa', subcuenta: '4300002115', grupo: 'espronceda' },
  { nombre: 'Iciar Nieto San Juan', tipo: 'persona', subcuenta: '4300002116', grupo: 'espronceda' },
  { nombre: 'Iria Fernández Vázquez', tipo: 'persona', subcuenta: '4300002117', grupo: 'espronceda' },
  { nombre: 'Paula Tent Moreno', tipo: 'persona', subcuenta: '4300002118', grupo: 'espronceda' },
  { nombre: 'Eduardo Baviera Sabater', tipo: 'persona', subcuenta: '4300002119', grupo: 'espronceda' },
  { nombre: 'Alejandra Artiñano López de Guereñu', tipo: 'persona', subcuenta: '4300002120', grupo: 'espronceda' },
  { nombre: 'Maria Eugenia Pascual Guardia', tipo: 'persona', subcuenta: '4300002121', grupo: 'espronceda' },
  { nombre: 'Daniel Alejandro Obando Moreno', tipo: 'persona', subcuenta: '4300002122', grupo: 'espronceda' },
  { nombre: 'María de los Llanos Martínez Trenado', tipo: 'persona', subcuenta: '4300002123', grupo: 'espronceda' },
  { nombre: 'JR CONSULTING BUSINESS Y ADMINISTRATION SL', tipo: 'empresa', subcuenta: '4300002173', grupo: 'espronceda' },
  // ── GARAJES PALENCIA / VALLADOLID ──
  { nombre: 'Roberto Provedo Pisano', tipo: 'persona', subcuenta: '4300003000', grupo: 'palencia_valladolid' },
  { nombre: 'Mercedes Carmen Bolívar Prieto', tipo: 'persona', subcuenta: '4300003001', grupo: 'palencia_valladolid' },
  { nombre: 'Fernando del Campo Manzano', tipo: 'persona', subcuenta: '4300003002', grupo: 'palencia_valladolid' },
  { nombre: 'Ernesto Diezhandino Andrés', tipo: 'persona', subcuenta: '4300003003', grupo: 'palencia_valladolid' },
  { nombre: 'David Garcia Labrador', tipo: 'persona', subcuenta: '4300003004', grupo: 'palencia_valladolid' },
  { nombre: 'Francisco Rosendo Alvarez Mateos', tipo: 'persona', subcuenta: '4300003005', grupo: 'palencia_valladolid' },
  { nombre: 'Jose Luis Curieses Sanz', tipo: 'persona', subcuenta: '4300003006', grupo: 'palencia_valladolid' },
  { nombre: 'Ángela María Ayuela Pérez', tipo: 'persona', subcuenta: '4300003009', grupo: 'palencia_valladolid' },
  { nombre: 'Javier Arranz Arija', tipo: 'persona', subcuenta: '4300003010', grupo: 'palencia_valladolid' },
  { nombre: 'Rebeca Mateos Parreño', tipo: 'persona', subcuenta: '4300003011', grupo: 'palencia_valladolid' },
  { nombre: 'Beatriz Ballesteros Gadea', tipo: 'persona', subcuenta: '4300003012', grupo: 'palencia_valladolid' },
  { nombre: 'Patricia Mancho Abad', tipo: 'persona', subcuenta: '4300003013', grupo: 'palencia_valladolid' },
  { nombre: 'Noelia Miguel González', tipo: 'persona', subcuenta: '4300003014', grupo: 'palencia_valladolid' },
];

// ============================================================================
// SEGUROS extraídos de subcuentas 625x (Primas de seguros)
// ============================================================================

const INSURANCE_DATA: Array<{
  tipo: string;
  aseguradora: string;
  poliza: string;
  buildingRef: string; // para hacer match con building.nombre
  primaAnual: number;
  fechaInicio: string;
  fechaVencimiento: string;
}> = [
  { tipo: 'hogar', aseguradora: 'AXA', poliza: 'SEG-TOMILLAR-001', buildingRef: 'Casa El Tomillar', primaAnual: 450, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'comunidad', aseguradora: 'Mapfre', poliza: 'SEG-EUROPA34-001', buildingRef: 'Oficinas Av Europa', primaAnual: 800, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'comunidad', aseguradora: 'Generali', poliza: 'SEG-CONSTIT8-001', buildingRef: 'Inmueble Constitución 8', primaAnual: 600, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'comunidad', aseguradora: 'Zurich', poliza: 'SEG-CUBA-001', buildingRef: 'Naves Avda Cuba', primaAnual: 1200, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'comunidad', aseguradora: 'Allianz', poliza: 'SEG-METAL-001', buildingRef: 'Naves Metal 4', primaAnual: 900, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'hogar', aseguradora: 'AXA', poliza: 'SEG-GII-1D-001', buildingRef: 'Apartamentos Gemelos II', primaAnual: 350, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'hogar', aseguradora: 'AXA', poliza: 'SEG-GII-3B-001', buildingRef: 'Apartamentos Gemelos II', primaAnual: 350, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'hogar', aseguradora: 'AXA', poliza: 'SEG-GII-20B-001', buildingRef: 'Apartamentos Gemelos II', primaAnual: 350, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'hogar', aseguradora: 'AXA', poliza: 'SEG-GII-20C-001', buildingRef: 'Apartamentos Gemelos II', primaAnual: 350, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'hogar', aseguradora: 'AXA', poliza: 'SEG-GIV-17C-001', buildingRef: 'Apartamentos Gemelos IV', primaAnual: 350, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'hogar', aseguradora: 'AXA', poliza: 'SEG-GII-3E-001', buildingRef: 'Apartamentos Gemelos II', primaAnual: 350, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'hogar', aseguradora: 'AXA', poliza: 'SEG-GII-1E-001', buildingRef: 'Apartamentos Gemelos II', primaAnual: 350, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
  { tipo: 'comunidad', aseguradora: 'Mapfre', poliza: 'SEG-PIAMONTE-001', buildingRef: 'Edificio Piamonte 23', primaAnual: 2500, fechaInicio: '2025-01-01', fechaVencimiento: '2025-12-31' },
];

// ============================================================================
// EJECUCIÓN
// ============================================================================

async function main() {
  console.log('====================================================================');
  console.log('  ALTA INQUILINOS, SEGUROS Y CONTRATOS - ROVIDA S.L.');
  console.log('====================================================================\n');

  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  if (!rovida) { console.error('Rovida no encontrada'); process.exit(1); }
  console.log(`Empresa: ${rovida.nombre} (${rovida.id})\n`);

  // Cargar edificios existentes
  const buildings = await prisma.building.findMany({
    where: { companyId: rovida.id },
    include: { units: { select: { id: true, numero: true } } },
  });
  console.log(`Edificios cargados: ${buildings.length}\n`);

  // ── 1. INQUILINOS ──
  console.log('=== CREANDO INQUILINOS ===');
  let tenantsCreated = 0;
  let tenantsSkipped = 0;

  for (const t of TENANTS_DATA) {
    // Usar subcuenta como base para campos únicos
    const emailBase = t.nombre.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').substring(0, 40);
    const uniqueEmail = `${emailBase}.${t.subcuenta.slice(-4)}@rovida-tenant.local`;
    const uniqueDni = `ROV-${t.subcuenta.slice(-6)}`;

    const existing = await prisma.tenant.findFirst({
      where: {
        companyId: rovida.id,
        OR: [
          { nombreCompleto: t.nombre },
          { email: uniqueEmail },
          { dni: uniqueDni },
        ],
      },
    });
    if (existing) { tenantsSkipped++; continue; }

    try {
      await prisma.tenant.create({
        data: {
          companyId: rovida.id,
          nombreCompleto: t.nombre,
          email: uniqueEmail,
          telefono: '+34 000 000 000',
          dni: uniqueDni,
          fechaNacimiento: new Date('1980-01-01'),
          activo: true,
          notas: `Subcuenta contable: ${t.subcuenta}. Grupo: ${t.grupo}. Tipo: ${t.tipo}`,
        },
      });
      tenantsCreated++;
    } catch (err: any) {
      // Unique constraint violation - skip
      if (err.code === 'P2002') { tenantsSkipped++; }
      else { console.error(`  Error creando ${t.nombre}: ${err.message}`); }
    }
  }
  console.log(`  Creados: ${tenantsCreated}, Existentes: ${tenantsSkipped}`);

  // ── 2. SEGUROS ──
  console.log('\n=== CREANDO SEGUROS ===');
  let insuranceCreated = 0;
  let insuranceSkipped = 0;

  for (const ins of INSURANCE_DATA) {
    const building = buildings.find(b => b.nombre.includes(ins.buildingRef) || ins.buildingRef.includes(b.nombre.split(' ')[0]));

    const existing = await prisma.insurance.findFirst({
      where: { companyId: rovida.id, numeroPoliza: ins.poliza },
    });
    if (existing) { insuranceSkipped++; continue; }

    try {
      await prisma.insurance.create({
        data: {
          companyId: rovida.id,
          buildingId: building?.id || undefined,
          tipo: ins.tipo,
          aseguradora: ins.aseguradora,
          numeroPoliza: ins.poliza,
          nombreAsegurado: 'Rovida S.L.',
          primaAnual: ins.primaAnual,
          estado: 'activa',
          fechaInicio: new Date(ins.fechaInicio),
          fechaVencimiento: new Date(ins.fechaVencimiento),
          notas: `Edificio: ${ins.buildingRef}. Datos extraídos de subcuentas 625x del Plan Contable.`,
        },
      });
      insuranceCreated++;
    } catch (err: any) {
      if (err.code === 'P2002') { insuranceSkipped++; }
      else { console.error(`  Error creando seguro ${ins.poliza}: ${err.message}`); }
    }
  }
  console.log(`  Creados: ${insuranceCreated}, Existentes: ${insuranceSkipped}`);

  // ── 3. CONTRATOS ──
  console.log('\n=== CREANDO CONTRATOS ===');
  let contractsCreated = 0;
  let contractsSkipped = 0;

  // Cargar inquilinos recién creados
  const tenants = await prisma.tenant.findMany({
    where: { companyId: rovida.id },
  });

  // Mapear grupo a edificio
  const grupoToBuilding: Record<string, string[]> = {
    espronceda: ['Garajes Espronceda 32'],
    hernandez_tejada: ['Garajes Hernández de Tejada 6'],
    locales_oficinas: ['Locales Barquillo 30', 'Locales Reina 15', 'Edificio Piamonte 23', 'Oficinas Av Europa 34', 'Local Menéndez Pelayo 15'],
    palencia_valladolid: ['Garajes Menéndez Pelayo 17', 'Garajes Constitución 5', 'Naves Avda Cuba 48-50-52'],
    benidorm: ['Apartamentos Gemelos 20', 'Apartamentos Gemelos II', 'Apartamentos Gemelos IV'],
  };

  for (const tData of TENANTS_DATA) {
    const tenant = tenants.find(t => t.nombreCompleto === tData.nombre);
    if (!tenant) continue;

    // Buscar building del grupo
    const buildingNames = grupoToBuilding[tData.grupo] || [];
    let building = null;
    let unit = null;

    for (const bName of buildingNames) {
      building = buildings.find(b => b.nombre === bName);
      if (building && building.units.length > 0) {
        // Asignar primera unidad libre
        unit = building.units[0];
        break;
      }
    }

    if (!building) continue;

    // Verificar si ya existe contrato para este inquilino
    const existingContract = await prisma.contract.findFirst({
      where: {
        tenantId: tenant.id,
        unit: { building: { companyId: rovida.id } },
      },
    });
    if (existingContract) { contractsSkipped++; continue; }

    if (!unit) continue;

    const isGaraje = unit.numero.toLowerCase().includes('garaje') || unit.numero.toLowerCase().includes('plaza');
    const isLocal = unit.numero.toLowerCase().includes('local');
    const isNave = unit.numero.toLowerCase().includes('nave');
    const isOficina = unit.numero.toLowerCase().includes('oficina') || unit.numero.toLowerCase().includes('bl.');

    const rentaMensual = isGaraje ? 120 : isLocal ? 2500 : isNave ? 1000 : isOficina ? 1500 : 700;
    const contractType = (isGaraje || isLocal || isNave || isOficina) ? 'comercial' : 'residencial';

    try {
      await prisma.contract.create({
        data: {
          unitId: unit.id,
          tenantId: tenant.id,
          fechaInicio: new Date('2025-01-01'),
          fechaFin: new Date('2025-12-31'),
          rentaMensual,
          deposito: rentaMensual,
          estado: 'activo',
          tipo: contractType as any,
        },
      });
      contractsCreated++;
    } catch (err: any) {
      if (err.code === 'P2002') { contractsSkipped++; }
      else { console.error(`  Error creando contrato ${tenant.nombreCompleto}: ${err.message}`); }
    }
  }
  console.log(`  Creados: ${contractsCreated}, Existentes: ${contractsSkipped}`);

  // ── RESUMEN ──
  const finalTenants = await prisma.tenant.count({ where: { companyId: rovida.id } });
  const finalInsurance = await prisma.insurance.count({ where: { companyId: rovida.id } });
  const finalContracts = await prisma.contract.count({
    where: { unit: { building: { companyId: rovida.id } } },
  });

  console.log('\n====================================================================');
  console.log('  RESUMEN FINAL - ROVIDA S.L.');
  console.log('====================================================================');
  console.log(`  Inquilinos: ${finalTenants}`);
  console.log(`  Seguros: ${finalInsurance}`);
  console.log(`  Contratos: ${finalContracts}`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
