// Script para crear usuario de prueba
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    // Generar hash
    const password = 'Test123456!';
    const hash = await bcrypt.hash(password, 10);
    console.log('🔐 Hash generado:', hash.substring(0, 20) + '...');
    
    // Buscar o crear company
    let company = await prisma.company.findFirst();
    
    if (!company) {
      console.log('📦 No hay companies, creando una...');
      company = await prisma.company.create({
        data: {
          name: 'Empresa de Prueba',
          email: 'empresa@prueba.com',
          businessVertical: 'alquiler_tradicional'
        }
      });
      console.log('✅ Company creada:', company.id);
    } else {
      console.log('📦 Company encontrada:', company.id);
    }
    
    // Verificar si usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'principiante@gestor.es' }
    });
    
    if (existingUser) {
      console.log('👤 Usuario ya existe, actualizando...');
      const updated = await prisma.user.update({
        where: { email: 'principiante@gestor.es' },
        data: {
          password: hash,
          activo: true,
          role: 'gestor',
          name: 'Usuario Principiante',
          companyId: company.id
        }
      });
      console.log('✅ Usuario actualizado:', updated.email);
    } else {
      console.log('👤 Usuario no existe, creando...');
      const user = await prisma.user.create({
        data: {
          email: 'principiante@gestor.es',
          password: hash,
          name: 'Usuario Principiante',
          role: 'gestor',
          activo: true,
          companyId: company.id
        }
      });
      console.log('✅ Usuario creado:', user.email);
    }
    
    // Verificar
    const user = await prisma.user.findUnique({
      where: { email: 'principiante@gestor.es' },
      select: {
        email: true,
        name: true,
        role: true,
        activo: true,
        companyId: true
      }
    });
    
    console.log('\n✅ Usuario verificado:');
    console.log(JSON.stringify(user, null, 2));
    
    console.log('\n📋 CREDENCIALES:');
    console.log('   Email: principiante@gestor.es');
    console.log('   Password: Test123456!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
