/**
 * Script para crear/actualizar usuarios de eWoorker
 * 
 * Uso:
 *   DATABASE_URL="..." npx tsx scripts/setup-ewoorker-users.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface UserConfig {
  email: string;
  name: string;
  password: string;
  role: string;
  companyName: string;
  tipoEmpresa: string;
}

const EWOORKER_USERS: UserConfig[] = [
  {
    email: 'socio@ewoorker.com',
    name: 'Socio Fundador eWoorker',
    password: 'Socio123!',
    role: 'socio_ewoorker',
    companyName: 'eWoorker Platform',
    tipoEmpresa: 'CONTRATISTA_PRINCIPAL',
  },
  {
    email: 'contratista@ewoorker.com',
    name: 'Contratista Demo',
    password: 'Contratista123!',
    role: 'contratista_ewoorker',
    companyName: 'Constructora Demo S.L.',
    tipoEmpresa: 'CONTRATISTA_PRINCIPAL',
  },
  {
    email: 'subcontratista@ewoorker.com',
    name: 'Subcontratista Demo',
    password: 'Subcontratista123!',
    role: 'subcontratista_ewoorker',
    companyName: 'Instalaciones Eléctricas Demo S.L.',
    tipoEmpresa: 'SUBCONTRATISTA_N1',
  },
];

async function setupUsers() {
  console.log('🔧 Configurando usuarios de eWoorker...\n');

  for (const userConfig of EWOORKER_USERS) {
    console.log(`📦 Procesando: ${userConfig.email}`);
    
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userConfig.password, 10);

      // Buscar o crear empresa
      let company = await prisma.company.findFirst({
        where: { nombre: userConfig.companyName },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            nombre: userConfig.companyName,
            email: userConfig.email,
            telefono: '+34600000000',
            cif: `B${Math.random().toString().slice(2, 10)}`,
            direccion: 'Calle Demo 123',
            ciudad: 'Madrid',
            codigoPostal: '28001',
            pais: 'España',
            activo: true,
          },
        });
        console.log(`   ✅ Empresa creada: ${company.nombre}`);
      }

      // Buscar usuario existente
      let user = await prisma.user.findUnique({
        where: { email: userConfig.email },
      });

      if (user) {
        // Actualizar usuario existente
        user = await prisma.user.update({
          where: { email: userConfig.email },
          data: {
            name: userConfig.name,
            password: hashedPassword,
            role: userConfig.role as any,
            activo: true,
            companyId: company.id,
          },
        });
        console.log(`   ✅ Usuario actualizado (ID: ${user.id})`);
      } else {
        // Crear nuevo usuario
        user = await prisma.user.create({
          data: {
            email: userConfig.email,
            name: userConfig.name,
            password: hashedPassword,
            role: userConfig.role as any,
            activo: true,
            companyId: company.id,
          },
        });
        console.log(`   ✅ Usuario creado (ID: ${user.id})`);
      }

      // Crear o actualizar perfil eWoorker
      let perfilEwoorker = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { companyId: company.id },
      });

      if (!perfilEwoorker) {
        perfilEwoorker = await prisma.ewoorkerPerfilEmpresa.create({
          data: {
            companyId: company.id,
            tipoEmpresa: userConfig.tipoEmpresa as any,
            especialidades: ['General'],
            subespecialidades: [],
            numeroTrabajadores: 10,
            experienciaAnios: 5,
            zonasOperacion: ['Madrid', 'Toledo'],
            radioOperacionKm: 100,
            verificado: true,
            disponibleParaProyectos: true,
            visibleEnMarketplace: true,
          },
        });
        console.log(`   ✅ Perfil eWoorker creado`);
      }

      console.log(`   📧 Email: ${userConfig.email}`);
      console.log(`   🔑 Password: ${userConfig.password}`);
      console.log(`   👤 Role: ${userConfig.role}`);
      console.log('');

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // Resumen
  console.log('=' .repeat(60));
  console.log('📊 RESUMEN - USUARIOS EWOORKER');
  console.log('=' .repeat(60));

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['socio_ewoorker', 'contratista_ewoorker', 'subcontratista_ewoorker'],
      },
    },
    select: {
      email: true,
      name: true,
      role: true,
      activo: true,
      company: { select: { nombre: true } },
    },
  });

  console.log('\n📋 Usuarios configurados:\n');
  users.forEach(u => {
    const status = u.activo ? '✅' : '❌';
    console.log(`${status} ${u.email}`);
    console.log(`   Nombre: ${u.name}`);
    console.log(`   Role: ${u.role}`);
    console.log(`   Empresa: ${u.company?.nombre || 'N/A'}`);
    console.log('');
  });

  console.log('\n🔐 CREDENCIALES DE ACCESO:');
  console.log('-'.repeat(60));
  EWOORKER_USERS.forEach(u => {
    console.log(`📧 ${u.email}`);
    console.log(`   Password: ${u.password}`);
    console.log('');
  });
}

async function main() {
  try {
    await setupUsers();
    console.log('\n✅ Configuración completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
