/**
 * Script para crear usuario administrador directamente en PostgreSQL
 * Sin dependencias de Prisma
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  console.log('🔐 Creando usuario administrador...\n');

  // Conectar a la base de datos
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Verificar si existe el usuario
    const checkUser = await client.query('SELECT email FROM users WHERE email = $1', [
      'admin@inmova.app',
    ]);

    if (checkUser.rows.length > 0) {
      console.log('⚠️  El usuario admin@inmova.app ya existe\n');
      console.log('🔐 CREDENCIALES:\n');
      console.log('   Email: admin@inmova.app');
      console.log('   Password: demo123\n');
      return;
    }

    // 2. Crear/verificar empresa
    let companyId;
    const checkCompany = await client.query('SELECT id FROM companies WHERE email = $1', [
      'demo@inmova.app',
    ]);

    if (checkCompany.rows.length > 0) {
      companyId = checkCompany.rows[0].id;
      console.log(`✅ Empresa encontrada: ${companyId}\n`);
    } else {
      console.log('📦 Creando empresa demo...');
      const newCompany = await client.query(
        `INSERT INTO companies (id, nombre, email, telefono, activo, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        ['Inmova Demo', 'demo@inmova.app', '+34 900 000 000', true]
      );
      companyId = newCompany.rows[0].id;
      console.log(`✅ Empresa creada: ${companyId}\n`);
    }

    // 3. Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    const hashedPassword = await bcrypt.hash('demo123', 10);

    await client.query(
      `INSERT INTO users (id, email, name, password, role, company_id, activo, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      ['admin@inmova.app', 'Admin Demo', hashedPassword, 'SUPERADMIN', companyId, true]
    );

    console.log('✅ Usuario creado exitosamente!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 USUARIO ADMINISTRADOR CREADO');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔐 CREDENCIALES DE ACCESO:\n');
    console.log('   Email: admin@inmova.app');
    console.log('   Password: demo123\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🌐 Ve a: https://inmovaapp.com/login\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

createAdmin().catch(console.error);
