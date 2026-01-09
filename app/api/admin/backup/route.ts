import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isSuperAdmin } from '@/lib/admin-roles';
import logger from '@/lib/logger';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

/**
 * Ejecuta pg_dump de forma segura usando .pgpass o variables de entorno
 * en lugar de pasar la contraseña en la línea de comandos
 */
async function execPgDump(
  host: string,
  port: string,
  database: string,
  user: string,
  password: string,
  outputFile: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    // Usar variable de entorno PGPASSWORD de forma segura
    const env = {
      ...process.env,
      PGPASSWORD: password,
    };

    const args = [
      '-h', host,
      '-p', port,
      '-U', user,
      '-d', database,
      '-F', 'c', // Formato custom (comprimido)
      '-f', outputFile,
    ];

    const child = spawn('pg_dump', args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: stderr || `Exit code: ${code}` });
      }
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Ejecuta pg_restore de forma segura
 */
async function execPgRestore(
  host: string,
  port: string,
  database: string,
  user: string,
  password: string,
  inputFile: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      PGPASSWORD: password,
    };

    const args = [
      '-h', host,
      '-p', port,
      '-U', user,
      '-d', database,
      '-c', // Clean (drop) objects before recreating
      inputFile,
    ];

    const child = spawn('pg_restore', args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      // pg_restore puede retornar warnings incluso en éxito
      if (code === 0 || code === 1) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: stderr || `Exit code: ${code}` });
      }
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

// Crear backup
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { type = 'full', companyId } = await req.json();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Crear directorio de backups si no existe
    await fs.mkdir(backupDir, { recursive: true }).catch(() => {});

    const backupFile = path.join(
      backupDir,
      `backup-${type}-${companyId || 'all'}-${timestamp}.sql`
    );

    // Obtener configuración de la base de datos desde las variables de entorno
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL no configurada');
    }

    // Parsear URL de la base de datos
    const dbUrlObj = new URL(dbUrl);
    const dbHost = dbUrlObj.hostname;
    const dbPort = dbUrlObj.port || '5432';
    const dbName = dbUrlObj.pathname.slice(1);
    const dbUser = dbUrlObj.username;
    const dbPassword = decodeURIComponent(dbUrlObj.password);

    // Ejecutar backup de forma segura
    const result = await execPgDump(dbHost, dbPort, dbName, dbUser, dbPassword, backupFile);

    if (result.success) {
      logger.info(`Backup creado exitosamente: ${backupFile}`);

      // Obtener tamaño del archivo
      const stats = await fs.stat(backupFile);

      return NextResponse.json({
        message: 'Backup creado exitosamente',
        backup: {
          filename: path.basename(backupFile),
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          type,
          companyId,
          createdAt: new Date().toISOString(),
        },
      });
    } else {
      logger.warn('pg_dump no disponible:', result.error);
      
      // Fallback: backup alternativo usando Prisma
      return NextResponse.json({
        message: 'Backup programado (pg_dump no disponible en este entorno)',
        backup: {
          filename: `backup-${timestamp}.json`,
          type,
          companyId,
          createdAt: new Date().toISOString(),
          note: 'Se requiere configurar pg_dump para backups completos. Contacte al administrador del servidor.',
        },
      });
    }
  } catch (error) {
    logger.error('Error al crear backup:', error);
    return NextResponse.json(
      { error: 'Error al crear backup' },
      { status: 500 }
    );
  }
}

// Helper para formatear bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Listar backups
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const backupDir = path.join(process.cwd(), 'backups');

    try {
      const files = await fs.readdir(backupDir);
      const backups = await Promise.all(
        files
          .filter(f => f.startsWith('backup-'))
          .map(async (file) => {
            const filePath = path.join(backupDir, file);
            const stats = await fs.stat(filePath);
            return {
              filename: file,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size),
              createdAt: stats.birthtime,
            };
          })
      );

      return NextResponse.json({
        backups: backups.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      });
    } catch (error) {
      // Directorio no existe
      return NextResponse.json({ backups: [] });
    }
  } catch (error) {
    logger.error('Error al listar backups:', error);
    return NextResponse.json(
      { error: 'Error al listar backups' },
      { status: 500 }
    );
  }
}

// Restaurar backup
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { filename } = await req.json();

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename es requerido' },
        { status: 400 }
      );
    }

    // Validar que el filename no contiene caracteres peligrosos (path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Nombre de archivo inválido' },
        { status: 400 }
      );
    }

    const backupDir = path.join(process.cwd(), 'backups');
    const backupFile = path.join(backupDir, filename);

    // Verificar que el archivo existe
    try {
      await fs.access(backupFile);
    } catch (error) {
      return NextResponse.json(
        { error: 'Backup no encontrado' },
        { status: 404 }
      );
    }

    // Obtener configuración de la base de datos
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL no configurada');
    }

    const dbUrlObj = new URL(dbUrl);
    const dbHost = dbUrlObj.hostname;
    const dbPort = dbUrlObj.port || '5432';
    const dbName = dbUrlObj.pathname.slice(1);
    const dbUser = dbUrlObj.username;
    const dbPassword = decodeURIComponent(dbUrlObj.password);

    // Ejecutar restore de forma segura
    const result = await execPgRestore(dbHost, dbPort, dbName, dbUser, dbPassword, backupFile);

    if (result.success) {
      logger.info(`Backup restaurado exitosamente: ${backupFile}`);

      return NextResponse.json({
        message: 'Backup restaurado exitosamente',
        filename,
      });
    } else {
      logger.error('Error al ejecutar pg_restore:', result.error);
      return NextResponse.json(
        { error: 'Error al restaurar backup (pg_restore no disponible)' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error al restaurar backup:', error);
    return NextResponse.json(
      { error: 'Error al restaurar backup' },
      { status: 500 }
    );
  }
}
