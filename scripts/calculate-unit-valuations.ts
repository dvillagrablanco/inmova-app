/**
 * Calcula y asigna a cada unidad:
 * - precioCompra: prorrateado por m² desde el precio total del edificio (escritura)
 * - valorMercado: estimado por €/m² de mercado según tipo y zona
 *
 * El valor de mercado se estima con €/m² de referencia por zona/tipo:
 * - Madrid centro (Silvela, Reina, Candelaria, Piamonte, Barquillo, Prado, H.Tejada, Espronceda): vivienda ~4.500€/m², local ~5.000€/m², garaje ~30.000-40.000€/plaza
 * - Palencia: vivienda ~1.200€/m², garaje ~8.000€/plaza
 * - Benidorm: vivienda ~2.500€/m²
 * - Valladolid: vivienda ~1.800€/m², garaje ~12.000€/plaza
 * - Marbella: vivienda ~4.000€/m²
 *
 * Uso: npx tsx scripts/calculate-unit-valuations.ts [--apply]
 */

import { PrismaClient } from '@prisma/client';

const DRY_RUN = !process.argv.includes('--apply');
const prisma = new PrismaClient();
const now = new Date();

const MARKET_PRICES: Record<string, Record<string, number>> = {
  // €/m² por zona y tipo
  'madrid_centro': { vivienda: 4500, local: 5000, oficina: 3500, garaje: 0, trastero: 1500, nave_industrial: 2000 },
  'palencia': { vivienda: 1200, local: 1000, oficina: 800, garaje: 0, trastero: 500, nave_industrial: 400 },
  'benidorm': { vivienda: 2500, local: 2000, oficina: 1500, garaje: 0, trastero: 800, nave_industrial: 0 },
  'valladolid': { vivienda: 1800, local: 1500, oficina: 1200, garaje: 0, trastero: 600, nave_industrial: 500 },
  'marbella': { vivienda: 4000, local: 3500, oficina: 2500, garaje: 0, trastero: 1000, nave_industrial: 0 },
};

const GARAGE_PRICES: Record<string, number> = {
  'madrid_centro': 35000,
  'palencia': 8000,
  'benidorm': 15000,
  'valladolid': 12000,
  'marbella': 25000,
};

function getZone(buildingName: string, direccion: string): string {
  const d = (buildingName + ' ' + direccion).toLowerCase();
  if (d.includes('benidorm') || d.includes('gemelos')) return 'benidorm';
  if (d.includes('marbella') || d.includes('tomillar') || d.includes('nagüel')) return 'marbella';
  if (d.includes('palencia') || d.includes('menéndez') || d.includes('menendez') || d.includes('cuba') || d.includes('magaz') || d.includes('grijota')) return 'palencia';
  if (d.includes('valladolid') || d.includes('constitución') || d.includes('constitucion') || d.includes('argales') || d.includes('metal')) return 'valladolid';
  return 'madrid_centro';
}

function estimateMarketValue(tipo: string, superficie: number, zone: string): number {
  if (tipo === 'garaje') {
    return GARAGE_PRICES[zone] || 25000;
  }
  const priceM2 = MARKET_PRICES[zone]?.[tipo] || MARKET_PRICES[zone]?.['vivienda'] || 2000;
  return Math.round(superficie * priceM2);
}

async function main() {
  console.log('='.repeat(60));
  console.log(`CALCULATE UNIT VALUATIONS ${DRY_RUN ? '(DRY-RUN)' : '(APLICANDO)'}`);
  console.log('='.repeat(60));

  const companies = await prisma.company.findMany({
    where: { nombre: { in: ['Viroda Inversiones S.L.', 'Rovida S.L.'] } },
  });

  let updated = 0;
  let totalRevalorizacion = 0;
  let totalPrecioCompra = 0;
  let totalValorMercado = 0;

  for (const co of companies) {
    console.log('\n' + '═'.repeat(50));
    console.log(co.nombre);
    console.log('═'.repeat(50));

    const buildings = await prisma.building.findMany({
      where: { companyId: co.id, isDemo: false },
      include: {
        units: true,
        assetAcquisitions: { select: { precioCompra: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    for (const b of buildings) {
      const precioEdificio = b.assetAcquisitions.reduce((s, a) => s + a.precioCompra, 0);
      if (precioEdificio === 0 && b.units.length === 0) continue;

      const zone = getZone(b.nombre, b.direccion || '');
      const supTotal = b.units.reduce((s, u) => s + u.superficie, 0);

      console.log('\n  ' + b.nombre + ' | Precio: ' + Math.round(precioEdificio).toLocaleString('es-ES') + '€ | ' + b.units.length + ' uds | Zona: ' + zone);

      for (const u of b.units) {
        // Precio compra prorrateado por m²
        let precioCompra = u.precioCompra;
        if (!precioCompra && precioEdificio > 0 && supTotal > 0) {
          precioCompra = Math.round((u.superficie / supTotal) * precioEdificio);
        } else if (!precioCompra && precioEdificio > 0 && b.units.length > 0) {
          precioCompra = Math.round(precioEdificio / b.units.length);
        }

        // Valor de mercado
        let valorMercado = u.valorMercado;
        if (!valorMercado) {
          valorMercado = estimateMarketValue(u.tipo, u.superficie, zone);
        }

        const revalorizacion = precioCompra && valorMercado ? valorMercado - precioCompra : 0;
        const revalPct = precioCompra && precioCompra > 0 ? Math.round((revalorizacion / precioCompra) * 100) : 0;

        if (precioCompra) totalPrecioCompra += precioCompra;
        if (valorMercado) totalValorMercado += valorMercado;
        if (revalorizacion) totalRevalorizacion += revalorizacion;

        const needsUpdate = u.precioCompra !== precioCompra || u.valorMercado !== valorMercado;

        if (needsUpdate) {
          if (!DRY_RUN) {
            await prisma.unit.update({
              where: { id: u.id },
              data: {
                ...(precioCompra && { precioCompra }),
                ...(valorMercado && { valorMercado }),
                fechaValoracion: now,
              },
            });
          }
          updated++;

          if (u.tipo !== 'garaje' || b.units.length <= 5) {
            const sign = revalPct >= 0 ? '+' : '';
            console.log('    ' + u.numero.padEnd(20) + ' | Compra: ' + (precioCompra || 0).toLocaleString('es-ES').padStart(10) + '€ | Mercado: ' + (valorMercado || 0).toLocaleString('es-ES').padStart(10) + '€ | ' + sign + revalPct + '%');
          }
        }
      }

      if (b.units.length > 5 && b.units[0].tipo === 'garaje') {
        console.log('    ... (' + b.units.length + ' plazas procesadas)');
      }
    }
  }

  const revalPctTotal = totalPrecioCompra > 0 ? Math.round((totalRevalorizacion / totalPrecioCompra) * 100) : 0;

  console.log('\n' + '═'.repeat(60));
  console.log('RESUMEN PATRIMONIAL');
  console.log('═'.repeat(60));
  console.log('  Precio compra total:   ' + totalPrecioCompra.toLocaleString('es-ES') + ' €');
  console.log('  Valor mercado total:   ' + totalValorMercado.toLocaleString('es-ES') + ' €');
  console.log('  Revalorización:        ' + (totalRevalorizacion >= 0 ? '+' : '') + totalRevalorizacion.toLocaleString('es-ES') + ' € (' + (revalPctTotal >= 0 ? '+' : '') + revalPctTotal + '%)');
  console.log('  Unidades actualizadas: ' + updated);
  if (DRY_RUN) console.log('\nPara aplicar: npx tsx scripts/calculate-unit-valuations.ts --apply');
  console.log('═'.repeat(60));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
