import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Iniciando creación de estructura Grupo Vidaro Inversiones...\n');

    // 1. Crear empresa matriz: Grupo Vidaro Inversiones
    console.log('📊 Creando empresa matriz: Grupo Vidaro Inversiones...');
    const grupoVidaro = await prisma.company.create({
      data: {
        nombre: 'Grupo Vidaro Inversiones',
        cif: 'B-VIDARO-001',
        direccion: 'Por definir',
        email: 'info@grupovidaro.com',
        telefono: '+34 000 000 000',
        estadoCliente: 'activo',
        activo: true,
        contactoPrincipal: 'Por definir',
        emailContacto: 'contacto@grupovidaro.com',
        telefonoContacto: '+34 000 000 000',
        notasAdmin: 'Empresa matriz del Grupo Vidaro. Estructura jerárquica con Rovida y Viroda Inversiones como empresas dependientes.'
      }
    });
    console.log(`✅ Empresa matriz creada: ${grupoVidaro.nombre} (ID: ${grupoVidaro.id})\n`);

    // 2. Crear empresa hija: Rovida
    console.log('🏢 Creando empresa hija: Rovida...');
    const rovida = await prisma.company.create({
      data: {
        nombre: 'Rovida',
        cif: 'B-ROVIDA-001',
        direccion: 'Por definir',
        email: 'info@rovida.com',
        telefono: '+34 000 000 001',
        estadoCliente: 'activo',
        activo: true,
        contactoPrincipal: 'Por definir',
        emailContacto: 'contacto@rovida.com',
        telefonoContacto: '+34 000 000 001',
        parentCompanyId: grupoVidaro.id,
        notasAdmin: 'Empresa dependiente del Grupo Vidaro Inversiones.'
      }
    });
    console.log(`✅ Empresa hija creada: ${rovida.nombre} (ID: ${rovida.id})\n`);

    // 3. Crear empresa hija: Viroda Inversiones
    console.log('🏢 Creando empresa hija: Viroda Inversiones...');
    const virodaInversiones = await prisma.company.create({
      data: {
        nombre: 'Viroda Inversiones',
        cif: 'B-VIRODA-001',
        direccion: 'Por definir',
        email: 'info@virodainversiones.com',
        telefono: '+34 000 000 002',
        estadoCliente: 'activo',
        activo: true,
        contactoPrincipal: 'Por definir',
        emailContacto: 'contacto@virodainversiones.com',
        telefonoContacto: '+34 000 000 002',
        parentCompanyId: grupoVidaro.id,
        notasAdmin: 'Empresa dependiente del Grupo Vidaro Inversiones.'
      }
    });
    console.log(`✅ Empresa hija creada: ${virodaInversiones.nombre} (ID: ${virodaInversiones.id})\n`);

    // 4. Crear usuarios para cada empresa
    console.log('👥 Creando usuarios...\n');
    
    const hashedPassword = await bcrypt.hash('vidaro2025', 10);
    
    const usuarios = [
      // Grupo Vidaro Inversiones
      {
        email: 'admin@grupovidaro.com',
        name: 'Administrador Grupo Vidaro',
        role: 'administrador',
        companyId: grupoVidaro.id,
        companyName: 'Grupo Vidaro Inversiones'
      },
      {
        email: 'director.financiero@grupovidaro.com',
        name: 'Director Financiero Grupo Vidaro',
        role: 'gestor',
        companyId: grupoVidaro.id,
        companyName: 'Grupo Vidaro Inversiones'
      },
      
      // Rovida
      {
        email: 'admin@rovida.com',
        name: 'Administrador Rovida',
        role: 'administrador',
        companyId: rovida.id,
        companyName: 'Rovida'
      },
      {
        email: 'operador@rovida.com',
        name: 'Operador Rovida',
        role: 'operador',
        companyId: rovida.id,
        companyName: 'Rovida'
      },
      
      // Viroda Inversiones
      {
        email: 'admin@virodainversiones.com',
        name: 'Administrador Viroda Inversiones',
        role: 'administrador',
        companyId: virodaInversiones.id,
        companyName: 'Viroda Inversiones'
      },
      {
        email: 'propietario@virodainversiones.com',
        name: 'Propietario Viroda Inversiones',
        role: 'gestor',
        companyId: virodaInversiones.id,
        companyName: 'Viroda Inversiones'
      }
    ];

    for (const userData of usuarios) {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role as any,
          companyId: userData.companyId
        }
      });
      console.log(`✅ Usuario creado: ${user.name} (${user.email}) - Rol: ${user.role} - Empresa: ${userData.companyName}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ ESTRUCTURA CREADA EXITOSAMENTE');
    console.log('='.repeat(80));
    console.log('\n📋 RESUMEN DE LA ESTRUCTURA:');
    console.log('\n🏢 Grupo Vidaro Inversiones (Matriz)');
    console.log(`   ID: ${grupoVidaro.id}`);
    console.log(`   └── Rovida (Hija)`);
    console.log(`       ID: ${rovida.id}`);
    console.log(`   └── Viroda Inversiones (Hija)`);
    console.log(`       ID: ${virodaInversiones.id}`);

    console.log('\n👥 USUARIOS CREADOS (Contraseña: vidaro2025):');
    console.log('\n📊 Grupo Vidaro Inversiones:');
    console.log('   • admin@grupovidaro.com (Administrador)');
    console.log('   • director.financiero@grupovidaro.com (Director Financiero)');
    
    console.log('\n🏢 Rovida:');
    console.log('   • admin@rovida.com (Administrador)');
    console.log('   • operador@rovida.com (Operador)');
    
    console.log('\n🏢 Viroda Inversiones:');
    console.log('   • admin@virodainversiones.com (Administrador)');
    console.log('   • propietario@virodainversiones.com (Propietario/Consulta)');

    console.log('\n' + '='.repeat(80));
    console.log('📝 NOTAS IMPORTANTES:');
    console.log('='.repeat(80));
    console.log('• Las empresas están vacías de datos (sin edificios, unidades, inquilinos, etc.)');
    console.log('• La contraseña temporal para todos los usuarios es: vidaro2025');
    console.log('• Se recomienda cambiar las contraseñas en el primer acceso');
    console.log('• Los usuarios con rol "gestor" tienen permisos de lectura y edición limitada');
    console.log('• El rol "operador" tiene permisos principalmente de lectura');
    console.log('\n✅ Script completado exitosamente!\n');

  } catch (error) {
    console.error('❌ Error al crear la estructura:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
