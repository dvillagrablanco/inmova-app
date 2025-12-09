#!/usr/bin/env tsx
/**
 * Script de Backup Automático de Base de Datos
 * 
 * Este script realiza backups automáticos de la base de datos PostgreSQL.
 * Se puede ejecutar manualmente o mediante un cron job.
 * 
 * Uso:
 *   yarn tsx scripts/db-backup.ts
 * 
 * Cron job sugerido (backup diario a las 3 AM):
 *   0 3 * * * cd /ruta/proyecto && yarn tsx scripts/db-backup.ts
 */

import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, readdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Configuración
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 30; // Mantener los últimos 30 backups
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
 * Crea el directorio de backups si no existe
 */
async function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
    console.log(`✅ Directorio de backups creado: ${BACKUP_DIR}`);
  }
}

/**
 * Realiza el backup de la base de datos
 */
async function performBackup() {
  try {
    const dbConfig = parseDatabaseUrl(DATABASE_URL!);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);
    
    console.log('🔄 Iniciando backup de base de datos...');
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Archivo: ${backupFile}`);
    
    // Usar pg_dump para crear el backup
    const command = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${backupFile}"`;
    
    await execAsync(command);
    
    // Verificar que el archivo se creó correctamente
    const stats = await stat(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup completado exitosamente`);
    console.log(`   Tamaño: ${sizeMB} MB`);
    console.log(`   Ubicación: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Error al realizar backup:', error);
    throw error;
  }
}

/**
 * Limpia backups antiguos, manteniendo solo los más recientes
 */
async function cleanOldBackups() {
  try {
    const files = await readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
      .sort()
      .reverse(); // Más recientes primero
    
    if (backupFiles.length > MAX_BACKUPS) {
      console.log(`🧹 Limpiando backups antiguos...`);
      
      const filesToDelete = backupFiles.slice(MAX_BACKUPS);
      
      for (const file of filesToDelete) {
        const filePath = path.join(BACKUP_DIR, file);
        await unlink(filePath);
        console.log(`   🗑️  Eliminado: ${file}`);
      }
      
      console.log(`✅ Se mantienen los ${MAX_BACKUPS} backups más recientes`);
    } else {
      console.log(`✅ Total de backups: ${backupFiles.length} (límite: ${MAX_BACKUPS})`);
    }
  } catch (error) {
    console.error('❌ Error al limpiar backups antiguos:', error);
    // No lanzamos error aquí porque no es crítico
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🗄️  BACKUP AUTOMÁTICO DE BASE DE DATOS');
  console.log('='.repeat(60) + '\n');
  
  try {
    // 1. Asegurar que existe el directorio de backups
    await ensureBackupDir();
    
    // 2. Realizar el backup
    await performBackup();
    
    // 3. Limpiar backups antiguos
    await cleanOldBackups();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO DE BACKUP COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ PROCESO DE BACKUP FALLIDO');
    console.log('='.repeat(60) + '\n');
    
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}
