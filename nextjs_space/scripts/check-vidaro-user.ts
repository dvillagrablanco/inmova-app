import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkVidaroUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@grupovidaro.com' },
      include: {
        company: true,
        companyAccess: {
          include: {
            company: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('👤 Usuario: admin@grupovidaro.com');
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Estado: ${user.activo ? 'Activo' : 'Inactivo'}`);
    console.log(`\n🏢 Empresa principal: ${user.company.nombre}`);
    console.log(`   ID: ${user.companyId}`);
    
    console.log(`\n📋 Acceso a empresas (${user.companyAccess.length}):`);
    for (const access of user.companyAccess) {
      console.log(`\n   ${access.company.nombre}`);
      console.log(`   - ID: ${access.companyId}`);
      console.log(`   - Rol: ${access.roleInCompany}`);
      console.log(`   - Activo: ${access.activo}`);
      
      // Contar datos de cada empresa
      const [buildings, units, tenants] = await Promise.all([
        prisma.building.count({ where: { companyId: access.companyId } }),
        prisma.unit.count({ where: { building: { companyId: access.companyId } } }),
        prisma.tenant.count({ where: { companyId: access.companyId } })
      ]);
      
      console.log(`   - Edificios: ${buildings}`);
      console.log(`   - Unidades: ${units}`);
      console.log(`   - Inquilinos: ${tenants}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVidaroUser();
