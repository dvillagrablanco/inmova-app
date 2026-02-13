/**
 * Script: Importar datos de clientes de Rovida y Viroda desde otro software
 * 
 * Fuentes:
 * - DATOS CLIENTES ROVIDA.xlsx (247 clientes)
 * - DATOS CLIENTES VIRODA.xlsx (153 clientes)
 * - FACTURACION ROVIDA FEB.xlsx (123 facturas Febrero 2026)
 * - FACTURACION VIRODA FEB.xlsx (127 facturas Febrero 2026)
 * 
 * Este script:
 * 1. Elimina los inquilinos/contratos demo existentes de Rovida y Viroda
 * 2. Crea nuevos inquilinos con datos reales del otro software
 * 3. Vincula inquilinos a unidades según la facturación de Feb 2026
 * 4. Crea contratos con rentas reales
 * 
 * Uso: npx tsx scripts/import-rovida-viroda-clients.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

interface ClientData {
  nif: string;
  nombreCompleto: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  medioPago: string | null;
  iban: string | null;
  direccion: string | null;
  poblacion: string | null;
  provincia: string | null;
  codigoPostal: string | null;
  pais: string;
  company: string;
}

interface InvoiceLine {
  concepto: string;
  precio: number;
  isRent: boolean;
}

interface InvoiceData {
  numFactura: string;
  fecha: string | null;
  nif: string;
  nombre: string;
  operacion: string;
  baseImporte: number;
  total: number;
  lineas: InvoiceLine[];
  company: string;
}

interface RentEntry {
  nombre: string;
  rentaMensual: number;
  operacion: string;
  concepto: string | null;
  totalFactura: number;
  numFactura: string;
}

interface ParsedData {
  rovida: {
    clients: ClientData[];
    invoices: InvoiceData[];
    rentMappings: Record<string, RentEntry[]>;
  };
  viroda: {
    clients: ClientData[];
    invoices: InvoiceData[];
    rentMappings: Record<string, RentEntry[]>;
  };
}

// ============================================================================
// UTILITY: Parse building/unit from invoice concepto
// ============================================================================

interface UnitMatch {
  edificioPattern: string;
  unidad: string;
  tipo: 'garaje' | 'vivienda' | 'local' | 'oficina' | 'nave_industrial';
}

function parseUnitFromConcepto(concepto: string, operacion: string): UnitMatch | null {
  if (!concepto) return null;
  const c = concepto;

  // === ROVIDA BUILDINGS ===

  // Garaje Espronceda 32 (Pt:01, Pt:M18, etc.)
  let m = c.match(/Garaje C\/Espronceda 32.*Pt:(?:M?)(\d+)/i);
  if (m) return { edificioPattern: 'Espronceda 32', unidad: `Plaza ${m[1]}`, tipo: 'garaje' };

  // Garaje Hernández de Tejada 6 (formatos: -1 02, -2 05, -1 04, -2 06, -2 07, -2 16, -2 28)
  m = c.match(/Garaje C\/Hernández de Tejada 6,\s*-?\d+\s+(\d+)/i);
  if (m) return { edificioPattern: 'Hernández de Tejada 6', unidad: `Plaza ${m[1].padStart(2, '0')}`, tipo: 'garaje' };

  // Garaje Menéndez Pelayo 17 (formatos: -1, 18 / -2, 76)
  m = c.match(/Garaje C\/M[dé](?:n|ñ)?ez Pelayo 17.*?(\d+)\s+(?:Palencia)?/i);
  if (m) return { edificioPattern: 'Menéndez Pelayo 17', unidad: `Plaza ${m[1]}`, tipo: 'garaje' };

  // Garaje Constitución 5
  m = c.match(/Garaje C\/Constitución 5.*?(\d+)/i);
  if (m) return { edificioPattern: 'Constitución 5', unidad: `Plaza ${m[1]}`, tipo: 'garaje' };

  // Generic "Renta garaje según contrato" - use operation field
  if (/garaje según contrato/i.test(c)) {
    if (operacion.includes('Espronceda')) return { edificioPattern: 'Espronceda 32', unidad: 'Plaza', tipo: 'garaje' };
    if (operacion.includes('Hernández')) return { edificioPattern: 'Hernández de Tejada 6', unidad: 'Plaza', tipo: 'garaje' };
    return null;
  }

  // Inmueble Constitución 8 / Módulos
  m = c.match(/Constitución 8.*?Mod\.?\s*([\d\-]+)/i);
  if (m) return { edificioPattern: 'Constitución 8', unidad: `Módulo ${m[1]}`, tipo: 'local' };

  // Local Barquillo 30
  m = c.match(/Local.*(?:Comercial\s+)?C\/Barquillo 30/i);
  if (m) return { edificioPattern: 'Barquillo 30', unidad: 'Local', tipo: 'local' };

  // Local Reina 15 (grande/pequeño o nº finca) - ROVIDA locales comerciales
  m = c.match(/Local.*(?:19254|13182|grande).*Reina 15/i);
  if (m) return { edificioPattern: 'Reina 15', unidad: 'Local 1 (Grande)', tipo: 'local' };
  m = c.match(/Local.*(?:19256|13184|peque).*Reina 15/i);
  if (m) return { edificioPattern: 'Reina 15', unidad: 'Local 2 (Pequeño)', tipo: 'local' };

  // Edificio Piamonte 23
  m = c.match(/Piamonte 23/i);
  if (m) return { edificioPattern: 'Piamonte 23', unidad: 'Edificio completo', tipo: 'local' };

  // Nave Cuba
  if (c.includes('Cuba')) {
    m = c.match(/Cuba.*?(\d+)/i);
    const naveNum = m ? m[1] : '50';
    return { edificioPattern: 'Cuba', unidad: `Nave ${naveNum}`, tipo: 'nave_industrial' };
  }

  // Local Menéndez Pelayo 15 (ROVIDA - local comercial)
  if ((/Local/i.test(c) || /sótano/i.test(c)) && (/M[dé](?:n|ñ)?ez Pelayo.*15/i.test(c) || /Mdez Pelayo.*15/i.test(c))) {
    return { edificioPattern: 'Menéndez Pelayo 15', unidad: 'Local y Sótano', tipo: 'local' };
  }

  // Local Prado 10 / Alquiler del local C/Prado 10
  if (/Prado.*10/i.test(c)) {
    return { edificioPattern: 'Prado 10', unidad: 'Bajo y Sótano', tipo: 'local' };
  }

  // Oficinas Av Europa 34 (múltiples módulos)
  if (c.includes('Europa 34') || c.includes('Europa, 34') || operacion.includes('Europa')) {
    return { edificioPattern: 'Europa 34', unidad: 'Bl.B 1ºIz', tipo: 'oficina' };
  }

  // Gemelos
  m = c.match(/Gemelos?\s*(XX|20|II|IV|2|4)/i);
  if (m) {
    const gemType = m[1].toUpperCase();
    if (gemType === 'XX' || gemType === '20') return { edificioPattern: 'Gemelos 20', unidad: 'Apto', tipo: 'vivienda' };
    if (gemType === 'II' || gemType === '2') return { edificioPattern: 'Gemelos II', unidad: 'Apto', tipo: 'vivienda' };
    if (gemType === 'IV' || gemType === '4') return { edificioPattern: 'Gemelos IV', unidad: 'Apto', tipo: 'vivienda' };
  }

  // Naves Metal/Argales
  if (c.includes('Metal') || c.includes('Argales')) {
    return { edificioPattern: 'Metal 4', unidad: 'Nave Principal', tipo: 'nave_industrial' };
  }

  // === VIRODA BUILDINGS ===

  // Manuel Silvela 5
  if (c.includes('Manuel Silvela 5') || c.includes('Manuel Silvela, 5')) {
    if (/LOCAL/i.test(c) || /Local\s*-/i.test(c)) return { edificioPattern: 'Manuel Silvela 5', unidad: 'LOCAL', tipo: 'local' };
    if (/Bajo/i.test(c)) return { edificioPattern: 'Manuel Silvela 5', unidad: 'BAJO', tipo: 'vivienda' };
    if (/[Áá]tico/i.test(c)) return { edificioPattern: 'Manuel Silvela 5', unidad: 'ÁTICO', tipo: 'vivienda' };
    m = c.match(/(\d+)º?\s*([A-C])/i);
    if (m) return { edificioPattern: 'Manuel Silvela 5', unidad: `${m[1]}º ${m[2].toUpperCase()}`, tipo: 'vivienda' };
    // "6ºC C/Manuel Silvela, 5" format (from pendiente facturar)
    m = c.match(/(\d+)º([A-C])\s+C\/Manuel/i);
    if (m) return { edificioPattern: 'Manuel Silvela 5', unidad: `${m[1]}º ${m[2].toUpperCase()}`, tipo: 'vivienda' };
  }

  // Hernández de Tejada 6 (VIRODA - viviendas, NOT garajes)
  // Note: "Viv. C/ Hernández de Tejada 6" = vivienda
  // "Garaje C/Hernández de Tejada 6," = garaje (handled above)
  // Key distinction: "Viv." or "Plaza de Garaje" (addon) vs "Garaje C/" (standalone garaje)
  if ((c.includes('Hernández de Tejada 6') || c.includes('Hernandez de Tejada 6')) && !c.startsWith('Renta Garaje')) {
    m = c.match(/(\d+)º?\s*([A-C])/i);
    if (m) return { edificioPattern: 'Hernández de Tejada 6', unidad: `${m[1]}º ${m[2].toUpperCase()}`, tipo: 'vivienda' };
  }

  // Candelaria Mora 12-14
  if (c.includes('Candelaria Mora')) {
    if (/Antena/i.test(c) || /Edif/i.test(c)) return { edificioPattern: 'Candelaria Mora', unidad: 'Edificio', tipo: 'vivienda' };
    m = c.match(/(\d+)º?\s*([A-E])/i);
    if (m) return { edificioPattern: 'Candelaria Mora', unidad: `${m[1]}º ${m[2].toUpperCase()}`, tipo: 'vivienda' };
  }

  // Reina 15 (VIRODA - viviendas) - handles both "Reina 15" and "Reina, 15"
  if ((c.includes('Reina 15') || c.includes('Reina, 15')) && !c.includes('Local')) {
    m = c.match(/(\d+)º?\s*([A-D])/i);
    if (m) return { edificioPattern: 'Reina 15', unidad: `${m[1]}º ${m[2].toUpperCase()}`, tipo: 'vivienda' };
  }

  // Menéndez Pelayo 15 (VIRODA - viviendas) - handles Menédez/Menéndez/Mdez typos
  if ((/Men[eé](?:n|ñ)?dez Pelayo.?15/i.test(c) || /M[eé]n?[eé]dez Pelayo.?15/i.test(c) || /Mdez Pelayo.*15/i.test(c)) && !c.includes('Local') && !c.includes('Garaje')) {
    if (/[Áá]tico/i.test(c) || /Atico/i.test(c)) return { edificioPattern: 'Menéndez Pelayo', unidad: 'Ático', tipo: 'vivienda' };
    m = c.match(/(\d+)º?D(?:cha)?/i);
    if (m) return { edificioPattern: 'Menéndez Pelayo', unidad: `${m[1]}º Dcha`, tipo: 'vivienda' };
    m = c.match(/(\d+)º?I(?:zq)?/i);
    if (m) return { edificioPattern: 'Menéndez Pelayo', unidad: `${m[1]}º Izq`, tipo: 'vivienda' };
    m = c.match(/(\d+)º?\s*([A-D])/i);
    if (m) return { edificioPattern: 'Menéndez Pelayo', unidad: `${m[1]}º ${m[2].toUpperCase()}`, tipo: 'vivienda' };
  }

  // "Renta pendiente de facturar" - try to extract from the text
  if (/pendiente de facturar/i.test(c)) {
    if (c.includes('Manuel Silvela')) {
      m = c.match(/(\d+)º([A-C])/i);
      if (m) return { edificioPattern: 'Manuel Silvela 5', unidad: `${m[1]}º ${m[2].toUpperCase()}`, tipo: 'vivienda' };
    }
    return null;
  }

  return null;
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

async function main() {
  console.log('====================================================================');
  console.log('  IMPORTACIÓN DE DATOS - ROVIDA & VIRODA');
  console.log('  Fuente: Otro software (Excel exportado)');
  console.log('====================================================================\n');

  // Load parsed data
  const dataPath = path.join(__dirname, '..', 'data-import', 'parsed-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('No se encontró parsed-data.json. Ejecutar el parser Python primero.');
    process.exit(1);
  }
  const data: ParsedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Find companies
  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
  });

  if (!rovida) { console.error('Empresa Rovida no encontrada en BD'); process.exit(1); }
  if (!viroda) { console.error('Empresa Viroda no encontrada en BD'); process.exit(1); }

  console.log(`Rovida: ${rovida.nombre} (${rovida.id})`);
  console.log(`Viroda: ${viroda.nombre} (${viroda.id})\n`);

  // Process each company
  for (const [companyKey, company] of [['rovida', rovida], ['viroda', viroda]] as const) {
    const companyData = data[companyKey];
    console.log('====================================================================');
    console.log(`  PROCESANDO: ${company.nombre}`);
    console.log(`  Clientes: ${companyData.clients.length}`);
    console.log(`  Facturas: ${companyData.invoices.length}`);
    console.log(`  Inquilinos con renta: ${Object.keys(companyData.rentMappings).length}`);
    console.log('====================================================================\n');

    // Get existing buildings and units
    const buildings = await prisma.building.findMany({
      where: { companyId: company.id },
      include: { units: true },
    });

    console.log(`  Edificios existentes: ${buildings.length}`);
    buildings.forEach(b => {
      console.log(`    - ${b.nombre}: ${b.units.length} unidades`);
    });

    // === STEP 1: Delete existing demo tenants and their contracts ===
    console.log('\n--- Paso 1: Limpiar inquilinos existentes ---');
    
    // Delete contracts first (foreign key)
    const deletedContracts = await prisma.contract.deleteMany({
      where: { unit: { building: { companyId: company.id } } },
    });
    console.log(`  Contratos eliminados: ${deletedContracts.count}`);

    // Reset unit tenant assignments
    await prisma.unit.updateMany({
      where: { building: { companyId: company.id }, tenantId: { not: null } },
      data: { tenantId: null, estado: 'disponible' },
    });

    // Delete tenants
    const deletedTenants = await prisma.tenant.deleteMany({
      where: { companyId: company.id },
    });
    console.log(`  Inquilinos eliminados: ${deletedTenants.count}`);

    // === STEP 2: Create tenants from client data ===
    console.log('\n--- Paso 2: Crear inquilinos desde datos de clientes ---');
    
    let tenantsCreated = 0;
    let tenantsSkipped = 0;
    const nifToTenantId: Record<string, string> = {};
    const usedEmails = new Set<string>();
    const usedDnis = new Set<string>();

    // Sort clients: those with rent data first (they are actual tenants)
    const rentNifs = new Set(Object.keys(companyData.rentMappings));
    const sortedClients = [...companyData.clients].sort((a, b) => {
      const aHasRent = rentNifs.has(a.nif) ? 0 : 1;
      const bHasRent = rentNifs.has(b.nif) ? 0 : 1;
      return aHasRent - bHasRent;
    });

    for (const client of sortedClients) {
      // Skip if NIF already processed (dedup)
      if (usedDnis.has(client.nif)) {
        tenantsSkipped++;
        continue;
      }

      // Generate unique email if not provided
      let email = client.email;
      if (!email) {
        const cleanNif = client.nif.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        email = `${cleanNif}@${companyKey}.inmova.local`;
      }
      
      // Ensure email uniqueness
      let finalEmail = email;
      let emailCounter = 1;
      while (usedEmails.has(finalEmail)) {
        finalEmail = email.replace('@', `+${emailCounter}@`);
        emailCounter++;
      }

      // Check if email already exists globally in DB
      const existingByEmail = await prisma.tenant.findFirst({
        where: { email: finalEmail },
      });
      if (existingByEmail) {
        finalEmail = `${client.nif.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.${companyKey}@inmova.local`;
      }

      // Check if DNI already exists globally
      const existingByDni = await prisma.tenant.findFirst({
        where: { dni: client.nif },
      });
      if (existingByDni) {
        // Update existing tenant's company if it belongs to another company
        // Skip - this tenant already exists in another company
        tenantsSkipped++;
        nifToTenantId[client.nif] = existingByDni.id;
        continue;
      }

      const telefono = client.telefono || '000000000';

      try {
        const tenant = await prisma.tenant.create({
          data: {
            companyId: company.id,
            nombreCompleto: client.nombreCompleto,
            dni: client.nif,
            email: finalEmail,
            telefono: telefono,
            fechaNacimiento: new Date('1990-01-01'), // Placeholder
            nacionalidad: client.pais === 'ESPAÑA' ? 'Española' : client.pais || undefined,
            direccionActual: client.direccion || undefined,
            notas: [
              client.medioPago ? `Medio de pago: ${client.medioPago}` : null,
              client.iban ? `IBAN: ${client.iban}` : null,
              `Importado desde otro software (Feb 2026)`,
            ].filter(Boolean).join(' | '),
            isDemo: false,
          },
        });
        nifToTenantId[client.nif] = tenant.id;
        usedEmails.add(finalEmail);
        usedDnis.add(client.nif);
        tenantsCreated++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          // Unique constraint violation - try with modified identifiers
          tenantsSkipped++;
          console.log(`    ⚠️ Duplicado: ${client.nombreCompleto} (${client.nif})`);
        } else {
          console.error(`    ❌ Error creando ${client.nombreCompleto}:`, err.message);
          tenantsSkipped++;
        }
      }
    }

    console.log(`  Inquilinos creados: ${tenantsCreated}`);
    console.log(`  Inquilinos saltados: ${tenantsSkipped}`);

    // === STEP 3: Link tenants to units and create contracts from invoices ===
    console.log('\n--- Paso 3: Vincular inquilinos a unidades (facturación Feb 2026) ---');

    let contractsCreated = 0;
    let unitsUpdated = 0;
    let unmatchedInvoices = 0;

    // Process rent mappings
    for (const [nif, rentEntries] of Object.entries(companyData.rentMappings)) {
      const tenantId = nifToTenantId[nif];
      if (!tenantId) {
        // Tenant might have been skipped due to dedup
        continue;
      }

      // Use the most recent/highest rent entry per unit
      // Group by concepto to avoid duplicates
      const processedUnits = new Set<string>();

      for (const entry of rentEntries) {
        if (!entry.concepto) continue;

        const unitMatch = parseUnitFromConcepto(entry.concepto, entry.operacion || '');
        if (!unitMatch) {
          unmatchedInvoices++;
          continue;
        }

        // Find matching building
        const building = buildings.find(b => {
          const bName = b.nombre.toLowerCase();
          const pattern = unitMatch.edificioPattern.toLowerCase();
          return bName.includes(pattern) || pattern.split(' ').every(part => bName.includes(part));
        });

        if (!building) {
          unmatchedInvoices++;
          continue;
        }

        // Find matching unit
        let unit = building.units.find(u => {
          const uNum = u.numero.toLowerCase().replace(/\s+/g, '');
          const matchNum = unitMatch.unidad.toLowerCase().replace(/\s+/g, '');
          return uNum === matchNum || uNum.includes(matchNum) || matchNum.includes(uNum);
        });

        // If no exact match, try partial
        if (!unit) {
          // For garajes, try to find by number
          const numMatch = unitMatch.unidad.match(/(\d+)/);
          if (numMatch) {
            unit = building.units.find(u => {
              const uNumMatch = u.numero.match(/(\d+)/);
              return uNumMatch && uNumMatch[1] === numMatch[1];
            });
          }
        }

        if (!unit) {
          // Create the unit if it doesn't exist (real data from invoicing)
          try {
            const tipoMap: Record<string, string> = {
              garaje: 'garaje',
              vivienda: 'vivienda',
              local: 'local',
              oficina: 'oficina',
              nave_industrial: 'nave_industrial',
            };
            unit = await prisma.unit.create({
              data: {
                buildingId: building.id,
                numero: unitMatch.unidad,
                tipo: (tipoMap[unitMatch.tipo] || 'vivienda') as any,
                estado: 'disponible',
                superficie: unitMatch.tipo === 'garaje' ? 12 : unitMatch.tipo === 'vivienda' ? 60 : 100,
                rentaMensual: entry.rentaMensual,
                planta: (() => {
                  const floorMatch = unitMatch.unidad.match(/(\d+)º/);
                  return floorMatch ? parseInt(floorMatch[1]) : 0;
                })(),
              },
            });
            // Add to local cache
            building.units.push(unit);
            console.log(`    ➕ Unidad creada: ${building.nombre} - ${unitMatch.unidad}`);
          } catch {
            // Unit creation failed, skip
            continue;
          }
        }

        // Skip if this unit already processed for this tenant
        const unitKey = `${tenantId}-${unit.id}`;
        if (processedUnits.has(unitKey)) continue;
        processedUnits.add(unitKey);

        // Update unit rent and assign tenant
        await prisma.unit.update({
          where: { id: unit.id },
          data: {
            rentaMensual: entry.rentaMensual,
            estado: 'ocupada',
            tenantId: tenantId,
          },
        });
        unitsUpdated++;

        // Create contract
        try {
          // Check if contract already exists
          const existingContract = await prisma.contract.findFirst({
            where: { tenantId, unitId: unit.id },
          });

          if (!existingContract) {
            // Determine contract type
            const contractType = unitMatch.tipo === 'vivienda' ? 'residencial' : 'comercial';

            await prisma.contract.create({
              data: {
                unitId: unit.id,
                tenantId: tenantId,
                fechaInicio: new Date('2025-01-01'),
                fechaFin: new Date('2026-12-31'),
                rentaMensual: entry.rentaMensual,
                deposito: entry.rentaMensual,
                estado: 'activo',
                tipo: contractType as any,
                isDemo: false,
              },
            });
            contractsCreated++;
          }
        } catch {
          // Contract may already exist or other constraint
        }
      }
    }

    console.log(`  Unidades actualizadas (renta+inquilino): ${unitsUpdated}`);
    console.log(`  Contratos creados: ${contractsCreated}`);
    if (unmatchedInvoices > 0) {
      console.log(`  Facturas sin match de unidad: ${unmatchedInvoices}`);
    }

    // === STEP 4: Summary ===
    const finalTenants = await prisma.tenant.count({ where: { companyId: company.id } });
    const finalContracts = await prisma.contract.count({
      where: { unit: { building: { companyId: company.id } } },
    });
    const occupiedUnits = await prisma.unit.count({
      where: { building: { companyId: company.id }, estado: 'ocupada' },
    });
    const totalUnits = await prisma.unit.count({
      where: { building: { companyId: company.id } },
    });

    console.log(`\n  === RESUMEN ${company.nombre} ===`);
    console.log(`  Edificios: ${buildings.length}`);
    console.log(`  Unidades: ${totalUnits} (${occupiedUnits} ocupadas, ${totalUnits - occupiedUnits} disponibles)`);
    console.log(`  Inquilinos: ${finalTenants}`);
    console.log(`  Contratos activos: ${finalContracts}`);

    // Calculate total monthly rent
    const rentAgg = await prisma.contract.aggregate({
      where: {
        unit: { building: { companyId: company.id } },
        estado: 'activo',
      },
      _sum: { rentaMensual: true },
    });
    console.log(`  Renta mensual total: €${(rentAgg._sum.rentaMensual || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
    console.log('');
  }

  console.log('====================================================================');
  console.log('  IMPORTACIÓN COMPLETADA');
  console.log('  Fuente: DATOS CLIENTES + FACTURACION (Feb 2026)');
  console.log('  Los datos del otro software han sustituido los anteriores.');
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
