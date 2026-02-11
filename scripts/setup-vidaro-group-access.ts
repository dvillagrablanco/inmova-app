/**
 * Script: Configurar acceso multi-empresa para dvillagra@vidaroinversiones.com
 * 
 * Asegura que el usuario tiene acceso a las 3 sociedades del grupo Vidaro:
 * 1. Vidaro Inversiones S.L. (holding)
 * 2. Rovida S.L. (filial)
 * 3. Viroda Inversiones S.L.U. (filial)
 * 
 * Y que su companyId principal apunta a Vidaro (la holding).
 * 
 * Uso: npx tsx scripts/setup-vidaro-group-access.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const TARGET_EMAIL = 'dvillagra@vidaroinversiones.com';

async function main() {
  console.log('====================================================================');
  console.log('  CONFIGURAR ACCESO GRUPO VIDARO - dvillagra@vidaroinversiones.com');
  console.log('====================================================================\n');

  // 1. Buscar o crear las 3 empresas
  console.log('1. Buscando/creando empresas del grupo...\n');

  // Vidaro (holding)
  let vidaro = await prisma.company.findFirst({
    where: {
      OR: [
        { id: 'vidaro-inversiones' },
        { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
      ],
    },
  });

  if (!vidaro) {
    vidaro = await prisma.company.create({
      data: {
        id: 'vidaro-inversiones',
        nombre: 'Vidaro Inversiones S.L.',
        cif: 'B-PENDIENTE',
        direccion: 'Madrid, España',
        ciudad: 'Madrid',
        pais: 'España',
        email: 'info@vidaroinversiones.com',
        activo: true,
        estadoCliente: 'activo',
        colorPrimario: '#1a365d',
        colorSecundario: '#2563eb',
        notasAdmin: 'Sociedad holding. Contabilidad 2025: 1.262 asientos, €253M. 2026 (Ene-Feb): 45 asientos, €135K. 1.766 subcuentas, 460+ instrumentos financieros. Carteras: CACEIS, Inversis, Pictet, Banca March, Bankinter. Participadas: Rovida, Disfasa, Viroda, Facundo, Girasoles, Incofasa, PDV Gesfasa.',
      },
    });
    console.log(`   Vidaro Inversiones creada (ID: ${vidaro.id})`);
  } else {
    // Actualizar notasAdmin con datos contables reales
    await prisma.company.update({
      where: { id: vidaro.id },
      data: {
        notasAdmin: 'Sociedad holding. Contabilidad 2025: 1.262 asientos, €253M. 2026 (Ene-Feb): 45 asientos, €135K. 1.766 subcuentas, 460+ instrumentos financieros. Carteras: CACEIS, Inversis, Pictet, Banca March, Bankinter. Participadas: Rovida, Disfasa, Viroda, Facundo, Girasoles, Incofasa, PDV Gesfasa.',
      },
    });
    console.log(`   Vidaro Inversiones encontrada y actualizada (ID: ${vidaro.id}, nombre: ${vidaro.nombre})`);
  }

  // Rovida (filial)
  let rovida = await prisma.company.findFirst({
    where: {
      OR: [
        { id: 'rovida-sl' },
        { id: 'rovida-gestion' },
        { nombre: { contains: 'Rovida', mode: 'insensitive' } },
      ],
    },
  });

  if (!rovida) {
    rovida = await prisma.company.create({
      data: {
        id: 'rovida-sl',
        nombre: 'Rovida S.L.',
        cif: 'B-PENDIENTE',
        direccion: 'Madrid, España',
        ciudad: 'Madrid',
        pais: 'España',
        email: 'info@rovida.es',
        activo: true,
        estadoCliente: 'activo',
        colorPrimario: '#16a34a',
        colorSecundario: '#22c55e',
        parentCompanyId: vidaro.id,
        notasAdmin: 'Gestión inmobiliaria patrimonial. 17 inmuebles. Contabilidad 2025: 2.808 asientos, €46.2M. 2026 (Ene-Feb): 401 asientos, €724K. 243+ inquilinos. Top: Piamonte €644K/año, Espronceda €131K, Barquillo €93K.',
      },
    });
    console.log(`   Rovida creada (ID: ${rovida.id})`);
  } else {
    // Asegurar que tiene parent correcto y actualizar notas
    await prisma.company.update({
      where: { id: rovida.id },
      data: {
        parentCompanyId: vidaro.id,
        notasAdmin: 'Gestión inmobiliaria patrimonial. 17 inmuebles. Contabilidad 2025: 2.808 asientos, €46.2M. 2026 (Ene-Feb): 401 asientos, €724K. 243+ inquilinos. Top: Piamonte €644K/año, Espronceda €131K, Barquillo €93K.',
      },
    });
    console.log(`   Rovida encontrada y actualizada (ID: ${rovida.id}, nombre: ${rovida.nombre})`);
  }

  // Viroda (filial)
  let viroda = await prisma.company.findFirst({
    where: {
      OR: [
        { id: 'viroda-inversiones' },
        { nombre: { contains: 'Viroda', mode: 'insensitive' } },
      ],
    },
  });

  if (!viroda) {
    viroda = await prisma.company.create({
      data: {
        id: 'viroda-inversiones',
        nombre: 'Viroda Inversiones S.L.U.',
        cif: 'B-PENDIENTE',
        direccion: 'Madrid, España',
        ciudad: 'Madrid',
        pais: 'España',
        email: 'info@viroda.es',
        activo: true,
        estadoCliente: 'activo',
        colorPrimario: '#dc2626',
        colorSecundario: '#ef4444',
        parentCompanyId: vidaro.id,
        notasAdmin: 'Inversiones inmobiliarias residenciales. 2025: 3.169 asientos, €37.7M. 2026: 450 asientos, €463K. 101 inquilinos. Silvela 5 (14 uds), Reina 15 (10 viv), Candelaria Mora (6 viv), H.Tejada 6 (garajes), M.Pelayo (2 viv). Renta anual ~€600K.',
      },
    });
    console.log(`   Viroda Inversiones creada (ID: ${viroda.id})`);
  } else {
    await prisma.company.update({
      where: { id: viroda.id },
      data: {
        parentCompanyId: vidaro.id,
        notasAdmin: 'Inversiones inmobiliarias residenciales. 2025: 3.169 asientos, €37.7M. 2026: 450 asientos, €463K. 101 inquilinos. Silvela 5 (14 uds), Reina 15 (10 viv), Candelaria Mora (6 viv), H.Tejada 6 (garajes), M.Pelayo (2 viv). Renta anual ~€600K.',
      },
    });
    console.log(`   Viroda Inversiones encontrada y actualizada (ID: ${viroda.id}, nombre: ${viroda.nombre})`);
  }

  // 2. Buscar o crear el usuario
  console.log('\n2. Configurando usuario...\n');

  let user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash('Vidaro2025!', 10);
    user = await prisma.user.create({
      data: {
        email: TARGET_EMAIL,
        name: 'D. Villagra',
        password: hashedPassword,
        role: 'administrador',
        companyId: vidaro.id, // Primary = holding
        activo: true,
      },
    });
    console.log(`   ✅ Usuario creado: ${user.email} (ID: ${user.id})`);
  } else {
    console.log(`   ✅ Usuario encontrado: ${user.email} (ID: ${user.id})`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Company actual: ${user.companyId}`);
  }

  // Asegurar que el companyId principal apunta a Vidaro (holding)
  if (user.companyId !== vidaro.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: vidaro.id },
    });
    console.log(`   🔄 CompanyId actualizado de ${user.companyId} → ${vidaro.id}`);
  }

  // 3. Crear/actualizar accesos a las 3 empresas
  console.log('\n3. Configurando accesos multi-empresa...\n');

  const companies = [
    { company: vidaro, label: 'Vidaro Inversiones' },
    { company: rovida, label: 'Rovida' },
    { company: viroda, label: 'Viroda Inversiones' },
  ];

  for (const { company, label } of companies) {
    const existing = await prisma.userCompanyAccess.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
    });

    if (existing) {
      await prisma.userCompanyAccess.update({
        where: { id: existing.id },
        data: {
          roleInCompany: 'administrador',
          activo: true,
          lastAccess: new Date(),
        },
      });
      console.log(`   ✅ Acceso actualizado: ${label} (administrador)`);
    } else {
      await prisma.userCompanyAccess.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleInCompany: 'administrador',
          activo: true,
          grantedBy: user.id,
        },
      });
      console.log(`   ✅ Acceso creado: ${label} (administrador)`);
    }
  }

  // 4. Verificación final
  console.log('\n4. Verificación final...\n');

  const finalUser = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    include: {
      company: { select: { id: true, nombre: true } },
    },
  });

  const accesses = await prisma.userCompanyAccess.findMany({
    where: { userId: user.id, activo: true },
    include: { company: { select: { id: true, nombre: true } } },
  });

  console.log(`   Usuario: ${finalUser?.email}`);
  console.log(`   Rol: ${finalUser?.role}`);
  console.log(`   Empresa principal: ${finalUser?.company?.nombre} (${finalUser?.company?.id})`);
  console.log(`   Accesos activos: ${accesses.length}`);
  accesses.forEach((a) => {
    console.log(`     - ${a.company.nombre} (${a.roleInCompany})`);
  });

  console.log('\n====================================================================');
  console.log('  ✅ CONFIGURACIÓN COMPLETADA');
  console.log('====================================================================');
  console.log(`  El usuario ${TARGET_EMAIL} ahora tiene acceso a:`);
  console.log('  🏢 Vidaro Inversiones S.L. (holding)');
  console.log('  🏢 Rovida S.L. (filial)');
  console.log('  🏢 Viroda Inversiones S.L.U. (filial)');
  console.log('');
  console.log('  En el sidebar aparecerá el selector con las 3 sociedades.');
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
