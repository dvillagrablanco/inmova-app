/**
 * Migración de datos financieros de inquilinos
 * 
 * Extrae IBAN, BIC, método de pago y dirección de las notas
 * y los mueve a los nuevos campos estructurados.
 * 
 * También importa datos de los Excel de clientes donde no se hizo antes.
 * 
 * Uso: npx tsx scripts/migrate-tenant-financial-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Parse IBAN from notas field
function extractIban(notas: string): string | null {
  const match = notas.match(/IBAN:\s*(ES\w{22}|\w{2}\d{2}\s?\w{4}\s?\w{4}\s?\w{4}\s?\w{4}\s?\w{4})/i);
  if (match) return match[1].replace(/\s/g, '');
  return null;
}

function extractBic(notas: string): string | null {
  const match = notas.match(/BIC:\s*(\w{8,11})/i);
  return match ? match[1] : null;
}

function extractMetodoPago(notas: string): string | null {
  const match = notas.match(/Medio de pago:\s*(Recibo|Transferencia|Efectivo|Domiciliación)/i);
  if (match) {
    const map: Record<string, string> = {
      'recibo': 'recibo',
      'transferencia': 'transferencia',
      'efectivo': 'efectivo',
      'domiciliación': 'domiciliacion',
    };
    return map[match[1].toLowerCase()] || match[1].toLowerCase();
  }
  return null;
}

function extractPersonaContacto(notas: string): string | null {
  const match = notas.match(/Contacto:\s*(.+?)(?:\s*\||$)/i);
  return match ? match[1].trim() : null;
}

async function migrateFromNotas() {
  console.log('📋 Migrando datos de notas a campos estructurados...');
  
  const tenants = await prisma.tenant.findMany({
    where: {
      notas: { not: null },
      OR: [
        { iban: null },
        { metodoPago: null },
      ],
    },
    select: { id: true, nombreCompleto: true, notas: true, iban: true, bic: true, metodoPago: true, personaContacto: true },
  });

  let updated = 0;

  for (const tenant of tenants) {
    if (!tenant.notas) continue;
    const updateData: any = {};

    if (!tenant.iban) {
      const iban = extractIban(tenant.notas);
      if (iban) updateData.iban = iban;
    }

    if (!tenant.bic) {
      const bic = extractBic(tenant.notas);
      if (bic) updateData.bic = bic;
    }

    if (!tenant.metodoPago) {
      const metodo = extractMetodoPago(tenant.notas);
      if (metodo) updateData.metodoPago = metodo;
    }

    if (!tenant.personaContacto) {
      const contacto = extractPersonaContacto(tenant.notas);
      if (contacto) updateData.personaContacto = contacto;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: updateData,
      });
      updated++;
    }
  }

  console.log(`  ✅ ${updated} inquilinos actualizados desde notas`);
  return updated;
}

async function migrateFromExcel() {
  console.log('\n📋 Migrando datos adicionales desde Excel...');
  
  const basePath = path.join(process.cwd(), 'data-import/CLIENTES');
  let totalUpdated = 0;

  for (const [file, empresa] of [
    ['DATOS CLIENTES ROVIDA.xlsx', 'Rovida'],
    ['DATOS CLIENTES VIRODA.xlsx', 'Viroda'],
  ] as const) {
    const filePath = path.join(basePath, file);
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const company = await prisma.company.findFirst({
        where: { nombre: { contains: empresa, mode: 'insensitive' } },
      });
      if (!company) continue;

      let updated = 0;
      for (const row of rows.slice(1)) {
        const nif = String(row[1] || '').trim();
        if (!nif) continue;

        const iban = row[11] ? String(row[11]).replace(/\s/g, '').toUpperCase() : null;
        const bic = row[12] ? String(row[12]).trim() : null;
        const metodoPagoRaw = row[9] ? String(row[9]).trim().toLowerCase() : null;
        const metodoPago = metodoPagoRaw === 'recibo' ? 'recibo'
          : metodoPagoRaw === 'transferencia' ? 'transferencia'
          : metodoPagoRaw === 'efectivo' ? 'efectivo'
          : null;
        const personaContacto = row[6] ? String(row[6]).trim() : null;
        const ciudad = row[22] ? String(row[22]).trim() : null;
        const codigoPostal = row[21] ? String(row[21]).trim() : null;
        const provincia = row[23] ? String(row[23]).trim() : null;
        const pais = row[24] ? String(row[24]).trim() : null;

        const tenant = await prisma.tenant.findFirst({
          where: { companyId: company.id, dni: nif },
          select: { id: true, iban: true, ciudad: true, metodoPago: true },
        });

        if (!tenant) continue;

        const updateData: any = {};
        if (!tenant.iban && iban && iban.length >= 15) updateData.iban = iban;
        if (bic) updateData.bic = bic;
        if (!tenant.metodoPago && metodoPago) updateData.metodoPago = metodoPago;
        if (personaContacto) updateData.personaContacto = personaContacto;
        if (!tenant.ciudad && ciudad) updateData.ciudad = ciudad;
        if (codigoPostal) updateData.codigoPostal = codigoPostal;
        if (provincia) updateData.provincia = provincia;
        if (pais && pais !== 'ESPAÑA') updateData.pais = pais;

        if (Object.keys(updateData).length > 0) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: updateData,
          });
          updated++;
        }
      }

      console.log(`  ✅ ${empresa}: ${updated} inquilinos actualizados desde Excel`);
      totalUpdated += updated;
    } catch (error: any) {
      console.log(`  ⚠️ ${empresa}: ${error.message}`);
    }
  }

  return totalUpdated;
}

async function migratePaymentData() {
  console.log('\n📋 Migrando desglose fiscal de facturación a pagos...');
  
  const basePath = path.join(process.cwd(), 'data-import/CLIENTES');
  let totalUpdated = 0;

  for (const [file, empresa] of [
    ['FACTURACION ROVIDA FEB.xlsx', 'Rovida'],
    ['FACTURACION VIRODA FEB.xlsx', 'Viroda'],
  ] as const) {
    const filePath = path.join(basePath, file);
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const company = await prisma.company.findFirst({
        where: { nombre: { contains: empresa, mode: 'insensitive' } },
      });
      if (!company) continue;

      let updated = 0;
      let currentNif = '';
      let currentConcepto = '';

      for (const row of rows.slice(2)) {
        if (row[0]) {
          currentNif = String(row[3] || '').trim();
          currentConcepto = String(row[11] || '').trim();
        }
        
        const concepto = String(row[11] || '').trim();
        if (!concepto.startsWith('Renta') || !currentNif) continue;
        
        const baseImponible = typeof row[13] === 'number' ? Math.abs(row[13]) : null;
        const ivaPercent = String(row[15] || '');
        const irpfPercent = String(row[16] || '');

        if (!baseImponible) continue;

        // Find tenant and their active contract
        const tenant = await prisma.tenant.findFirst({
          where: { companyId: company.id, dni: currentNif },
          select: { id: true, contracts: { where: { estado: 'activo' }, select: { id: true }, take: 1 } },
        });

        if (!tenant || !tenant.contracts[0]) continue;

        // Find Feb 2026 payment for this contract
        const payment = await prisma.payment.findFirst({
          where: {
            contractId: tenant.contracts[0].id,
            periodo: '2026-02',
            concepto: null, // Only update if not already filled
          },
        });

        if (!payment) continue;

        // Calculate IVA and IRPF amounts
        const iva = ivaPercent.includes('21') ? baseImponible * 0.21
          : ivaPercent.includes('10') ? baseImponible * 0.10
          : ivaPercent.includes('Exento') ? 0
          : null;

        const irpf = irpfPercent.includes('19') ? baseImponible * 0.19
          : irpfPercent.includes('15') ? baseImponible * 0.15
          : 0;

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            concepto,
            baseImponible,
            iva: iva || undefined,
            irpf: irpf || undefined,
          },
        });
        updated++;
      }

      console.log(`  ✅ ${empresa}: ${updated} pagos actualizados con desglose fiscal`);
      totalUpdated += updated;
    } catch (error: any) {
      console.log(`  ⚠️ ${empresa}: ${error.message}`);
    }
  }

  return totalUpdated;
}

async function migrateContractCodes() {
  console.log('\n📋 Migrando códigos de operación contable a contratos...');
  
  const basePath = path.join(process.cwd(), 'data-import/CLIENTES');
  let totalUpdated = 0;

  for (const [file, empresa] of [
    ['FACTURACION ROVIDA FEB.xlsx', 'Rovida'],
    ['FACTURACION VIRODA FEB.xlsx', 'Viroda'],
  ] as const) {
    const filePath = path.join(basePath, file);
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const company = await prisma.company.findFirst({
        where: { nombre: { contains: empresa, mode: 'insensitive' } },
      });
      if (!company) continue;

      let updated = 0;
      for (const row of rows.slice(2)) {
        if (!row[0] || !row[3]) continue;
        
        const nif = String(row[3]).trim();
        const operacion = String(row[6] || '');
        
        // Extract code: "7520004005 - Ing. Arrend Garajes..." → "7520004005"
        const codeMatch = operacion.match(/^(\d{10})/);
        if (!codeMatch) continue;
        const code = codeMatch[1];

        const tenant = await prisma.tenant.findFirst({
          where: { companyId: company.id, dni: nif },
          select: { contracts: { where: { estado: 'activo', codigoOperacion: null }, select: { id: true }, take: 1 } },
        });

        if (!tenant?.contracts[0]) continue;

        await prisma.contract.update({
          where: { id: tenant.contracts[0].id },
          data: { codigoOperacion: code },
        });
        updated++;
      }

      console.log(`  ✅ ${empresa}: ${updated} contratos con código operación`);
      totalUpdated += updated;
    } catch (error: any) {
      console.log(`  ⚠️ ${empresa}: ${error.message}`);
    }
  }

  return totalUpdated;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  MIGRACIÓN DE DATOS FINANCIEROS');
  console.log('═══════════════════════════════════════════════════════════');

  const fromNotas = await migrateFromNotas();
  const fromExcel = await migrateFromExcel();
  const payments = await migratePaymentData();
  const contracts = await migrateContractCodes();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESUMEN MIGRACIÓN');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📝 Inquilinos (notas → campos): ${fromNotas}`);
  console.log(`  📊 Inquilinos (Excel → campos): ${fromExcel}`);
  console.log(`  💰 Pagos con desglose fiscal: ${payments}`);
  console.log(`  📄 Contratos con código operación: ${contracts}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
