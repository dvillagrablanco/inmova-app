/**
 * Seed Insurance Providers para Rovida S.L. y Viroda Inversiones S.L.U.
 * 
 * Datos extraídos de:
 * - Contabilidad (subcuentas 625x)
 * - Movimientos bancarios CAMT.053 (XML)
 * - Script create-rovida-tenants-insurance-contracts.ts
 * - Búsqueda pública de datos de aseguradoras
 * 
 * Ejecutar: npx tsx scripts/seed-insurance-providers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// IDs reales de la BD de producción
const ROVIDA_COMPANY_ID = 'cef19f55f7b6ce0637d5ffb53';
const VIRODA_COMPANY_ID = 'cmkctneuh0001nokn7nvhuweq';

interface ProviderData {
  nombre: string;
  cif: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  telefono: string;
  email: string;
  web: string;
  contactoNombre: string | null;
  contactoEmail: string;
  contactoTelefono: string;
  contactoCargo: string | null;
  tiposSeguro: string[];
  notas: string;
  logoUrl: string | null;
}

// =============================================================================
// DATOS DE PROVEEDORES (verificados con fuentes públicas)
// =============================================================================

const PROVIDERS: ProviderData[] = [
  {
    nombre: 'Allianz Compañía de Seguros y Reaseguros S.A.',
    cif: 'A28007748',
    direccion: 'Calle Ramírez de Arellano, 35',
    ciudad: 'Madrid',
    codigoPostal: '28043',
    telefono: '914 351 157',
    email: 'clientes@allianz.es',
    web: 'https://www.allianz.es',
    contactoNombre: 'Dpto. Comercial Hogar y Comunidades',
    contactoEmail: 'clientes@allianz.es',
    contactoTelefono: '914 353 400',
    contactoCargo: 'Atención al Cliente',
    tiposSeguro: ['hogar', 'comunidad', 'responsabilidad_civil', 'incendio', 'robo'],
    notas: 'Proveedor principal de seguros de hogar para Rovida (19+ pólizas activas en 2025-2026). También póliza de comunidades para Viroda (057780547). Pólizas hogar identificadas en extractos bancarios: 042487090, 042739846, 055244827, 055794468, 055891258, 055891385, 055976799, 056025671, 056025719, 056025759, 056025904, 056026822, 056026931, 056027388, 056027419, 056027447, 056027522, 056564356, 056564397. Póliza comunidades Viroda: 057780547 (€1.140,88/año). Primas hogar oscilan entre €175-€264/año por unidad.',
    logoUrl: null,
  },
  {
    nombre: 'AXA Seguros Generales S.A. de Seguros y Reaseguros',
    cif: 'A60917978',
    direccion: 'Calle Monseñor Palmer, 1',
    ciudad: 'Palma de Mallorca',
    codigoPostal: '07014',
    telefono: '918 070 055',
    email: 'atencion.clientes@axa.es',
    web: 'https://www.axa.es',
    contactoNombre: 'Dpto. Atención al Cliente',
    contactoEmail: 'atencion.clientes@axa.es',
    contactoTelefono: '918 070 055',
    contactoCargo: 'Atención al Cliente',
    tiposSeguro: ['hogar', 'comunidad', 'responsabilidad_civil', 'incendio'],
    notas: 'Proveedor de seguros de hogar para Rovida y Viroda. Rovida: Pólizas de hogar para Casa El Tomillar (SEG-TOMILLAR-001, €450/año), Apartamentos Gemelos II (6 pólizas SEG-GII-*, €350/año c/u) y Gemelos IV (SEG-GIV-17C-001, €350/año). Viroda/Vidaro: Pólizas para Av Europa 34 (POL85374359, POL85342224) y Menéndez Pelayo 15, Palencia (POL82712931, POL84844930, POL85481460). Identificado en movimientos bancarios con referencia 03494905.',
    logoUrl: null,
  },
  {
    nombre: 'Mapfre España, Compañía de Seguros y Reaseguros S.A.',
    cif: 'A28141935',
    direccion: 'Carretera de Pozuelo a Majadahonda, S/N, Km 50',
    ciudad: 'Majadahonda (Madrid)',
    codigoPostal: '28220',
    telefono: '918 365 365',
    email: 'atencioncliente.mapgen@mapfre.com',
    web: 'https://www.mapfre.es',
    contactoNombre: 'Dpto. Seguros Multirriesgo',
    contactoEmail: 'atencioncliente.mapgen@mapfre.com',
    contactoTelefono: '900 822 822',
    contactoCargo: 'Atención al Cliente',
    tiposSeguro: ['comunidad', 'hogar', 'responsabilidad_civil', 'incendio', 'robo'],
    notas: 'Proveedor de seguros de comunidad para Rovida. Pólizas: Oficinas Av Europa (SEG-EUROPA34-001, €800/año), Edificio Piamonte 23 (SEG-PIAMONTE-001, €2.500/año). También seguro de autos para Vidaro (NIF A34003624, recibo 8697727000, €757,37/año, intermediario: Facundo Blanco S.A.).',
    logoUrl: null,
  },
  {
    nombre: 'Generali España S.A. de Seguros y Reaseguros',
    cif: 'A28007268',
    direccion: 'Plaza de Manuel Gómez Moreno, 5',
    ciudad: 'Madrid',
    codigoPostal: '28020',
    telefono: '911 123 443',
    email: 'servicioatencionalcliente.es@generali.com',
    web: 'https://www.generali.es',
    contactoNombre: 'Dpto. Seguros Comunidades',
    contactoEmail: 'servicioatencionalcliente.es@generali.com',
    contactoTelefono: '900 903 433',
    contactoCargo: 'Atención al Cliente',
    tiposSeguro: ['comunidad', 'hogar', 'responsabilidad_civil', 'incendio'],
    notas: 'Proveedor de seguro de comunidad para Rovida. Póliza: Inmueble Constitución 8 (SEG-CONSTIT8-001, €600/año). Identificado en contabilidad de Rovida (subcuenta 625x).',
    logoUrl: null,
  },
  {
    nombre: 'Zurich Insurance PLC, Sucursal en España',
    cif: 'W0072130H',
    direccion: 'Calle Agustín de Foxá, 27',
    ciudad: 'Madrid',
    codigoPostal: '28036',
    telefono: '913 755 755',
    email: 'zurichlopd@zurich.com',
    web: 'https://www.zurich.es',
    contactoNombre: 'Dpto. Seguros Comunidades y Comercios',
    contactoEmail: 'zurichlopd@zurich.com',
    contactoTelefono: '900 903 314',
    contactoCargo: 'Atención al Cliente',
    tiposSeguro: ['comunidad', 'hogar', 'responsabilidad_civil', 'incendio', 'robo'],
    notas: 'Proveedor de seguro de comunidad para Rovida. Póliza: Naves Avda Cuba (SEG-CUBA-001, €1.200/año). Identificado en contabilidad de Rovida (subcuenta 625x). Zurich ofrece servicio 24h para asistencia hogar/comunidades: 934 165 046.',
    logoUrl: null,
  },
];

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('🛡️  SEED: Proveedores de Seguros para Rovida y Viroda');
  console.log('='.repeat(70));

  // Verificar que las companies existen
  const rovida = await prisma.company.findUnique({ where: { id: ROVIDA_COMPANY_ID }, select: { id: true, nombre: true } });
  const viroda = await prisma.company.findUnique({ where: { id: VIRODA_COMPANY_ID }, select: { id: true, nombre: true } });

  if (!rovida) {
    console.error(`❌ Company ${ROVIDA_COMPANY_ID} no encontrada en BD`);
    process.exit(1);
  }
  if (!viroda) {
    console.error(`❌ Company ${VIRODA_COMPANY_ID} no encontrada en BD`);
    process.exit(1);
  }

  console.log(`\n✅ Rovida: ${rovida.nombre} (${rovida.id})`);
  console.log(`✅ Viroda: ${viroda.nombre} (${viroda.id})`);

  // Crear proveedores para AMBAS empresas
  const companies = [
    { id: ROVIDA_COMPANY_ID, nombre: rovida.nombre },
    { id: VIRODA_COMPANY_ID, nombre: viroda.nombre },
  ];

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const company of companies) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📋 Procesando proveedores para: ${company.nombre}`);
    console.log(`${'─'.repeat(60)}`);

    for (const provider of PROVIDERS) {
      // Buscar si ya existe por nombre y companyId
      const existing = await prisma.insuranceProvider.findFirst({
        where: {
          companyId: company.id,
          nombre: provider.nombre,
        },
      });

      if (existing) {
        // Actualizar con datos completos
        await prisma.insuranceProvider.update({
          where: { id: existing.id },
          data: {
            cif: provider.cif,
            direccion: provider.direccion,
            ciudad: provider.ciudad,
            codigoPostal: provider.codigoPostal,
            telefono: provider.telefono,
            email: provider.email,
            web: provider.web,
            contactoNombre: provider.contactoNombre,
            contactoEmail: provider.contactoEmail,
            contactoTelefono: provider.contactoTelefono,
            contactoCargo: provider.contactoCargo,
            tiposSeguro: provider.tiposSeguro,
            notas: provider.notas,
            activo: true,
          },
        });
        console.log(`  ♻️  Actualizado: ${provider.nombre} (CIF: ${provider.cif})`);
        totalUpdated++;
      } else {
        // Crear nuevo
        await prisma.insuranceProvider.create({
          data: {
            companyId: company.id,
            nombre: provider.nombre,
            cif: provider.cif,
            direccion: provider.direccion,
            ciudad: provider.ciudad,
            codigoPostal: provider.codigoPostal,
            telefono: provider.telefono,
            email: provider.email,
            web: provider.web,
            contactoNombre: provider.contactoNombre,
            contactoEmail: provider.contactoEmail,
            contactoTelefono: provider.contactoTelefono,
            contactoCargo: provider.contactoCargo,
            tiposSeguro: provider.tiposSeguro,
            notas: provider.notas,
            logoUrl: provider.logoUrl,
            activo: true,
          },
        });
        console.log(`  ✅ Creado: ${provider.nombre} (CIF: ${provider.cif})`);
        totalCreated++;
      }
    }
  }

  // Resumen
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 RESUMEN`);
  console.log(`${'='.repeat(70)}`);
  console.log(`   Proveedores creados: ${totalCreated}`);
  console.log(`   Proveedores actualizados: ${totalUpdated}`);
  console.log(`   Total proveedores por empresa: ${PROVIDERS.length}`);
  console.log(`   Empresas procesadas: ${companies.length}`);
  console.log(`\n📋 Proveedores registrados:`);

  for (const p of PROVIDERS) {
    console.log(`   • ${p.nombre}`);
    console.log(`     CIF: ${p.cif} | Tel: ${p.telefono} | Web: ${p.web}`);
    console.log(`     Tipos: ${p.tiposSeguro.join(', ')}`);
  }

  // Verificar totales en BD
  const rovidaCount = await prisma.insuranceProvider.count({ where: { companyId: ROVIDA_COMPANY_ID } });
  const virodaCount = await prisma.insuranceProvider.count({ where: { companyId: VIRODA_COMPANY_ID } });
  
  console.log(`\n🗄️  En BD:`);
  console.log(`   Rovida: ${rovidaCount} proveedores`);
  console.log(`   Viroda: ${virodaCount} proveedores`);
  console.log(`\n✅ Seed completado.`);
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
