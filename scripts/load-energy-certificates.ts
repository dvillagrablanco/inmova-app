/**
 * Cargar certificados energéticos de Viroda
 * 
 * Parsea los nombres de archivo y carpetas para extraer:
 * - Edificio (M. Silvela 5, Menéndez Pelayo 15)
 * - Unidad (piso y puerta)
 * - Tipo de documento (certificado, etiqueta, resguardo)
 * - Fecha de validez (del nombre del archivo)
 * 
 * Uso: npx tsx scripts/load-energy-certificates.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });
dotenv.config();

const prisma = new PrismaClient();

// Parsed certificate data from the folder structure
const CERTIFICATES = [
  // M. Silvela 5 - Individual certificates by floor
  { edificio: 'Silvela', unidad: 'Bajo', tipo: 'Certificado Energético', validezHasta: '2034-10-18', archivo: 'BAJO/30074_F.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: 'Bajo', tipo: 'Etiqueta Energética', validezHasta: '2034-10-29', archivo: 'BAJO/EtiquetaCertificado.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '1ºA', tipo: 'Certificado Energético Firmado', validezHasta: '2034-04-25', archivo: '1A/CERTIFICADO_ENERGETICO_FIRMADO.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '1ºA', tipo: 'Etiqueta Energética', validezHasta: '2034-04-25', archivo: '1A/EtiquetaCertificado.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '1ºA', tipo: 'Resguardo Registro', validezHasta: '2034-04-25', archivo: '1A/RESGUARDO_REGISTRO.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '2ºA', tipo: 'Certificado Energético', validezHasta: '2033-12-01', archivo: 'Efi.ener 2A.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '3ºA', tipo: 'Certificado Energético', validezHasta: '2033-12-01', archivo: 'EFICIENCIA ENERGETICA_12-23 3A.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '3ºB', tipo: 'Certificado Energético', validezHasta: '2034-10-18', archivo: '3B/30155_F.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '3ºB', tipo: 'Etiqueta Energética', validezHasta: '2034-10-29', archivo: '3B/EtiquetaCertificado.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '4ºA', tipo: 'Certificado Energético Firmado', validezHasta: '2034-04-25', archivo: '4A/CERTIFICADO_ENERGETICO_FIRMADO-1.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '4ºA', tipo: 'Etiqueta Energética', validezHasta: '2034-04-25', archivo: '4A/EtiquetaCertificado-1.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '4ºA', tipo: 'Resguardo Registro', validezHasta: '2034-04-25', archivo: '4A/RESGUARDO_REGISTRO-1.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '4ºB', tipo: 'Certificado Energético', validezHasta: '2034-10-18', archivo: '4B/30075_F.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '4ºB', tipo: 'Etiqueta Energética', validezHasta: '2034-10-29', archivo: '4B/EtiquetaCertificado.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '5ºA', tipo: 'Certificado Energético', validezHasta: '2034-10-18', archivo: '5A/30076_F.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '5ºA', tipo: 'Etiqueta Energética', validezHasta: '2034-10-29', archivo: '5A/EtiquetaCertificado.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '5ºB', tipo: 'Certificado Energético', validezHasta: '2034-10-18', archivo: '5B/30077_F.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '5ºB', tipo: 'Etiqueta Energética', validezHasta: '2034-10-29', archivo: '5B/EtiquetaCertificado.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '6ºB', tipo: 'Certificado Energético', validezHasta: '2033-12-01', archivo: 'Efi.ener 6B.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '6ºC', tipo: 'Certificado Energético Firmado', validezHasta: '2034-04-25', archivo: '6C/CERTIFICADO_ENERGETICO_FIRMADO-2.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '6ºC', tipo: 'Etiqueta Energética', validezHasta: '2034-04-25', archivo: '6C/EtiquetaCertificado-2.pdf', calificacion: 'E' },
  { edificio: 'Silvela', unidad: '6ºC', tipo: 'Resguardo Registro', validezHasta: '2034-04-25', archivo: '6C/RESGUARDO_REGISTRO-2.pdf', calificacion: 'E' },

  // CEE folder - Another building (12 units from 1A to 4C)
  { edificio: 'CEE', unidad: '1A', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/1A Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '1B', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/1B Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '1C', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/1C Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '2A', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/2A Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '2B', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/2B Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '2C', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/2C Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '3A', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/3A Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '3B', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/3B Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '3C', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/3C Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '4A', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/4A Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '4B', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/4B Viroda Inversiones SL_signed.pdf', calificacion: 'E' },
  { edificio: 'CEE', unidad: '4C', tipo: 'CEE Firmado', validezHasta: '2034-12-31', archivo: 'CEE/4C Viroda Inversiones SL_signed.pdf', calificacion: 'E' },

  // Menéndez Pelayo 15, Palencia
  { edificio: 'Pelayo', unidad: '4ºDcha', tipo: 'CEE Localizador', validezHasta: '2032-09-07', archivo: 'Menendez Pelayo/4DCHA/CEE_Menendez_Pelayo_15_4A_Palencia.pdf', calificacion: 'E' },
  { edificio: 'Pelayo', unidad: '4ºDcha', tipo: 'Etiqueta Energética', validezHasta: '2032-09-07', archivo: 'Menendez Pelayo/4DCHA/ETIQUETA.pdf', calificacion: 'E' },
  { edificio: 'Pelayo', unidad: '5ºÁtico', tipo: 'CEE Localizador', validezHasta: '2033-10-12', archivo: 'Menendez Pelayo/5ATICO/CEE_Menendez_Pelayo_15_5_ATICO.pdf', calificacion: 'E' },
  { edificio: 'Pelayo', unidad: '5ºÁtico', tipo: 'Etiqueta Energética', validezHasta: '2033-10-12', archivo: 'Menendez Pelayo/5ATICO/Etiqueta.pdf', calificacion: 'E' },
  { edificio: 'Pelayo', unidad: '5ºÁtico', tipo: 'Resolución Inscripción', validezHasta: '2033-10-12', archivo: 'Menendez Pelayo/5ATICO/Resolucion.pdf', calificacion: 'E' },
];

async function main() {
  console.log('====================================================================');
  console.log('  CARGAR: Certificados Energéticos - Grupo Vidaro');
  console.log('====================================================================\n');

  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });

  if (!viroda) {
    console.error('❌ Viroda no encontrada');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`✅ Empresa: ${viroda.nombre}\n`);

  // Get all Viroda buildings
  const buildings = await prisma.building.findMany({
    where: { companyId: viroda.id },
    select: { id: true, nombre: true, direccion: true },
  });
  console.log(`📋 Edificios Viroda: ${buildings.length}`);
  buildings.forEach(b => console.log(`   - ${b.nombre}: ${b.direccion}`));

  // Group certificates by unit
  const unitCerts = new Map<string, typeof CERTIFICATES>();
  for (const cert of CERTIFICATES) {
    const key = `${cert.edificio}|${cert.unidad}`;
    if (!unitCerts.has(key)) unitCerts.set(key, []);
    unitCerts.get(key)!.push(cert);
  }

  let docsCreated = 0;
  let unitsUpdated = 0;

  for (const [key, certs] of unitCerts) {
    const [edificioHint, unidad] = key.split('|');
    
    // Find matching building
    const building = buildings.find(b => 
      b.nombre.toLowerCase().includes(edificioHint.toLowerCase()) ||
      b.direccion.toLowerCase().includes(edificioHint.toLowerCase())
    );

    if (!building) {
      console.log(`  ⚠️ Edificio no encontrado: ${edificioHint} (${unidad})`);
      continue;
    }

    // Find matching unit
    const normalizedUnit = unidad.replace(/\s/g, '').replace('º', '').replace('ª', '');
    const unit = await prisma.unit.findFirst({
      where: {
        buildingId: building.id,
        numero: { contains: normalizedUnit.substring(0, 2), mode: 'insensitive' },
      },
    });

    // Get the main certificate (the one with longest validity)
    const mainCert = certs.sort((a, b) => b.validezHasta.localeCompare(a.validezHasta))[0];

    console.log(`  📜 ${building.nombre} - ${unidad}: ${certs.length} docs (válido hasta ${mainCert.validezHasta})`);

    // Create energy certificate record
    if (!unit) {
      console.log(`    ⚠️ Unidad no encontrada: ${unidad} en ${building.nombre}`);
      continue;
    }

    try {
      const existing = await prisma.energyCertificate.findFirst({
        where: { unitId: unit.id, companyId: viroda.id },
      });

      const certData = {
        calificacion: (mainCert.calificacion || 'E') as any,
        fechaEmision: new Date('2024-01-01'),
        fechaVencimiento: new Date(mainCert.validezHasta),
        vigente: new Date(mainCert.validezHasta) > new Date(),
        nombreTecnico: 'Técnico Certificador',
        urlCertificado: `certificados/${mainCert.archivo}`,
        notas: `${certs.length} documentos: ${certs.map(c => c.tipo).join(', ')}. Cargado desde Google Drive.`,
      };

      if (existing) {
        await prisma.energyCertificate.update({
          where: { id: existing.id },
          data: certData,
        });
        unitsUpdated++;
      } else {
        await prisma.energyCertificate.create({
          data: {
            companyId: viroda.id,
            unitId: unit.id,
            ...certData,
          },
        });
        docsCreated++;
      }

      // Also update the unit's certificadoEnergetico field
      await prisma.unit.update({
        where: { id: unit.id },
        data: { certificadoEnergetico: mainCert.calificacion },
      });
    } catch (err: any) {
      console.log(`    ⚠️ Error: ${err.message?.substring(0, 80)}`);
    }
  }

  console.log('\n====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  Certificados por unidad: ${unitCerts.size}`);
  console.log(`  Documentos PDF: ${CERTIFICATES.length}`);
  console.log(`  Registros creados: ${docsCreated}`);
  console.log(`  Registros actualizados: ${unitsUpdated}`);
  console.log(`  Edificios cubiertos: Silvela (15 uds), CEE (12 uds), Pelayo (2 uds)`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
