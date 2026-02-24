/**
 * Script de importación de datos de clientes y facturación
 * Rovida y Viroda - Febrero 2026
 * 
 * Fuente: Google Drive - CLIENTES/
 * - DATOS CLIENTES ROVIDA.xlsx (247 clientes)
 * - DATOS CLIENTES VIRODA.xlsx (153 clientes)
 * - FACTURACION ROVIDA FEB.xlsx (123 facturas)
 * - FACTURACION VIRODA FEB.xlsx (127 facturas)
 * 
 * Uso: npx tsx scripts/import-rovida-viroda-feb2026.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================================
// HELPERS
// ============================================================================

function cleanString(val: any): string {
  if (!val) return '';
  return String(val).trim();
}

function cleanEmail(val: any): string | null {
  const email = cleanString(val).toLowerCase();
  if (!email || !email.includes('@')) return null;
  return email;
}

function cleanPhone(val: any): string | null {
  const phone = cleanString(val).replace(/\s+/g, '');
  if (!phone || phone.length < 6) return null;
  return phone;
}

function cleanIban(val: any): string | null {
  const iban = cleanString(val).replace(/\s+/g, '').toUpperCase();
  if (!iban || iban.length < 15) return null;
  return iban;
}

function parseAddress(row: any[]): string {
  const parts = [
    row[15] ? `${row[15]} ` : '', // Tipo de vía
    cleanString(row[16]),          // Dirección
    row[17] ? `, ${row[17]}` : '', // Número
    row[18] ? `, Piso ${row[18]}` : '', // Piso
    row[19] ? `, Esc. ${row[19]}` : '', // Escalera
    row[20] ? `, Pta. ${row[20]}` : '', // Puerta
  ];
  return parts.join('').trim() || '';
}

function parseCurrency(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return Math.abs(val);
  const str = String(val).replace(/[€\s]/g, '').replace('.', '').replace(',', '.');
  return Math.abs(parseFloat(str) || 0);
}

// ============================================================================
// IMPORTAR CLIENTES (INQUILINOS)
// ============================================================================

async function importClients(filePath: string, companyId: string, companyName: string) {
  console.log(`\n📋 Importando clientes de ${companyName}...`);
  
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const dataRows = rows.slice(1).filter(r => r[1]); // Skip header, require NIF
  
  let created = 0, updated = 0, skipped = 0;
  
  for (const row of dataRows) {
    const nif = cleanString(row[1]);
    const razonSocial = cleanString(row[2]);
    const nombreComercial = cleanString(row[3]);
    const email = cleanEmail(row[4]);
    const telefono = cleanPhone(row[5]);
    const personaContacto = cleanString(row[6]);
    const activo = cleanString(row[8]) === 'Sí';
    const medioPago = cleanString(row[9]);
    const iban = cleanIban(row[11]);
    const bic = cleanString(row[12]);
    const direccion = parseAddress(row);
    const codigoPostal = cleanString(row[21]);
    const poblacion = cleanString(row[22]);
    const provincia = cleanString(row[23]);
    const pais = cleanString(row[24]) || 'ESPAÑA';

    if (!nif || !razonSocial) {
      skipped++;
      continue;
    }

    // Nombre completo: usar nombre comercial o razón social
    const nombreCompleto = nombreComercial || razonSocial;
    
    // Buscar si ya existe por NIF en esta empresa
    const existing = await prisma.tenant.findFirst({
      where: {
        companyId,
        OR: [
          { dni: nif },
          { nombreCompleto: { equals: nombreCompleto, mode: 'insensitive' } },
        ],
      },
    });

    const tenantData = {
      nombreCompleto,
      dni: nif,
      email: email || existing?.email || null,
      telefono: telefono || existing?.telefono || null,
      direccion: direccion || existing?.direccion || null,
      ciudad: poblacion || existing?.ciudad || null,
      provincia: provincia || existing?.provincia || null,
      codigoPostal: codigoPostal || existing?.codigoPostal || null,
      pais: pais,
      activo,
      notas: [
        medioPago ? `Medio de pago: ${medioPago}` : '',
        iban ? `IBAN: ${iban}` : '',
        bic ? `BIC: ${bic}` : '',
        personaContacto ? `Contacto: ${personaContacto}` : '',
      ].filter(Boolean).join(' | ') || null,
    };

    if (existing) {
      // Actualizar solo campos que estén vacíos o mejorar datos
      const updateData: any = {};
      if (!existing.dni && nif) updateData.dni = nif;
      if (!existing.email && email) updateData.email = email;
      if (!existing.telefono && telefono) updateData.telefono = telefono;
      if (!existing.direccion && direccion) updateData.direccion = direccion;
      if (!existing.ciudad && poblacion) updateData.ciudad = poblacion;
      if (!existing.provincia && provincia) updateData.provincia = provincia;
      if (!existing.codigoPostal && codigoPostal) updateData.codigoPostal = codigoPostal;
      if (iban && (!existing.notas || !existing.notas.includes('IBAN'))) {
        updateData.notas = tenantData.notas;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.tenant.update({
          where: { id: existing.id },
          data: updateData,
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      // Crear nuevo inquilino
      try {
        await prisma.tenant.create({
          data: {
            ...tenantData,
            companyId,
          },
        });
        created++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          skipped++; // Duplicate
        } else {
          console.error(`  ❌ Error creando ${nombreCompleto}: ${error.message}`);
          skipped++;
        }
      }
    }
  }

  console.log(`  ✅ ${companyName}: ${created} creados, ${updated} actualizados, ${skipped} sin cambios`);
  return { created, updated, skipped };
}

// ============================================================================
// IMPORTAR FACTURACIÓN (PAGOS)
// ============================================================================

async function importInvoices(filePath: string, companyId: string, companyName: string) {
  console.log(`\n💰 Importando facturación de ${companyName}...`);
  
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const dataRows = rows.slice(2); // Skip 2 header rows
  
  let created = 0, updated = 0, skipped = 0;
  let currentFactura: any = null;
  
  for (const row of dataRows) {
    // Si tiene número de factura, es una nueva factura
    if (row[0]) {
      // Procesar factura anterior si existe
      if (currentFactura) {
        const result = await processInvoice(currentFactura, companyId);
        if (result === 'created') created++;
        else if (result === 'updated') updated++;
        else skipped++;
      }
      
      currentFactura = {
        numero: cleanString(row[0]),
        referencia: cleanString(row[1]),
        fecha: cleanString(row[2]),
        nifCliente: cleanString(row[3]),
        nombreCliente: cleanString(row[4]),
        tipoOperacion: cleanString(row[5]),
        operacion: cleanString(row[6]),
        baseImporte: parseCurrency(row[7]),
        iva: parseCurrency(row[8]),
        irpf: parseCurrency(row[9]),
        total: parseCurrency(row[10]),
        concepto: cleanString(row[11]),
        lineas: [],
      };
    }
    
    // Siempre agregar línea de detalle si hay concepto
    if (row[11] && currentFactura) {
      currentFactura.lineas.push({
        concepto: cleanString(row[11]),
        unidades: row[12] || 1,
        precioUd: parseCurrency(row[13]),
        iva: cleanString(row[15]),
        totalLinea: cleanString(row[17]),
      });
    }
  }
  
  // Procesar última factura
  if (currentFactura) {
    const result = await processInvoice(currentFactura, companyId);
    if (result === 'created') created++;
    else if (result === 'updated') updated++;
    else skipped++;
  }
  
  console.log(`  ✅ ${companyName}: ${created} pagos creados, ${updated} actualizados, ${skipped} sin cambios`);
  return { created, updated, skipped };
}

async function processInvoice(factura: any, companyId: string): Promise<string> {
  if (!factura.numero || !factura.nifCliente) return 'skipped';
  
  // Buscar inquilino por NIF
  const tenant = await prisma.tenant.findFirst({
    where: {
      companyId,
      dni: factura.nifCliente,
    },
  });
  
  if (!tenant) return 'skipped';

  // Buscar contrato activo del inquilino
  const contract = await prisma.contract.findFirst({
    where: {
      tenantId: tenant.id,
      estado: 'activo',
    },
    select: { id: true, unitId: true },
  });

  // Parsear fecha
  let fechaPago: Date;
  try {
    const parts = factura.fecha.split('/');
    fechaPago = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } catch {
    fechaPago = new Date(2026, 1, 1); // Feb 2026 default
  }

  // Verificar si ya existe el pago con este nº de factura
  const existingPayment = await prisma.payment.findFirst({
    where: {
      companyId,
      referencia: factura.numero,
    },
  });

  if (existingPayment) return 'skipped';

  // Crear pago
  try {
    await prisma.payment.create({
      data: {
        companyId,
        tenantId: tenant.id,
        contractId: contract?.id || null,
        unitId: contract?.unitId || null,
        monto: factura.total,
        montoBase: factura.baseImporte,
        iva: factura.iva,
        concepto: factura.concepto || `Factura ${factura.numero}`,
        referencia: factura.numero,
        estado: 'pagado',
        fechaVencimiento: fechaPago,
        fechaPago: fechaPago,
        metodoPago: 'transferencia',
        notas: [
          `Operación: ${factura.operacion}`,
          factura.lineas.length > 1 ? `${factura.lineas.length} líneas de detalle` : '',
        ].filter(Boolean).join(' | '),
      },
    });
    return 'created';
  } catch (error: any) {
    if (error.code === 'P2002') return 'skipped';
    console.error(`  ❌ Error procesando factura ${factura.numero}: ${error.message}`);
    return 'skipped';
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  IMPORTACIÓN ROVIDA & VIRODA - Febrero 2026');
  console.log('═══════════════════════════════════════════════════════════');

  // Buscar empresas
  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
  });

  if (!rovida) {
    console.error('❌ No se encontró la empresa Rovida');
    return;
  }
  if (!viroda) {
    console.error('❌ No se encontró la empresa Viroda');
    return;
  }

  console.log(`\n🏢 Rovida: ${rovida.id} (${rovida.nombre})`);
  console.log(`🏢 Viroda: ${viroda.id} (${viroda.nombre})`);

  const basePath = path.join(process.cwd(), 'data-import/CLIENTES');

  // 1. Importar clientes
  const rovidaClients = await importClients(
    path.join(basePath, 'DATOS CLIENTES ROVIDA.xlsx'),
    rovida.id,
    'Rovida'
  );
  const virodaClients = await importClients(
    path.join(basePath, 'DATOS CLIENTES VIRODA.xlsx'),
    viroda.id,
    'Viroda'
  );

  // 2. Importar facturación
  const rovidaInvoices = await importInvoices(
    path.join(basePath, 'FACTURACION ROVIDA FEB.xlsx'),
    rovida.id,
    'Rovida'
  );
  const virodaInvoices = await importInvoices(
    path.join(basePath, 'FACTURACION VIRODA FEB.xlsx'),
    viroda.id,
    'Viroda'
  );

  // Resumen
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESUMEN DE IMPORTACIÓN');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n  CLIENTES:`);
  console.log(`    Rovida: ${rovidaClients.created} nuevos, ${rovidaClients.updated} actualizados`);
  console.log(`    Viroda: ${virodaClients.created} nuevos, ${virodaClients.updated} actualizados`);
  console.log(`\n  FACTURACIÓN FEB 2026:`);
  console.log(`    Rovida: ${rovidaInvoices.created} pagos registrados`);
  console.log(`    Viroda: ${virodaInvoices.created} pagos registrados`);
  console.log('');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
