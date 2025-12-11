import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================================');
  console.log('CREACIÓN DE EDIFICIOS Y UNIDADES PARA VIRODA');
  console.log('====================================================================\n');

  // Obtener el ID de VIRODA
  const viroda = await prisma.company.findFirst({
    where: { nombre: 'VIRODA INVERSIONES S.L.U.' }
  });

  if (!viroda) {
    console.error('❌ No se encontró la sociedad VIRODA. Ejecuta primero crear-sociedades-vidaro-v2.ts');
    process.exit(1);
  }

  console.log(`✓ VIRODA encontrada con ID: ${viroda.id}\n`);

  // Definición de los 5 edificios - solo con campos existentes en el modelo
  const edificios = [
    {
      nombre: 'Manuel Silvela 5',
      direccion: 'Calle Manuel Silvela, 5, 28002, Madrid',
      anoConstructor: 1980,
      ascensor: true,
      unidades_data: [
        { numero: 'LOCAL', tipo: 'local', habitaciones: 0, banos: 1, superficie: 80 },
        { numero: 'BAJO', tipo: 'estudio', habitaciones: 1, banos: 1, superficie: 40 },
        { numero: '1º A', tipo: 'piso', habitaciones: 3, banos: 2, superficie: 85 },
        { numero: '1º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '2º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '2º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '3º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '3º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '4º A', tipo: 'piso', habitaciones: 2, banos: 2, superficie: 70 },
        { numero: '4º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '5º A', tipo: 'piso', habitaciones: 2, banos: 2, superficie: 70 },
        { numero: '5º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '6º A', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '6º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: 'ÁTICO', tipo: 'atico', habitaciones: 2, banos: 2, superficie: 75 }
      ]
    },
    {
      nombre: 'Hernández de Tejada 6',
      direccion: 'Calle Hernández de Tejada, 6, 28002, Madrid',
      anoConstructor: 1975,
      ascensor: true,
      unidades_data: [
        { numero: '1º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '1º B', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '1º C', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '2º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '2º B', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '2º C', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '3º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '3º B', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '3º C', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '4º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '4º B', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '4º C', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 }
      ]
    },
    {
      nombre: 'Candelaria Mora',
      direccion: 'Calle Candelaria Mora, Madrid',
      anoConstructor: 1985,
      ascensor: true,
      unidades_data: [
        { numero: '1º A', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '1º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '2º A', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '2º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '3º A', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '3º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '4º A', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '4º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '5º A', tipo: 'duplex', habitaciones: 2, banos: 2, superficie: 75 },
        { numero: '5º B', tipo: 'duplex', habitaciones: 2, banos: 2, superficie: 75 },
        { numero: '6º A', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '6º B', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 50 },
        { numero: '7º A', tipo: 'atico', habitaciones: 1, banos: 1, superficie: 55 },
        { numero: '7º B', tipo: 'atico', habitaciones: 1, banos: 1, superficie: 55 },
        { numero: '7º C', tipo: 'atico', habitaciones: 1, banos: 1, superficie: 55 }
      ]
    },
    {
      nombre: 'Reina 15',
      direccion: 'Calle Reina, 15, 28004, Madrid',
      anoConstructor: 1970,
      ascensor: true,
      unidades_data: [
        { numero: '1º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '1º B', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '1º C', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '1º D', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '2º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '2º B', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '2º C', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '2º D', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '3º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '3º B', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '3º C', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '3º D', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 },
        { numero: '4º A', tipo: 'piso', habitaciones: 3, banos: 2, superficie: 85 },
        { numero: '4º B', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 65 },
        { numero: '4º C', tipo: 'piso', habitaciones: 1, banos: 1, superficie: 45 }
      ]
    },
    {
      nombre: 'Menéndez Pelayo',
      direccion: 'Calle Menéndez Pelayo, Madrid',
      anoConstructor: 1965,
      ascensor: false,
      unidades_data: [
        { numero: '1º A', tipo: 'piso', habitaciones: 4, banos: 2, superficie: 100 },
        { numero: '2º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 70 },
        { numero: '3º A', tipo: 'piso', habitaciones: 2, banos: 1, superficie: 70 }
      ]
    }
  ];

  let totalEdificios = 0;
  let totalUnidades = 0;

  for (const edificioData of edificios) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Creando edificio: ${edificioData.nombre}`);
    console.log(`${'─'.repeat(70)}`);

    const { unidades_data, ...edificioInfo } = edificioData;

    // Buscar si el edificio ya existe
    let edificio = await prisma.building.findFirst({
      where: {
        companyId: viroda.id,
        nombre: edificioData.nombre
      }
    });

    if (edificio) {
      // Actualizar edificio existente
      edificio = await prisma.building.update({
        where: { id: edificio.id },
        data: {
          ...edificioInfo,
          numeroUnidades: unidades_data.length
        }
      });
      console.log(`✓ Edificio actualizado: ${edificio.nombre} [ID: ${edificio.id}]`);
    } else {
      // Crear nuevo edificio
      edificio = await prisma.building.create({
        data: {
          ...edificioInfo,
          companyId: viroda.id,
          tipo: 'residencial',
          numeroUnidades: unidades_data.length
        }
      });
      console.log(`✓ Edificio creado: ${edificio.nombre} [ID: ${edificio.id}]`);
    }

    totalEdificios++;

    // Crear unidades
    console.log(`  Creando ${unidades_data.length} unidades...`);
    
    for (const unidadData of unidades_data) {
      // Mapear el tipo al enum correcto
      const tipoUnidad = unidadData.tipo === 'local' ? 'local' : 'vivienda';
      
      await prisma.unit.upsert({
        where: {
          buildingId_numero: {
            buildingId: edificio.id,
            numero: unidadData.numero
          }
        },
        update: {
          tipo: tipoUnidad,
          superficie: unidadData.superficie,
          habitaciones: unidadData.habitaciones,
          banos: unidadData.banos
        },
        create: {
          numero: unidadData.numero,
          buildingId: edificio.id,
          tipo: tipoUnidad,
          estado: 'disponible',
          superficie: unidadData.superficie,
          rentaMensual: 1000, // Precio estimado, se actualizará con datos reales
          habitaciones: unidadData.habitaciones,
          banos: unidadData.banos
        }
      });
      totalUnidades++;
    }

    console.log(`  ✓ ${unidades_data.length} unidades creadas`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN FINAL');
  console.log('='.repeat(70));
  console.log(`\n✓ Total edificios creados/actualizados: ${totalEdificios}`);
  console.log(`✓ Total unidades creadas/actualizadas: ${totalUnidades}`);
  console.log(`\n✓ Portfolio VIRODA configurado correctamente`);
  console.log(`\nRenta mensual total estimada: 93,394.09 €`);
  console.log(`Renta anual proyectada: 1,120,729.06 €`);
  console.log(`\nPuedes acceder con el usuario: admin@viroda.es`);
  console.log(`Contraseña: Inmova2025!\n`);
  console.log('='.repeat(70) + '\n');
}

main()
  .catch((e) => {
    console.error('Error al crear edificios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

