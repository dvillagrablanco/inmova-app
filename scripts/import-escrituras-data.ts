/**
 * Script para importar datos extraídos de las escrituras de compraventa
 * a la base de datos de la app (AssetAcquisition, Building, Unit, Document).
 *
 * Datos fuente: data/escrituras-metadata.json
 * Escrituras PDF: data/viroda/escrituras/ y data/rovida/escrituras/
 *
 * Uso: npx tsx scripts/import-escrituras-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface EscrituraFinca {
  numero?: number;
  descripcion: string;
  superficie_construida?: number;
  superficie_util?: number;
  ref_catastral?: string;
  valor?: number;
  garaje_anejo?: string;
  cuota?: number;
  registro?: string;
  nota?: string;
}

interface EscrituraData {
  numero: number;
  fecha: string;
  tipo: string;
  notario: string | null;
  comprador: string | null;
  comprador_nif?: string;
  vendedor: string | null;
  vendedor_nif?: string;
  empresa: string;
  inmueble: string | null;
  edificio_app: string | null;
  precio_total: number | null;
  forma_pago?: string;
  estado: string;
  archivo: string;
  texto_extraible: boolean;
  fincas: EscrituraFinca[];
}

async function findCompany(hint: string) {
  return prisma.company.findFirst({
    where: {
      OR: [
        { nombre: { contains: hint, mode: 'insensitive' } },
        { razonSocial: { contains: hint, mode: 'insensitive' } },
      ],
    },
  });
}

async function findBuilding(name: string) {
  return prisma.building.findFirst({
    where: {
      OR: [
        { nombre: { contains: name, mode: 'insensitive' } },
        { direccion: { contains: name, mode: 'insensitive' } },
      ],
    },
    include: { units: true },
  });
}

async function createDocumentRecord(
  companyId: string,
  buildingId: string | null,
  escritura: EscrituraData
) {
  const fileName = path.basename(escritura.archivo);
  const existing = await prisma.document.findFirst({
    where: {
      nombre: { contains: `Escritura_${escritura.numero}` },
      companyId,
    },
  });

  if (existing) {
    console.log(`    Doc ya existe: ${existing.nombre}`);
    return existing;
  }

  return prisma.document.create({
    data: {
      nombre: fileName.replace('.pdf', ''),
      tipo: 'escritura_propiedad',
      descripcion: `${escritura.tipo} - ${escritura.inmueble || 'N/A'} (${escritura.fecha})`,
      cloudStoragePath: escritura.archivo,
      companyId,
      ...(buildingId && { buildingId }),
      tags: ['escritura', 'compraventa', escritura.estado.toLowerCase()].filter(Boolean),
    },
  });
}

async function createAssetAcquisition(
  companyId: string,
  buildingId: string | null,
  escritura: EscrituraData
) {
  if (!escritura.precio_total && escritura.fincas.length === 0) return null;

  const existing = await prisma.assetAcquisition.findFirst({
    where: {
      companyId,
      ...(buildingId && { buildingId }),
      fechaAdquisicion: new Date(escritura.fecha),
    },
  });

  if (existing) {
    console.log(`    AssetAcquisition ya existe para ${escritura.edificio_app || escritura.inmueble}`);
    return existing;
  }

  const notas = [
    `Escritura nº ${escritura.numero}`,
    escritura.notario ? `Notario: ${escritura.notario}` : null,
    escritura.vendedor ? `Vendedor: ${escritura.vendedor}` : null,
    escritura.forma_pago ? `Forma pago: ${escritura.forma_pago}` : null,
    `Estado: ${escritura.estado}`,
  ]
    .filter(Boolean)
    .join('\n');

  return prisma.assetAcquisition.create({
    data: {
      companyId,
      ...(buildingId && { buildingId }),
      assetType: 'edificio',
      fechaAdquisicion: new Date(escritura.fecha),
      precioCompra: escritura.precio_total || 0,
      notas,
    },
  });
}

async function updateCandelariaMoraUnits(building: any, fincas: EscrituraFinca[]) {
  if (!building?.units?.length || !fincas.length) return;

  console.log(`\n  Actualizando unidades de ${building.nombre} con datos de escritura...`);

  const unitMapping: Record<string, string> = {
    'Vivienda 1ºA Bloque A': '1º A',
    'Vivienda 1ºB Bloque A': '1º B',
    'Vivienda 1ºC Bloque A': '1º C',
    'Vivienda 1ºD Dúplex Bloque B (plantas 1ª y 2ª)': '1º D',
    'Vivienda 1ºE Dúplex Bloque B (plantas 1ª y 2ª)': '1º E',
    'Vivienda 2ºA Bloque A': '2º A',
    'Vivienda 2ºB Bloque A': '2º B',
    'Vivienda 2ºC Bloque A': '2º C',
    'Vivienda 3ºA Bloque A': '3º A',
    'Vivienda 3ºB Bloque A': '3º B',
    'Vivienda 3ºC Bloque A': '3º C',
    'Vivienda 4ºA Bloque A': '4º A',
    'Vivienda 4ºB Bloque A': '4º B',
    'Vivienda 4ºC Bloque A': '4º C',
  };

  for (const finca of fincas) {
    const unitNumero = unitMapping[finca.descripcion];
    if (!unitNumero) continue;

    const unit = building.units.find(
      (u: any) => u.numero === unitNumero || u.numero.replace(/\s/g, '') === unitNumero.replace(/\s/g, '')
    );

    if (!unit) {
      console.log(`    ⚠ Unidad "${unitNumero}" no encontrada`);
      continue;
    }

    const changes: string[] = [];
    if (finca.superficie_construida && unit.superficie !== finca.superficie_construida)
      changes.push(`superficie: ${unit.superficie}→${finca.superficie_construida}`);
    if (finca.superficie_util && unit.superficieUtil !== finca.superficie_util)
      changes.push(`superficieUtil: ${unit.superficieUtil ?? 'null'}→${finca.superficie_util}`);

    if (changes.length > 0) {
      await prisma.unit.update({
        where: { id: unit.id },
        data: {
          ...(finca.superficie_construida && { superficie: finca.superficie_construida }),
          ...(finca.superficie_util && { superficieUtil: finca.superficie_util }),
        },
      });
      console.log(`    ✓ ${unitNumero}: ${changes.join(', ')}`);
    }
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('IMPORTACIÓN DE DATOS DE ESCRITURAS');
  console.log('='.repeat(70));

  const metadataPath = path.join(__dirname, '..', 'data', 'escrituras-metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  const escrituras: EscrituraData[] = metadata.escrituras;

  console.log(`\nEscrituras a procesar: ${escrituras.length}`);

  const viroda = await findCompany('Viroda');
  const rovida = await findCompany('Rovida');

  if (!viroda) {
    console.error('ERROR: No se encontró la empresa Viroda');
    process.exit(1);
  }
  if (!rovida) {
    console.error('ERROR: No se encontró la empresa Rovida');
    process.exit(1);
  }

  console.log(`Viroda: ${viroda.nombre} (${viroda.id})`);
  console.log(`Rovida: ${rovida.nombre} (${rovida.id})`);

  for (const escritura of escrituras) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📜 Escritura ${escritura.numero} (${escritura.fecha})`);
    console.log(`   ${escritura.tipo}: ${escritura.inmueble || 'N/A'}`);
    console.log(`   Empresa: ${escritura.empresa} | Estado: ${escritura.estado}`);

    let companies: { id: string; nombre: string }[] = [];
    if (escritura.empresa === 'viroda') companies = [viroda];
    else if (escritura.empresa === 'rovida') companies = [rovida];
    else companies = [rovida, viroda];

    let building = null;
    if (escritura.edificio_app) {
      building = await findBuilding(escritura.edificio_app);
      if (building) {
        console.log(`   Edificio encontrado: ${building.nombre} (${building.units.length} uds)`);
      } else {
        console.log(`   ⚠ Edificio "${escritura.edificio_app}" no encontrado en BD`);
      }
    }

    for (const company of companies) {
      console.log(`\n  → ${company.nombre}:`);

      const doc = await createDocumentRecord(company.id, building?.id || null, escritura);
      console.log(`    Doc: ${doc.nombre}`);

      if (escritura.precio_total || escritura.fincas.length > 0) {
        const acquisition = await createAssetAcquisition(
          company.id,
          building?.id || null,
          escritura
        );
        if (acquisition) {
          console.log(`    AssetAcquisition: ${acquisition.id} (${acquisition.precioCompra}€)`);
        }
      }
    }

    if (escritura.edificio_app === 'Candelaria Mora' && building && escritura.fincas.length > 0) {
      await updateCandelariaMoraUnits(building, escritura.fincas);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('IMPORTACIÓN COMPLETADA');
  console.log('='.repeat(70));

  console.log('\n📋 Resumen de archivos por directorio:');
  const virodaDir = path.join(__dirname, '..', 'data', 'viroda', 'escrituras');
  const rovidaDir = path.join(__dirname, '..', 'data', 'rovida', 'escrituras');

  if (fs.existsSync(virodaDir)) {
    const virodaFiles = fs.readdirSync(virodaDir).filter((f) => f.endsWith('.pdf'));
    console.log(`  Viroda: ${virodaFiles.length} escrituras`);
  }
  if (fs.existsSync(rovidaDir)) {
    const rovidaFiles = fs.readdirSync(rovidaDir).filter((f) => f.endsWith('.pdf'));
    console.log(`  Rovida: ${rovidaFiles.length} escrituras`);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
