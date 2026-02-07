import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkData() {
  try {
    const companyIds = [
      'vidaro-inversiones',
      'rovida-sl',
      'rovida-gestion',
      'viroda-inversiones',
      'viroda-gestion',
    ];

    const companies = await prisma.company.findMany({
      where: {
        id: { in: companyIds }
      },
      select: {
        id: true,
        nombre: true,
        _count: {
          select: {
            buildings: true,
            tenants: true,
            users: true
          }
        }
      }
    });
    
    console.log('DATOS POR EMPRESA:');
    console.log('==================\n');
    
    for (const company of companies) {
      console.log(company.nombre, '- ID:', company.id);
      console.log('   Edificios:', company._count.buildings);
      console.log('   Inquilinos:', company._count.tenants);
      console.log('   Usuarios:', company._count.users);
      
      const unitCount = await prisma.unit.count({
        where: { building: { companyId: company.id } }
      });
      console.log('   Unidades:', unitCount);
      console.log('');
    }
    
    const buildings = await prisma.building.findMany({
      where: {
        companyId: { in: companyIds }
      },
      select: {
        nombre: true,
        direccion: true,
        companyId: true,
        company: { select: { nombre: true } }
      }
    });
    
    console.log('\nEDIFICIOS CREADOS:');
    console.log('==================');
    buildings.forEach(b => {
      console.log('-', b.nombre, '-', b.direccion);
      console.log('  Empresa:', b.company.nombre);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
