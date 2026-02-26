/**
 * Script para importar datos extraídos de las escrituras de compraventa
 * a la base de datos de la app (AssetAcquisition, Building, Unit, Document).
 *
 * Datos fuente: data/escrituras-metadata.json (17 escrituras con OCR)
 * Escrituras PDF: data/viroda/escrituras/ y data/rovida/escrituras/
 *
 * Uso:
 *   npx tsx scripts/import-escrituras-data.ts          # Dry-run (muestra cambios)
 *   npx tsx scripts/import-escrituras-data.ts --apply   # Aplica cambios a BD
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = !process.argv.includes('--apply');
const prisma = new PrismaClient();

interface EscrituraFinca {
  numero?: number;
  descripcion: string;
  superficie_construida?: number;
  superficie_util?: number;
  ref_catastral?: string;
  valor?: number;
  cuota?: number;
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
  ref_catastral_principal?: string;
  refs_catastrales?: string[];
  forma_pago?: string;
  estado: string;
  archivo: string;
  nota?: string;
  fincas?: EscrituraFinca[];
}

async function findCompany(hint: string) {
  return prisma.company.findFirst({
    where: {
      nombre: { contains: hint, mode: 'insensitive' },
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

async function upsertDocument(
  companyId: string,
  buildingId: string | null,
  escritura: EscrituraData
) {
  const fileName = path.basename(escritura.archivo);
  const docName = fileName.replace('.pdf', '');

  const existing = await prisma.document.findFirst({
    where: {
      nombre: { contains: `Escritura_${escritura.numero}` },
      ...(buildingId && { buildingId }),
    },
  });

  if (existing) {
    console.log(`    Doc ya existe: ${existing.nombre}`);
    return existing;
  }

  if (DRY_RUN) {
    console.log(`    [DRY-RUN] Crearía Document: ${docName}`);
    return null;
  }

  return prisma.document.create({
    data: {
      nombre: docName,
      tipo: 'escritura_propiedad',
      descripcion: `${escritura.tipo} - ${escritura.inmueble || 'N/A'} (${escritura.fecha})`,
      cloudStoragePath: escritura.archivo,
      ...(buildingId && { buildingId }),
      tags: ['escritura', 'compraventa', escritura.estado.toLowerCase()].filter(Boolean),
    },
  });
}

async function upsertAssetAcquisition(
  companyId: string,
  buildingId: string | null,
  escritura: EscrituraData
) {
  if (!escritura.precio_total) return null;

  const existing = await prisma.assetAcquisition.findFirst({
    where: {
      companyId,
      ...(buildingId && { buildingId }),
      fechaAdquisicion: new Date(escritura.fecha),
    },
  });

  if (existing) {
    if (existing.precioCompra !== escritura.precio_total) {
      console.log(`    AssetAcquisition existe pero precio difiere: ${existing.precioCompra} vs ${escritura.precio_total}`);
      if (!DRY_RUN) {
        await prisma.assetAcquisition.update({
          where: { id: existing.id },
          data: {
            precioCompra: escritura.precio_total,
            ...(escritura.ref_catastral_principal && { referenciaCatastral: escritura.ref_catastral_principal }),
            notas: buildNotas(escritura),
          },
        });
        console.log(`    Actualizado`);
      }
    } else {
      console.log(`    AssetAcquisition ya existe: ${existing.id}`);
    }
    return existing;
  }

  if (DRY_RUN) {
    console.log(`    [DRY-RUN] Crearía AssetAcquisition: ${escritura.precio_total}€ (${escritura.fecha})`);
    return null;
  }

  return prisma.assetAcquisition.create({
    data: {
      companyId,
      ...(buildingId && { buildingId }),
      assetType: 'otro',
      fechaAdquisicion: new Date(escritura.fecha),
      precioCompra: escritura.precio_total,
      ...(escritura.ref_catastral_principal && { referenciaCatastral: escritura.ref_catastral_principal }),
      notas: buildNotas(escritura),
    },
  });
}

function buildNotas(escritura: EscrituraData): string {
  return [
    `Escritura nº ${escritura.numero}`,
    escritura.notario ? `Notario: ${escritura.notario}` : null,
    escritura.vendedor ? `Vendedor: ${escritura.vendedor}` : null,
    escritura.vendedor_nif ? `NIF vendedor: ${escritura.vendedor_nif}` : null,
    escritura.forma_pago ? `Forma pago: ${escritura.forma_pago}` : null,
    escritura.nota || null,
    `Estado: ${escritura.estado}`,
    escritura.refs_catastrales?.length ? `Refs catastrales: ${escritura.refs_catastrales.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

async function updateUnitsFromFincas(building: any, fincas: EscrituraFinca[], buildingName: string) {
  if (!building?.units?.length || !fincas?.length) return;

  console.log(`\n  Actualizando unidades de ${buildingName} con datos de escritura...`);

  for (const finca of fincas) {
    if (!finca.superficie_construida && !finca.superficie_util) continue;

    const desc = finca.descripcion.toLowerCase();
    let matched = false;

    for (const unit of building.units) {
      const unitNum = unit.numero.toLowerCase().replace(/\s/g, '');
      const fincaDesc = desc.replace(/\s/g, '');
      if (fincaDesc.includes(unitNum) || unitNum.includes(fincaDesc.slice(-3))) {
        const changes: string[] = [];
        const updateData: any = {};

        if (finca.superficie_construida && unit.superficie !== finca.superficie_construida) {
          changes.push(`superficie: ${unit.superficie}→${finca.superficie_construida}`);
          updateData.superficie = finca.superficie_construida;
        }
        if (finca.superficie_util && unit.superficieUtil !== finca.superficie_util) {
          changes.push(`superficieUtil: ${unit.superficieUtil ?? 'null'}→${finca.superficie_util}`);
          updateData.superficieUtil = finca.superficie_util;
        }

        if (changes.length > 0) {
          if (DRY_RUN) {
            console.log(`    [DRY-RUN] ${unit.numero}: ${changes.join(', ')}`);
          } else {
            await prisma.unit.update({ where: { id: unit.id }, data: updateData });
            console.log(`    ✓ ${unit.numero}: ${changes.join(', ')}`);
          }
        }
        matched = true;
        break;
      }
    }

    if (!matched && (finca.superficie_construida || finca.superficie_util)) {
      console.log(`    ⚠ No match para: "${finca.descripcion}"`);
    }
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log(`IMPORTACIÓN DE DATOS DE ESCRITURAS ${DRY_RUN ? '(DRY-RUN)' : '(APLICANDO)'}`);
  console.log('='.repeat(70));

  if (DRY_RUN) {
    console.log('Modo DRY-RUN: muestra cambios sin aplicar. Usa --apply para ejecutar.\n');
  }

  const metadataPath = path.join(__dirname, '..', 'data', 'escrituras-metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  const escrituras: EscrituraData[] = metadata.escrituras;

  console.log(`Escrituras a procesar: ${escrituras.length}`);

  let viroda: any, rovida: any;
  try {
    viroda = await findCompany('Viroda');
    rovida = await findCompany('Rovida');
  } catch (e: any) {
    if (e.message?.includes('connect') || e.message?.includes('ECONNREFUSED')) {
      console.error('\nERROR: No se pudo conectar a la BD.');
      console.error('Ejecuta en el servidor de producción con la BD accesible.');
      console.error('Uso: DATABASE_URL=postgresql://... npx tsx scripts/import-escrituras-data.ts --apply\n');
      process.exit(1);
    }
    throw e;
  }

  if (!viroda) { console.error('ERROR: Empresa Viroda no encontrada'); process.exit(1); }
  if (!rovida) { console.error('ERROR: Empresa Rovida no encontrada'); process.exit(1); }

  console.log(`Viroda: ${viroda.nombre} (${viroda.id})`);
  console.log(`Rovida: ${rovida.nombre} (${rovida.id})`);

  let docsCreated = 0, assetsCreated = 0, unitsUpdated = 0;

  for (const escritura of escrituras) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📜 Escritura ${escritura.numero} (${escritura.fecha})`);
    console.log(`   ${escritura.tipo}: ${escritura.inmueble || 'N/A'}`);
    if (escritura.precio_total) console.log(`   Precio: ${escritura.precio_total.toLocaleString('es-ES')}€`);

    let companies: { id: string; nombre: string }[] = [];
    if (escritura.empresa === 'viroda') companies = [viroda];
    else if (escritura.empresa === 'rovida') companies = [rovida];
    else companies = [rovida, viroda];

    let building: any = null;
    if (escritura.edificio_app) {
      building = await findBuilding(escritura.edificio_app);
      if (building) {
        console.log(`   Edificio: ${building.nombre} (${building.units.length} uds)`);
      } else {
        console.log(`   ⚠ Edificio "${escritura.edificio_app}" no encontrado en BD`);
      }
    }

    for (const company of companies) {
      console.log(`\n  → ${company.nombre}:`);

      const doc = await upsertDocument(company.id, building?.id || null, escritura);
      if (doc) docsCreated++;

      if (escritura.precio_total) {
        const asset = await upsertAssetAcquisition(company.id, building?.id || null, escritura);
        if (asset) assetsCreated++;
      }
    }

    if (building && escritura.fincas?.length) {
      await updateUnitsFromFincas(building, escritura.fincas, escritura.edificio_app || '');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`IMPORTACIÓN ${DRY_RUN ? '(DRY-RUN) SIMULADA' : 'COMPLETADA'}`);
  console.log(`  Escrituras procesadas: ${escrituras.length}`);
  console.log(`  Documents: ${docsCreated}`);
  console.log(`  AssetAcquisitions: ${assetsCreated}`);
  console.log('='.repeat(70));

  if (DRY_RUN) {
    console.log('\nPara aplicar cambios: npx tsx scripts/import-escrituras-data.ts --apply');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
