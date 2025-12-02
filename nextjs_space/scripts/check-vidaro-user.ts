import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@grupovidaro.com' },
      include: { company: true }
    });
    
    console.log('\n========== USUARIO ==========');
    if (user) {
      console.log('Usuario encontrado:');
      console.log('   Email:', user.email);
      console.log('   Nombre:', user.name);
      console.log('   Rol:', user.role);
      console.log('   CompanyId:', user.companyId);
      console.log('   Empresa:', user.company?.nombre || 'Sin empresa');
      console.log('   Activo:', user.activo);
      
      if (user.companyId) {
        const counts = await prisma.$transaction([
          prisma.building.count({ where: { companyId: user.companyId } }),
          prisma.unit.count({ where: { building: { companyId: user.companyId } } }),
          prisma.tenant.count({ where: { companyId: user.companyId } }),
          prisma.contract.count({ where: { tenant: { companyId: user.companyId } } }),
        ]);
        
        console.log('\n========== DATOS DE LA EMPRESA ==========');
        console.log('   Edificios:', counts[0]);
        console.log('   Unidades:', counts[1]);
        console.log('   Inquilinos:', counts[2]);
        console.log('   Contratos:', counts[3]);
        
        const buildings = await prisma.building.findMany({
          where: { companyId: user.companyId },
          take: 5,
          select: { id: true, nombre: true, direccion: true }
        });
        
        console.log('\n========== PRIMEROS EDIFICIOS ==========');
        buildings.forEach((b, i) => {
          console.log(`   ${i + 1}. ${b.nombre} - ${b.direccion}`);
        });
      }
    } else {
      console.log('Usuario NO encontrado');
      
      const users = await prisma.user.findMany({
        select: { email: true, name: true, role: true, companyId: true }
      });
      
      console.log('\n========== USUARIOS EXISTENTES ==========');
      users.forEach(u => {
        console.log('  ', u.email, '(', u.role, ') - CompanyId:', u.companyId);
      });
      
      const companies = await prisma.company.findMany({
        where: {
          OR: [
            { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
            { nombre: { contains: 'Rovida', mode: 'insensitive' } },
            { nombre: { contains: 'Viroda', mode: 'insensitive' } }
          ]
        }
      });
      
      console.log('\n========== EMPRESAS VIDARO ==========');
      if (companies.length > 0) {
        companies.forEach(c => {
          console.log('   Encontrada:', c.nombre, '(ID:', c.id + ')');
        });
      } else {
        console.log('   No se encontro ninguna empresa Vidaro');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
