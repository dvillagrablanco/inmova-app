import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function cleanDuplicateAccess() {
  try {
    console.log('🧹 Limpiando accesos duplicados...\n');
    
    const user = await prisma.user.findUnique({
      where: { email: 'admin@grupovidaro.com' }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    // IDs de las empresas vacías que queremos eliminar
    const emptyCompanyIds = [
      'cminb4edb0002mqqe5qfestnz', // Rovida (vacía)
      'cminb4edf0004mqqe1vz067wg'  // Viroda Inversiones (vacía)
    ];

    console.log('🗑️  Eliminando accesos a empresas vacías duplicadas...');
    
    for (const companyId of emptyCompanyIds) {
      const deleted = await prisma.userCompanyAccess.deleteMany({
        where: {
          userId: user.id,
          companyId: companyId
        }
      });
      
      if (deleted.count > 0) {
        console.log(`   ✅ Eliminado acceso a empresa ${companyId}`);
      }
    }

    // Verificar resultado
    console.log('\n📊 Verificando resultado...');
    const finalAccess = await prisma.userCompanyAccess.findMany({
      where: { userId: user.id },
      include: { company: true }
    });

    console.log(`\n✅ El usuario admin@grupovidaro.com ahora tiene acceso a ${finalAccess.length} empresas:\n`);
    
    for (let i = 0; i < finalAccess.length; i++) {
      const access = finalAccess[i];
      const [buildings, units, tenants] = await Promise.all([
        prisma.building.count({ where: { companyId: access.companyId } }),
        prisma.unit.count({ where: { building: { companyId: access.companyId } } }),
        prisma.tenant.count({ where: { companyId: access.companyId } })
      ]);
      
      console.log(`   ${i + 1}. ${access.company.nombre}`);
      console.log(`      - Rol: ${access.roleInCompany}`);
      console.log(`      - Edificios: ${buildings}, Unidades: ${units}, Inquilinos: ${tenants}`);
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { company: true }
    });

    console.log(`\n🏢 Empresa principal: ${updatedUser?.company.nombre}`);
    console.log('\n✅ Limpieza completada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicateAccess();
