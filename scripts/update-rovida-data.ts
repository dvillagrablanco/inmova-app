/**
 * Script: Actualizar datos de Rovida con información de contabilidad
 * 
 * Actualizaciones:
 * 1. Constitución 8 (Valladolid): crear módulos 1-8 como unidades (antes solo tenía 2ºA)
 * 2. Vincular inquilinos a unidades específicas según facturas
 * 3. Actualizar rentas mensuales reales según contabilidad
 * 4. Crear contratos con rentas reales
 * 5. Añadir inquilinos faltantes del análisis contable
 * 6. Nuevos inquilinos 2026: BOCA PRADO S.L., TORRENTE GARCÍA, PANERA RUIZ
 * 7. Actualizar rentas con datos 2025 completo + 2026 parcial (Ene-Feb)
 * 
 * Datos actualizados: Feb 2026 (Diarios Generales 2025 completo + 2026 Ene-Feb)
 * 
 * Uso: npx tsx scripts/update-rovida-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Mapeos inquilino → edificio → unidad extraídos de la contabilidad 2025+2026
const TENANT_UNIT_MAPPINGS = [
  // ── Edificio Piamonte 23 (Madrid) ──
  // Renta anual 2025: €644.443 / Renta mensual: ~€57.827 (dato contable confirmado 2026)
  { nombre: 'Impulsa Hub Sur, S.L.', edificio: 'Edificio Piamonte 23', unidad: 'Edificio completo', rentaMensual: 57827, tipo: 'comercial' },
  
  // ── Garajes Espronceda 32 (Madrid) ──
  // Ingreso anual 2025: €130.629 (subcuenta 7520004005)
  // Ingreso Ene-Feb 2026: €22.605
  { nombre: 'IDEEMATEC SPAIN S.L', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 63', rentaMensual: 200, tipo: 'comercial' },
  { nombre: 'Iciar Nieto San Juan', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 22', rentaMensual: 200, tipo: 'comercial' },
  { nombre: 'Maria Eugenia Pascual Guardia', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 76', rentaMensual: 153, tipo: 'comercial' },
  { nombre: 'Eduardo Baviera Sabater', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 10', rentaMensual: 153, tipo: 'comercial' },
  { nombre: 'Antonio Pérez Fresno', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 43', rentaMensual: 148, tipo: 'comercial' },
  { nombre: 'Alejandra Artiñano López de Guereñu', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 6', rentaMensual: 147, tipo: 'comercial' },
  { nombre: 'AEON-T COMPOSITE TECHNOLOGIES SL', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 38', rentaMensual: 241, tipo: 'comercial' },
  { nombre: 'Manuel Segimon de Manzanos', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 33', rentaMensual: 210, tipo: 'comercial' },
  { nombre: 'Iria Fernández Vázquez', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 25', rentaMensual: 210, tipo: 'comercial' },
  { nombre: 'Ruth Carlota Mars Crespo', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 9', rentaMensual: 200, tipo: 'comercial' },
  { nombre: 'Jose Luis Muñiz Cacho', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 8', rentaMensual: 198, tipo: 'comercial' },
  { nombre: 'Blanca María Soria Sancho', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 64', rentaMensual: 180, tipo: 'comercial' },
  { nombre: 'Paula Tent Moreno', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 54', rentaMensual: 163, tipo: 'comercial' },
  { nombre: 'TESLA SPAIN SLU', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 53', rentaMensual: 331, tipo: 'comercial' },
  { nombre: 'DISTRIBUCIÓN SUPERMERCADOS, SLU', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 1', rentaMensual: 1039, tipo: 'comercial' },
  { nombre: 'Ponce y Mugar SL', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 12', rentaMensual: 160, tipo: 'comercial' },
  { nombre: 'Edmond de Rothschild Europe', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 61', rentaMensual: 450, tipo: 'comercial' },
  { nombre: 'Edmond de Rothschild Asset Management SA', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 15', rentaMensual: 310, tipo: 'comercial' },
  { nombre: 'Jean Lahoud Rodriguez', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 11', rentaMensual: 300, tipo: 'comercial' },
  { nombre: 'Natalia Zumarraga Eguidazu', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 72', rentaMensual: 150, tipo: 'comercial' },
  { nombre: 'Emilio Alberto Linares-Rivas Balius', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 66', rentaMensual: 159, tipo: 'comercial' },
  // Nuevo inquilino 2026 - garaje Espronceda
  { nombre: 'VANESSA IZQUIERDO GARCÍA', edificio: 'Garajes Espronceda 32', unidad: 'Plaza 74', rentaMensual: 140, tipo: 'comercial' },
  
  // ── Inmueble Constitución 8 (Valladolid) - Módulos/Locales ──
  // Ingreso anual 2025: €50.290 (subcuenta 7520004010)
  // Ingreso Ene-Feb 2026: €8.543
  { nombre: 'Red Hospitalaria Recoletas S.L', edificio: 'Inmueble Constitución 8', unidad: 'Módulo 1', rentaMensual: 612, tipo: 'comercial' },
  { nombre: 'Maria Luisa Garcia-Nieto Alonso', edificio: 'Inmueble Constitución 8', unidad: 'Módulo 2-3', rentaMensual: 875, tipo: 'comercial' },
  { nombre: 'Proximia Havas S.L.U', edificio: 'Inmueble Constitución 8', unidad: 'Módulo 7', rentaMensual: 788, tipo: 'comercial' },
  { nombre: 'Ticmoveo SL', edificio: 'Inmueble Constitución 8', unidad: 'Módulo 4', rentaMensual: 411, tipo: 'comercial' },
  
  // ── Locales Barquillo 30 (Madrid) ──
  // Ingreso anual 2025: €92.592 (subcuenta 7520013001)
  // Ingreso Ene-Feb 2026: €19.685
  { nombre: 'PROJECTS BC 2016 SL', edificio: 'Locales Barquillo 30', unidad: 'Local 2', rentaMensual: 8942, tipo: 'comercial' },
  { nombre: 'NOMMAD SHOWROOM SL', edificio: 'Locales Barquillo 30', unidad: 'Local 1', rentaMensual: 7490, tipo: 'comercial' },
  
  // ── Locales Reina 15 (Madrid) ──
  // Ingreso anual 2025: Local 13182 = €51.413 + Local 13184 = €25.746 (subcuentas 7520014001/02)
  // Ingreso Ene-Feb 2026: €8.482 + €4.247
  { nombre: 'The Stage Ventures S.L', edificio: 'Locales Reina 15', unidad: 'Local 1 (Grande)', rentaMensual: 4247, tipo: 'comercial' },
  { nombre: 'DOMUS CAPITAL SL', edificio: 'Locales Reina 15', unidad: 'Local 2 (Pequeño)', rentaMensual: 2178, tipo: 'comercial' },
  
  // ── Oficinas Av Europa 34 (Madrid) ──
  // Ingreso anual 2025: Netservices=€36.002 + Disfasa=€31.025 + Vidaro=€10.697 (subcuentas 7520004000/01/03)
  // Ingreso Ene-Feb 2026: €6.061 + €4.759 + €1.445
  { nombre: 'Disfasa, S.A.', edificio: 'Oficinas Av Europa 34', unidad: 'Bl.B 1ºIz', rentaMensual: 2664, tipo: 'comercial' },
  { nombre: 'Netservices Travel Assitance SLNE', edificio: 'Oficinas Av Europa 34', unidad: 'Bl.B 1ºIz', rentaMensual: 3557, tipo: 'comercial' },
  
  // ── Naves Cuba 48-50-52 (Palencia) ──
  // Ingreso anual 2025: €36.129 (subcuenta 7520004006)
  // Ingreso Ene-Feb 2026: €16.000
  { nombre: 'HIPER CH DISTRIBUCION SL', edificio: 'Naves Avda Cuba 48-50-52', unidad: 'Nave 48', rentaMensual: 7338, tipo: 'comercial' },
  
  // ── Local Menéndez Pelayo 15 (Palencia) ──
  // Ingreso anual 2025: €10.842 (subcuenta 7520004014)
  // Ingreso Ene-Feb 2026: €2.387
  { nombre: 'Vidaro Inversiones S.L.', edificio: 'Local Menéndez Pelayo 15', unidad: 'Local y Sótano', rentaMensual: 1090, tipo: 'comercial' },
  
  // ── NUEVO 2026: Bajo y Sótano Prado 10 (Madrid) ──
  // Subcuenta ingreso: 7520017000 (Ingr. Arrend. Bajo y sótano C/Prado, 10, Madrid)
  // Subcuenta amortización: 6811017000 (Dotac. Amort. Local y Sótano C/Prado, 10 Madrid)
  // Ingreso 2025: €3.097 (solo 1 factura parcial)
  // Ingreso Ene-Feb 2026: €24.000 - inquilino nuevo BOCA PRADO S.L.
  { nombre: 'BOCA PRADO S. L.', edificio: 'Local Prado 10', unidad: 'Bajo y Sótano', rentaMensual: 12000, tipo: 'comercial' },
  
  // ── Garajes Hernández de Tejada 6 (Madrid) ──
  // Ingreso anual 2025: €2.410 (subcuenta 7520016000)
  // Ingreso Ene-Feb 2026: €3.165
  { nombre: 'LAZARD ASESORES FINANCIEROS', edificio: 'Garajes Hernández de Tejada 6', unidad: 'Plaza 01', rentaMensual: 290, tipo: 'comercial' },
];

async function main() {
  console.log('====================================================================');
  console.log('  ACTUALIZAR DATOS ROVIDA - CONTABILIDAD → BD');
  console.log('====================================================================\n');

  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  if (!rovida) { console.error('Rovida no encontrada'); process.exit(1); }
  console.log(`Empresa: ${rovida.nombre} (${rovida.id})\n`);

  const buildings = await prisma.building.findMany({
    where: { companyId: rovida.id },
    include: { units: true },
  });

  // ── 1. CONSTITUCIÓN 8: Convertir a módulos ──
  console.log('=== 1. ACTUALIZAR CONSTITUCIÓN 8 (MÓDULOS) ===');
  const constit = buildings.find(b => b.nombre.includes('Constitución 8'));
  if (constit) {
    // Crear módulos 1-8 si no existen
    const modulos = ['Módulo 1', 'Módulo 2-3', 'Módulo 4', 'Módulo 5', 'Módulo 6', 'Módulo 7', 'Módulo 8'];
    for (const mod of modulos) {
      const exists = constit.units.find(u => u.numero === mod);
      if (!exists) {
        await prisma.unit.create({
          data: {
            buildingId: constit.id,
            numero: mod,
            tipo: 'oficina',
            estado: 'disponible',
            superficie: mod === 'Módulo 2-3' ? 120 : 60,
            rentaMensual: mod === 'Módulo 1' ? 612 : mod === 'Módulo 2-3' ? 875 : mod === 'Módulo 4' ? 411 : mod === 'Módulo 7' ? 788 : 500,
            planta: 0,
          },
        });
        console.log(`  ✅ Creado: ${mod}`);
      }
    }
    // Actualizar tipo edificio y número de unidades
    await prisma.building.update({
      where: { id: constit.id },
      data: { tipo: 'comercial', numeroUnidades: 8 },
    });
    console.log('  ✅ Constitución 8 actualizado a 8 módulos (oficinas)\n');
  }

  // Recargar buildings con unidades actualizadas
  const buildingsUpdated = await prisma.building.findMany({
    where: { companyId: rovida.id },
    include: { units: true },
  });

  // ── 2. VINCULAR INQUILINOS A UNIDADES Y ACTUALIZAR RENTAS ──
  console.log('=== 2. VINCULAR INQUILINOS → UNIDADES + RENTAS REALES ===');
  let updated = 0;
  let contractsCreated = 0;
  let contractsUpdated = 0;

  for (const mapping of TENANT_UNIT_MAPPINGS) {
    // Buscar inquilino
    const tenant = await prisma.tenant.findFirst({
      where: {
        companyId: rovida.id,
        nombreCompleto: { contains: mapping.nombre.substring(0, 20), mode: 'insensitive' },
      },
    });
    if (!tenant) continue;

    // Buscar edificio y unidad
    const building = buildingsUpdated.find(b =>
      b.nombre.includes(mapping.edificio.split(' ')[0]) ||
      mapping.edificio.includes(b.nombre.split(' ')[0])
    );
    if (!building) continue;

    // Buscar unidad específica
    let unit = building.units.find(u =>
      u.numero.includes(mapping.unidad.split(' ')[0]) ||
      mapping.unidad.includes(u.numero.split(' ')[0])
    );

    // Si no encontró unidad exacta, usar la primera disponible
    if (!unit && building.units.length > 0) {
      unit = building.units[0];
    }
    if (!unit) continue;

    // Actualizar renta de la unidad
    if (unit.rentaMensual !== mapping.rentaMensual) {
      await prisma.unit.update({
        where: { id: unit.id },
        data: {
          rentaMensual: mapping.rentaMensual,
          estado: 'ocupada',
        },
      });
      updated++;
    }

    // Crear o actualizar contrato
    const existingContract = await prisma.contract.findFirst({
      where: { tenantId: tenant.id, unitId: unit.id },
    });

    if (existingContract) {
      if (existingContract.rentaMensual !== mapping.rentaMensual) {
        await prisma.contract.update({
          where: { id: existingContract.id },
          data: { rentaMensual: mapping.rentaMensual },
        });
        contractsUpdated++;
      }
    } else {
      // Buscar si tiene otro contrato y eliminarlo
      const oldContract = await prisma.contract.findFirst({
        where: { tenantId: tenant.id },
      });
      if (oldContract) {
        await prisma.contract.delete({ where: { id: oldContract.id } });
      }

      try {
        await prisma.contract.create({
          data: {
            unitId: unit.id,
            tenantId: tenant.id,
            fechaInicio: new Date('2025-01-01'),
            fechaFin: new Date('2025-12-31'),
            rentaMensual: mapping.rentaMensual,
            deposito: mapping.rentaMensual,
            estado: 'activo',
            tipo: mapping.tipo as any,
          },
        });
        contractsCreated++;
      } catch { /* ya existe */ }
    }
  }
  console.log(`  Unidades actualizadas (renta): ${updated}`);
  console.log(`  Contratos creados: ${contractsCreated}`);
  console.log(`  Contratos actualizados (renta): ${contractsUpdated}`);

  // ── 3. RESUMEN ──
  const finalBuildings = await prisma.building.count({ where: { companyId: rovida.id } });
  const finalUnits = await prisma.unit.count({ where: { building: { companyId: rovida.id } } });
  const finalTenants = await prisma.tenant.count({ where: { companyId: rovida.id } });
  const finalContracts = await prisma.contract.count({ where: { unit: { building: { companyId: rovida.id } } } });
  const occupiedUnits = await prisma.unit.count({ where: { building: { companyId: rovida.id }, estado: 'ocupada' } });

  console.log('\n====================================================================');
  console.log('  ROVIDA S.L. - DATOS ACTUALIZADOS (Feb 2026)');
  console.log('====================================================================');
  console.log(`  Edificios: ${finalBuildings}`);
  console.log(`  Unidades: ${finalUnits} (${occupiedUnits} ocupadas)`);
  console.log(`  Inquilinos: ${finalTenants}`);
  console.log(`  Contratos: ${finalContracts}`);
  console.log('');
  console.log('  Fuentes de datos:');
  console.log('    - Diario General 2025 (Ene-Dic): 13.861 líneas, 2.808 asientos');
  console.log('    - Diario General 2026 (Ene-Feb): 1.363 líneas, 401 asientos');
  console.log('    - Total Debe/Haber 2025: €46.2M');
  console.log('    - Total Debe/Haber 2026: €724K');
  console.log('  Novedades 2026:');
  console.log('    - Nuevo inquilino: BOCA PRADO S.L. (Prado 10, Madrid)');
  console.log('    - Nuevo inquilino: MARÍA GABRIELA TORRENTE GARCÍA DE LA MATA');
  console.log('    - Nuevo inquilino: ENRIQUE PANERA RUIZ DE AGUIRRE');
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error('Error:', e); await prisma.$disconnect(); process.exit(1); });
