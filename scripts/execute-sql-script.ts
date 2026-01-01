#!/usr/bin/env ts-node
/**
 * Script para ejecutar el SQL de creación de usuarios
 */

import { getPrismaClient } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

const prisma = getPrismaClient();

async function main() {
  console.log('\n🚀 EJECUTANDO SCRIPT SQL DE CREACIÓN DE USUARIOS\n');
  console.log('='.repeat(70));

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create-test-users-simple.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Dividir en statements individuales (separados por ;)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s.toLowerCase() !== 'on conflict');

    console.log(`📄 Leyendo script SQL: ${sqlPath}`);
    console.log(`📊 Total de statements a ejecutar: ${statements.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Ignorar comentarios y líneas vacías
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        console.log(`\n[${i + 1}/${statements.length}] Ejecutando statement...`);
        
        // Ejecutar el SQL
        await prisma.$executeRawUnsafe(statement);
        
        successCount++;
        console.log('✅ Success');
      } catch (error: any) {
        errorCount++;
        console.error('❌ Error:', error.message);
        
        // Continuar con el siguiente statement
        if (!error.message.includes('duplicate key') && !error.message.includes('already exists')) {
          console.error('Details:', error);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE EJECUCIÓN');
    console.log('='.repeat(70));
    console.log(`✅ Statements ejecutados: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📋 Total: ${statements.length}`);

    // Verificar usuarios creados
    console.log('\n🔍 VERIFICANDO USUARIOS CREADOS...\n');
    
    const users = await prisma.$queryRaw<any[]>`
      SELECT 
        email,
        name,
        role,
        (preferences->>'experienceLevel') as experiencia,
        (preferences->>'vertical') as vertical
      FROM "User"
      WHERE email LIKE '%@inmova.app'
      ORDER BY role, email
    `;

    if (users.length === 0) {
      console.log('⚠️ No se encontraron usuarios con @inmova.app');
    } else {
      console.log(`✅ Usuarios encontrados: ${users.length}\n`);
      console.log('| Email                              | Nombre                        | Rol               | Experiencia  | Vertical              |');
      console.log('|------------------------------------|-------------------------------|-------------------|--------------|------------------------|');
      
      users.forEach(user => {
        const email = (user.email || '').padEnd(36);
        const name = (user.name || '').padEnd(29);
        const role = (user.role || '').padEnd(17);
        const exp = (user.experiencia || 'N/A').padEnd(12);
        const vert = (user.vertical || 'N/A').padEnd(22);
        console.log(`| ${email} | ${name} | ${role} | ${exp} | ${vert} |`);
      });
    }

    console.log('\n✅ SCRIPT COMPLETADO\n');
    console.log('🔐 Credenciales de acceso:');
    console.log('   Email: <cualquiera de la tabla>');
    console.log('   Password: Test123456!\n');

  } catch (error: any) {
    console.error('\n❌ ERROR FATAL:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
