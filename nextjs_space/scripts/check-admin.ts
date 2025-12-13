import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkAdmins() {
  try {
    console.log('Verificando usuarios administradores...\n');
    
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['administrador', 'super_admin']
        }
      },
      include: {
        company: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (admins.length === 0) {
      console.log('⚠️  NO SE ENCONTRARON USUARIOS ADMINISTRADORES');
    } else {
      console.log(`✅ Se encontraron ${admins.length} usuarios administradores:\n`);
      
      for (const admin of admins) {
        console.log(`Email: ${admin.email}`);
        console.log(`Nombre: ${admin.name}`);
        console.log(`Rol: ${admin.role}`);
        console.log(`Activo: ${admin.activo ? '✅ SÍ' : '❌ NO'}`);
        console.log(`Empresa: ${admin.company?.nombre || 'N/A'}`);
        console.log(`ID: ${admin.id}`);
        console.log('---');
      }
    }
    
  } catch (error) {
    console.error('Error al verificar administradores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
