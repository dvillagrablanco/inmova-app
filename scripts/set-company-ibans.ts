/**
 * Script: Configurar IBANs de las sociedades Rovida y Viroda
 * 
 * Actualiza el campo company.iban con las cuentas reales de Bankinter.
 * Necesario para que la importación Norma 43 vincule automáticamente
 * los extractos con la sociedad correcta.
 * 
 * Cuentas Bankinter (entidad 0128, oficina 0250):
 * - Rovida S.L.:                ES56 0128 0250 5901 0008 3954
 * - VIRODA INVERSIONES S.L.U.:  ES88 0128 0250 5901 0008 1826
 * 
 * Uso: npx tsx scripts/set-company-ibans.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMPANY_IBANS: Array<{ id: string; nombre: string; iban: string }> = [
  {
    id: 'rovida-sl',
    nombre: 'Rovida S.L.',
    iban: 'ES5601280250590100083954',
  },
  {
    id: 'viroda-inversiones',
    nombre: 'VIRODA INVERSIONES S.L.U.',
    iban: 'ES8801280250590100081826',
  },
];

async function main() {
  console.log('============================================================');
  console.log('  CONFIGURAR IBANs DE BANKINTER - ROVIDA Y VIRODA');
  console.log('============================================================\n');

  for (const entry of COMPANY_IBANS) {
    const company = await prisma.company.findUnique({
      where: { id: entry.id },
      select: { id: true, nombre: true, iban: true },
    });

    if (!company) {
      console.log(`  X ${entry.nombre} (${entry.id}) — NO ENCONTRADA en BD`);
      continue;
    }

    const ibanFormatted = entry.iban.replace(/(.{4})/g, '$1 ').trim();

    if (company.iban === entry.iban) {
      console.log(`  = ${entry.nombre} — IBAN ya configurado: ${ibanFormatted}`);
      continue;
    }

    await prisma.company.update({
      where: { id: entry.id },
      data: { iban: entry.iban },
    });

    const prev = company.iban || '(vacío)';
    console.log(`  OK ${entry.nombre}`);
    console.log(`     Anterior: ${prev}`);
    console.log(`     Nuevo:    ${ibanFormatted}`);
    console.log(`     Banco:    Bankinter (0128), Oficina 0250\n`);
  }

  // Verificar Vidaro (holding) también
  const vidaro = await prisma.company.findUnique({
    where: { id: 'vidaro-inversiones' },
    select: { id: true, nombre: true, iban: true },
  });

  if (vidaro) {
    console.log(`  i  ${vidaro.nombre} — IBAN: ${vidaro.iban || '(sin configurar, pendiente)'}`);
    console.log(`     Si Vidaro tiene cuenta propia en Bankinter, actualizar manualmente.\n`);
  }

  console.log('============================================================');
  console.log('  RESUMEN');
  console.log('============================================================');
  console.log('  Rovida S.L.:    ES56 0128 0250 5901 0008 3954');
  console.log('  Viroda Inv.:    ES88 0128 0250 5901 0008 1826');
  console.log('  Banco:          Bankinter (código entidad 0128)');
  console.log('  Oficina:        0250');
  console.log('============================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
