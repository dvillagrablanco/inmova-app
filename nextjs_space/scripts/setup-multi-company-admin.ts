import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

async function setupMultiCompanyAdmin() {
  try {
    console.log('🔍 Buscando usuario admin@grupovidaro.com...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'admin@grupovidaro.com' }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.name} (ID: ${user.id})`);
    console.log(`   Empresa actual: ${user.companyId}`);
    console.log(`   Rol: ${user.role}`);

    // Buscar las tres empresas
    console.log('\n🔍 Buscando empresas...');
    
    const grupoVidaro = await prisma.company.findFirst({
      where: { 
        OR: [
          { nombre: { contains: 'Grupo Vidaro', mode: 'insensitive' } },
          { nombre: { contains: 'Vidaro Inversiones', mode: 'insensitive' } }
        ]
      }
    });
    
    const rovidaGestion = await prisma.company.findFirst({
      where: { nombre: { contains: 'Rovida', mode: 'insensitive' } }
    });
    
    const virodaGestion = await prisma.company.findFirst({
      where: { nombre: { contains: 'Viroda', mode: 'insensitive' } }
    });

    const empresas = [
      { nombre: 'Grupo Vidaro Inversiones', company: grupoVidaro },
      { nombre: 'Rovida Gestión', company: rovidaGestion },
      { nombre: 'Viroda Gestión', company: virodaGestion }
    ];

    console.log('\n📋 Empresas encontradas:');
    empresas.forEach(({ nombre, company }) => {
      if (company) {
        console.log(`   ✅ ${nombre}: ${company.nombre} (ID: ${company.id})`);
      } else {
        console.log(`   ❌ ${nombre}: No encontrada`);
      }
    });

    // Verificar accesos existentes
    console.log('\n🔍 Verificando accesos existentes...');
    const existingAccess = await prisma.userCompanyAccess.findMany({
      where: { userId: user.id },
      include: { company: true }
    });

    console.log(`   Accesos actuales: ${existingAccess.length}`);
    existingAccess.forEach(access => {
      console.log(`   - ${access.company.nombre} (${access.roleInCompany}, activo: ${access.activo})`);
    });

    // Crear accesos para las tres empresas
    console.log('\n🔧 Configurando accesos multi-empresa...');
    
    for (const { nombre, company } of empresas) {
      if (!company) {
        console.log(`   ⏭️  Saltando ${nombre} (no encontrada)`);
        continue;
      }

      // Verificar si ya existe el acceso
      const existingAccess = await prisma.userCompanyAccess.findFirst({
        where: {
          userId: user.id,
          companyId: company.id
        }
      });

      if (existingAccess) {
        // Actualizar el acceso existente
        await prisma.userCompanyAccess.update({
          where: { id: existingAccess.id },
          data: {
            roleInCompany: 'administrador',
            activo: true,
            lastAccess: new Date()
          }
        });
        console.log(`   ✅ Actualizado acceso a ${company.nombre} como administrador`);
      } else {
        // Crear nuevo acceso
        await prisma.userCompanyAccess.create({
          data: {
            userId: user.id,
            companyId: company.id,
            roleInCompany: 'administrador',
            activo: true,
            grantedBy: user.id,
            grantedAt: new Date()
          }
        });
        console.log(`   ✅ Creado acceso a ${company.nombre} como administrador`);
      }
    }

    // Si el usuario tiene Grupo Vidaro como empresa principal, actualizar
    if (grupoVidaro && user.companyId !== grupoVidaro.id) {
      console.log('\n🔄 Actualizando empresa principal del usuario...');
      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: grupoVidaro.id }
      });
      console.log(`   ✅ Empresa principal actualizada a: ${grupoVidaro.nombre}`);
    }

    // Verificar resultado final
    console.log('\n📊 Resumen final:');
    const finalAccess = await prisma.userCompanyAccess.findMany({
      where: { userId: user.id },
      include: { company: true }
    });

    console.log(`\n✅ El usuario ${user.email} ahora tiene acceso a ${finalAccess.length} empresas:`);
    finalAccess.forEach((access, index) => {
      console.log(`   ${index + 1}. ${access.company.nombre}`);
      console.log(`      - Rol: ${access.roleInCompany}`);
      console.log(`      - Activo: ${access.activo}`);
      console.log(`      - ID Empresa: ${access.companyId}`);
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { company: true }
    });

    console.log(`\n🏢 Empresa principal: ${updatedUser?.company.nombre}`);
    console.log(`   ID: ${updatedUser?.companyId}`);

    console.log('\n✅ Configuración multi-empresa completada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupMultiCompanyAdmin();
