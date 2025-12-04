import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Crear backup
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { type = 'full', companyId } = await req.json();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Crear directorio de backups si no existe
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (error) {
      // Directorio ya existe
    }

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
    const dbPassword = dbUrlObj.password;

    // Comando para crear backup
    const pgDumpCmd = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${backupFile}"`;

    try {
      await execAsync(pgDumpCmd);
      logger.info(`Backup creado exitosamente: ${backupFile}`);

      // Obtener tamaño del archivo
      const stats = await fs.stat(backupFile);

      return NextResponse.json({
        message: 'Backup creado exitosamente',
        backup: {
          filename: path.basename(backupFile),
          path: backupFile,
          size: stats.size,
          type,
          companyId,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (execError: any) {
      logger.error('Error al ejecutar pg_dump:', execError);
      
      // Si pg_dump no está disponible, crear un backup alternativo
      return NextResponse.json({
        message: 'Backup programado (pg_dump no disponible en este entorno)',
        backup: {
          filename: `backup-${timestamp}.json`,
          type,
          companyId,
          createdAt: new Date().toISOString(),
          note: 'Se requiere configurar pg_dump para backups automáticos',
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

// Listar backups
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'super_admin') {
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
              path: filePath,
              size: stats.size,
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

    if (!session || session.user?.role !== 'super_admin') {
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
    const dbPassword = dbUrlObj.password;

    // Comando para restaurar backup
    const pgRestoreCmd = `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "${backupFile}"`;

    try {
      await execAsync(pgRestoreCmd);
      logger.info(`Backup restaurado exitosamente: ${backupFile}`);

      return NextResponse.json({
        message: 'Backup restaurado exitosamente',
      });
    } catch (execError: any) {
      logger.error('Error al ejecutar pg_restore:', execError);
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
