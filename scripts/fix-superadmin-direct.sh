#!/bin/bash
# Fix directo de credenciales de superadministrador

set -e

echo "🔐 Corrigiendo credenciales de superadministrador..."
echo

cd /opt/inmova-app

# Cargar solo DATABASE_URL
export DATABASE_URL=$(grep "^DATABASE_URL=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL no encontrado en .env.production"
    exit 1
fi

echo "✅ DATABASE_URL cargado"
echo

# Ejecutar script Node.js inline
node << 'NODEJS'
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSuperAdmin() {
    console.log('1️⃣ Verificando/creando compañía...');
    
    let company = await prisma.company.findFirst();
    
    if (!company) {
        console.log('  📝 Creando compañía...');
        company = await prisma.company.create({
            data: {
                nombre: 'Inmova Principal',
                nif: 'B12345678',
                activo: true,
                plan: 'ENTERPRISE',
            },
        });
        console.log(`  ✅ Compañía creada: ${company.id}`);
    } else {
        console.log(`  ✅ Compañía existe: ${company.id}`);
    }
    
    console.log('\n2️⃣ Configurando admin@inmova.app...');
    const adminPassword = 'Admin123!';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.upsert({
        where: { email: 'admin@inmova.app' },
        update: {
            password: adminHash,
            role: 'SUPERADMIN',
            activo: true,
            companyId: company.id,
            emailVerified: new Date(),
        },
        create: {
            email: 'admin@inmova.app',
            name: 'Administrador Principal',
            password: adminHash,
            role: 'SUPERADMIN',
            activo: true,
            companyId: company.id,
            emailVerified: new Date(),
        },
    });
    
    console.log('  ✅ admin@inmova.app configurado');
    
    console.log('\n3️⃣ Configurando test@inmova.app...');
    const testPassword = 'Test123456!';
    const testHash = await bcrypt.hash(testPassword, 10);
    
    await prisma.user.upsert({
        where: { email: 'test@inmova.app' },
        update: {
            password: testHash,
            role: 'ADMIN',
            activo: true,
            companyId: company.id,
            emailVerified: new Date(),
        },
        create: {
            email: 'test@inmova.app',
            name: 'Usuario de Prueba',
            password: testHash,
            role: 'ADMIN',
            activo: true,
            companyId: company.id,
            emailVerified: new Date(),
        },
    });
    
    console.log('  ✅ test@inmova.app configurado');
    
    console.log('\n4️⃣ Verificando passwords...');
    const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@inmova.app' },
    });
    
    const testUser = await prisma.user.findUnique({
        where: { email: 'test@inmova.app' },
    });
    
    const adminWorks = await bcrypt.compare(adminPassword, adminUser.password);
    const testWorks = await bcrypt.compare(testPassword, testUser.password);
    
    console.log(`  Admin password: ${adminWorks ? '✅' : '❌'}`);
    console.log(`  Test password: ${testWorks ? '✅' : '❌'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CREDENCIALES CONFIGURADAS CORRECTAMENTE');
    console.log('='.repeat(60));
    console.log('\n🔐 SUPERADMINISTRADOR:');
    console.log('   Email: admin@inmova.app');
    console.log('   Password: Admin123!');
    console.log('   Rol: SUPERADMIN');
    console.log('   Estado: ' + (adminUser.activo ? 'Activo ✅' : 'Inactivo ❌'));
    
    console.log('\n🧪 USUARIO DE PRUEBA:');
    console.log('   Email: test@inmova.app');
    console.log('   Password: Test123456!');
    console.log('   Rol: ADMIN');
    console.log('   Estado: ' + (testUser.activo ? 'Activo ✅' : 'Inactivo ❌'));
    
    console.log('\n🌐 URLs DE PRUEBA:');
    console.log('   http://157.180.119.236/login');
    console.log('   https://inmovaapp.com/login');
    console.log('='.repeat(60));
    
    await prisma.$disconnect();
}

fixSuperAdmin().catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});
NODEJS

echo
echo "✅ Script completado"
