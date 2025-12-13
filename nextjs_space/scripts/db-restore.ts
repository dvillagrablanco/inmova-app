#!/usr/bin/env tsx
/**
 * Script de Restauración de Base de Datos
 * 
 * Este script restaura la base de datos desde un archivo de backup.
 * 
 * ADVERTENCIA: Este proceso sobrescribirá todos los datos actuales en la base de datos.
 * 
 * Uso:
 *   yarn tsx scripts/db-restore.ts <archivo-backup>
 * 
 * Ejemplo:
 *   yarn tsx scripts/db-restore.ts backups/backup-2024-12-09T15-30-00.sql
 */

import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { stat } from 'fs/promises';
import * as readline from 'readline';

const execAsync = promisify(exec);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada');
  process.exit(1);
}

/**
 * Parsea la URL de la base de datos PostgreSQL
 */
function parseDatabaseUrl(url: string) {
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)(\?.*)?$/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('URL de base de datos inválida');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5].split('?')[0],
  };
}

/**
 * Solicita confirmación al usuario
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question + ' (escribe "SI" para confirmar): ', (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase() === 'SI');
    });
  });
}

/**
 * Restaura la base de datos desde un archivo de backup
 */
async function restoreBackup(backupFile: string) {
  try {
    // Verificar que el archivo existe
    if (!existsSync(backupFile)) {
      throw new Error(`El archivo de backup no existe: ${backupFile}`);
    }
    
    const stats = await stat(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('🔄 RESTAURACIÓN DE BASE DE DATOS');
    console.log('='.repeat(60));
    console.log(`   Archivo: ${backupFile}`);
    console.log(`   Tamaño: ${sizeMB} MB`);
    console.log('='.repeat(60) + '\n');
    
    // Solicitar confirmación
    console.log('⚠️  ADVERTENCIA:');
    console.log('   Esta operación sobrescribirá TODOS los datos actuales en la base de datos.');
    console.log('   Esta acción NO se puede deshacer.\n');
    
    const confirmed = await askConfirmation('¿Estás seguro de que deseas continuar?');
    
    if (!confirmed) {
      console.log('\n❌ Operación cancelada por el usuario\n');
      process.exit(0);
    }
    
    const dbConfig = parseDatabaseUrl(DATABASE_URL!);
    
    console.log('\n🔄 Iniciando restauración...');
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Host: ${dbConfig.host}`);
    
    // Usar psql para restaurar el backup
    const command = `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${backupFile}"`;
    
    await execAsync(command);
    
    console.log('\n✅ Restauración completada exitosamente');
    console.log('\n' + '='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Error al restaurar backup:', error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const backupFile = process.argv[2];
  
  if (!backupFile) {
    console.error('\n❌ ERROR: Debes especificar el archivo de backup\n');
    console.log('Uso: yarn tsx scripts/db-restore.ts <archivo-backup>\n');
    console.log('Ejemplo: yarn tsx scripts/db-restore.ts backups/backup-2024-12-09T15-30-00.sql\n');
    process.exit(1);
  }
  
  try {
    await restoreBackup(backupFile);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}
