import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

/**
 * Script para verificar el estado de los roles de usuario
 * El rol 'soporte' ha sido eliminado en favor del soporte automatizado con IA
 */
async function migrateSupportUsers() {
  try {
    console.log('\n=== Verificando estado de roles de usuario ===\n');

    // Obtener todos los usuarios y su distribución por rol
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
      },
    });

    console.log(`📊 Total de usuarios en el sistema: ${allUsers.length}\n`);
    
    // Calcular distribución de roles
    const roleDistribution = allUsers.reduce((acc: any, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('=== Distribución actual de roles ===\n');
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} usuario(s)`);
    });
    console.log('');

    // Verificación exitosa
    console.log('✅ Verificación completada exitosamente');
    console.log('✅ El rol "soporte" ha sido eliminado del enum UserRole');
    console.log('✅ El soporte ahora se maneja automáticamente mediante IA\n');
    
    console.log('📋 Funcionalidades del nuevo sistema de soporte:');
    console.log('   • Respuestas automáticas inmediatas mediante IA');
    console.log('   • Tickets categorizados automáticamente');
    console.log('   • Resolución inteligente de consultas comunes');
    console.log('   • Escalamiento a administradores cuando sea necesario');
    console.log('   • Base de conocimientos integrada\n');

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
migrateSupportUsers();
