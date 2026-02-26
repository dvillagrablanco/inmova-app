/**
 * Crea el edificio Prado 10 en la app con todos los datos de la escritura 3651.
 *
 * Datos de la escritura:
 * - Escritura 3651 (23/12/2025), Notario: Santiago Alfonso González López (sustituto de F. Sánchez-Arjona)
 * - Vendedor: Pescaderías Coruñesas SL (NIF B-28896264)
 * - Comprador: Rovida SLU
 * - Precio: 3.150.000€
 * - Inmueble: Local comercial + sótano en C/ Prado 10, Madrid
 * - Arrendatario actual: Boca Prado SLU (contrato 15/01/2016, cedido por Bocaleón Ibérica SLU)
 *
 * Fincas:
 * 1) Sótano: 339,01 m² construidos. Cuota 4,00%. RP 2 Madrid, tomo 2134, libro 2049, folio 4.
 *    Ref catastral: 0742703VK4704B00018D. Valor: 1.332.450€
 * 2) Local comercial planta baja: 161,78 m² construidos. Cuota 4,56%. RP 2 Madrid, tomo 2134, libro 2049, folio 8.
 *    Ref catastral: 0742703VK4704B0002DF. Valor: 1.817.550€
 *
 * Uso: npx tsx scripts/create-prado10-building.ts
 */

import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const rovida = await p.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  if (!rovida) { console.error('Rovida not found'); process.exit(1); }
  console.log('Rovida: ' + rovida.id);

  // Check if building already exists
  const existing = await p.building.findFirst({
    where: {
      companyId: rovida.id,
      OR: [
        { nombre: { contains: 'Prado', mode: 'insensitive' } },
        { direccion: { contains: 'Prado', mode: 'insensitive' } },
      ],
    },
  });

  if (existing) {
    console.log('Edificio Prado 10 ya existe: ' + existing.id + ' (' + existing.nombre + ')');
    console.log('Actualizando...');

    await p.building.update({
      where: { id: existing.id },
      data: {
        nombre: 'Local Comercial Prado 10',
        direccion: 'C/ del Prado, 10, 28014, Madrid',
        tipo: 'residencial',
        anoConstructor: 1900,
        numeroUnidades: 2,
        ascensor: false,
        garaje: false,
      },
    });

    // Update or create units
    await createOrUpdateUnits(existing.id, rovida.id);
    await linkAssetAcquisition(existing.id, rovida.id);
    return;
  }

  // Create building
  const building = await p.building.create({
    data: {
      companyId: rovida.id,
      nombre: 'Local Comercial Prado 10',
      direccion: 'C/ del Prado, 10, 28014, Madrid',
      tipo: 'residencial',
      anoConstructor: 1900,
      numeroUnidades: 2,
      ascensor: false,
      garaje: false,
      trastero: false,
      piscina: false,
      jardin: false,
      etiquetas: ['local_comercial', 'sotano', 'centro_madrid', 'barrio_letras'],
    },
  });
  console.log('Edificio creado: ' + building.id);

  await createOrUpdateUnits(building.id, rovida.id);
  await linkAssetAcquisition(building.id, rovida.id);
}

async function createOrUpdateUnits(buildingId: string, companyId: string) {
  const units = [
    {
      numero: 'Sótano',
      tipo: 'local' as const,
      superficie: 339.01,
      planta: -1,
      rentaMensual: 0,
      estado: 'ocupada' as const,
    },
    {
      numero: 'Local Comercial',
      tipo: 'local' as const,
      superficie: 161.78,
      planta: 0,
      rentaMensual: 0,
      estado: 'ocupada' as const,
    },
  ];

  for (const u of units) {
    const existingUnit = await p.unit.findFirst({
      where: { buildingId, numero: u.numero },
    });

    if (existingUnit) {
      await p.unit.update({
        where: { id: existingUnit.id },
        data: {
          superficie: u.superficie,
          planta: u.planta,
          tipo: u.tipo,
          estado: u.estado,
        },
      });
      console.log('Unit updated: ' + u.numero + ' (' + u.superficie + ' m²)');
    } else {
      await p.unit.create({
        data: {
          buildingId,
          numero: u.numero,
          tipo: u.tipo,
          superficie: u.superficie,
          planta: u.planta,
          rentaMensual: u.rentaMensual,
          estado: u.estado,
        },
      });
      console.log('Unit created: ' + u.numero + ' (' + u.superficie + ' m²)');
    }
  }
}

async function linkAssetAcquisition(buildingId: string, companyId: string) {
  // Find the existing AssetAcquisition for Prado 10 (created earlier without buildingId)
  const unlinked = await p.assetAcquisition.findFirst({
    where: {
      companyId,
      buildingId: null,
      precioCompra: 3150000,
    },
  });

  if (unlinked) {
    await p.assetAcquisition.update({
      where: { id: unlinked.id },
      data: {
        buildingId,
        referenciaCatastral: '0742703VK4704B',
        notas: 'Escritura 3651 (23/12/2025)\nNotario: Santiago Alfonso González López (sustituto F. Sánchez-Arjona)\nVendedor: Pescaderías Coruñesas SL (NIF B-28896264)\nPrecio: 3.150.000€ (3.102.000€ cheque + 48.000€ retención aval arrendatario)\nFinca 1: Sótano 339,01m² - Valor 1.332.450€ - Ref: 0742703VK4704B00018D\nFinca 2: Local 161,78m² - Valor 1.817.550€ - Ref: 0742703VK4704B0002DF\nArrendatario: Boca Prado SLU (contrato 15/01/2016)\nRP 2 Madrid, tomo 2134, libro 2049',
      },
    });
    console.log('AssetAcquisition linked to building: ' + unlinked.id);
  } else {
    // Check if already linked
    const linked = await p.assetAcquisition.findFirst({
      where: { companyId, buildingId },
    });
    if (linked) {
      console.log('AssetAcquisition already linked: ' + linked.id);
      // Update notas
      await p.assetAcquisition.update({
        where: { id: linked.id },
        data: {
          referenciaCatastral: '0742703VK4704B',
          notas: 'Escritura 3651 (23/12/2025)\nNotario: Santiago Alfonso González López (sustituto F. Sánchez-Arjona)\nVendedor: Pescaderías Coruñesas SL (NIF B-28896264)\nPrecio: 3.150.000€ (3.102.000€ cheque + 48.000€ retención aval arrendatario)\nFinca 1: Sótano 339,01m² - Valor 1.332.450€ - Ref: 0742703VK4704B00018D\nFinca 2: Local 161,78m² - Valor 1.817.550€ - Ref: 0742703VK4704B0002DF\nArrendatario: Boca Prado SLU (contrato 15/01/2016)\nRP 2 Madrid, tomo 2134, libro 2049',
        },
      });
    } else {
      console.log('No AssetAcquisition found for Prado 10 - creating');
      await p.assetAcquisition.create({
        data: {
          companyId,
          buildingId,
          assetType: 'local_comercial',
          fechaAdquisicion: new Date('2025-12-23'),
          precioCompra: 3150000,
          inversionTotal: 3150000,
          valorContableNeto: 3150000,
          referenciaCatastral: '0742703VK4704B',
          notas: 'Escritura 3651 (23/12/2025)\nVendedor: Pescaderías Coruñesas SL\nPrecio: 3.150.000€',
        },
      });
    }
  }

  // Link the document too
  const doc = await p.document.findFirst({
    where: { nombre: { contains: 'Escritura_3651' } },
  });
  if (doc && !doc.buildingId) {
    await p.document.update({
      where: { id: doc.id },
      data: { buildingId },
    });
    console.log('Document linked to building');
  }

  console.log('\nPrado 10 completado:');
  console.log('  Dirección: C/ del Prado, 10, 28014, Madrid');
  console.log('  Finca 1: Sótano - 339,01 m² - Ref: 0742703VK4704B00018D - Valor: 1.332.450€');
  console.log('  Finca 2: Local Comercial - 161,78 m² - Ref: 0742703VK4704B0002DF - Valor: 1.817.550€');
  console.log('  Superficie total: 500,79 m²');
  console.log('  Precio compra: 3.150.000€');
  console.log('  €/m²: ' + Math.round(3150000 / 500.79));
  console.log('  Arrendatario: Boca Prado SLU (contrato 15/01/2016)');
  console.log('  Vendedor: Pescaderías Coruñesas SL');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
