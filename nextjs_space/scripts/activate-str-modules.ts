import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateSTRModules() {
  try {
    // Obtener la primera empresa (INMOVA)
    const company = await prisma.company.findFirst();
    
    if (!company) {
      console.error('No se encontró ninguna empresa');
      return;
    }

    console.log(`Activando módulos para empresa: ${company.nombre} (${company.id})`);

    const modulesToActivate = [
      'str_listings',
      'str_bookings',
      'str_channels',
      'flipping_projects',
      'construction_projects',
      'professional_projects'
    ];

    for (const moduleCode of modulesToActivate) {
      // Verificar si ya existe
      const existing = await prisma.companyModule.findFirst({
        where: {
          companyId: company.id,
          moduloCodigo: moduleCode
        }
      });

      if (existing) {
        if (!existing.activo) {
          // Activar si existe pero está desactivado
          await prisma.companyModule.update({
            where: { id: existing.id },
            data: { activo: true }
          });
          console.log(`✓ Módulo ${moduleCode} reactivado`);
        } else {
          console.log(`✓ Módulo ${moduleCode} ya está activo`);
        }
      } else {
        // Activar módulo
        await prisma.companyModule.create({
          data: {
            companyId: company.id,
            moduloCodigo: moduleCode,
            activo: true
          }
        });
        console.log(`✓ Módulo ${moduleCode} activado`);
      }
    }

    console.log('\n✅ Todos los módulos multi-vertical han sido activados');
    
    // Mostrar módulos activos
    const activeModules = await prisma.companyModule.findMany({
      where: {
        companyId: company.id,
        activo: true
      },
      orderBy: {
        moduloCodigo: 'asc'
      }
    });
    
    console.log(`\nTotal de módulos activos: ${activeModules.length}`);
    console.log('\nMódulos multi-vertical activos:');
    const multiVerticalModules = activeModules.filter(m => 
      m.moduloCodigo.startsWith('str_') || 
      m.moduloCodigo.includes('flipping') || 
      m.moduloCodigo.includes('construction') || 
      m.moduloCodigo.includes('professional')
    );
    multiVerticalModules.forEach(m => console.log(`  - ${m.moduloCodigo}`));

  } catch (error) {
    console.error('Error activando módulos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateSTRModules();
