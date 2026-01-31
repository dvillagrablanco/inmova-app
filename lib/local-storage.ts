/**
 * Servicio de almacenamiento local para documentos
 * Fallback cuando AWS S3 no está configurado
 * Los archivos se guardan en /uploads en el servidor
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Directorio base para almacenamiento local
const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || '/opt/inmova-app/uploads';

/**
 * Inicializar el directorio de uploads si no existe
 */
export function initializeUploadDir(): void {
  const directories = [
    UPLOAD_DIR,
    path.join(UPLOAD_DIR, 'documentos'),
    path.join(UPLOAD_DIR, 'dni'),
    path.join(UPLOAD_DIR, 'contratos'),
    path.join(UPLOAD_DIR, 'facturas'),
    path.join(UPLOAD_DIR, 'tenants'),
    path.join(UPLOAD_DIR, 'inquilinos'),
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Generar un nombre de archivo único
 */
export function generateUniqueFileName(
  originalName: string,
  folder: string = 'documentos'
): string {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(6).toString('hex');
  const extension = path.extname(originalName).toLowerCase() || '.pdf';
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);

  return `${folder}/${timestamp}-${randomStr}-${sanitizedName}${extension.includes('.') ? '' : extension}`;
}

/**
 * Guardar un archivo en almacenamiento local
 */
export async function saveFile(
  buffer: Buffer,
  fileName: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; path: string; size: number }> {
  // Asegurar que el directorio existe
  initializeUploadDir();

  const fullPath = path.join(UPLOAD_DIR, fileName);
  const directory = path.dirname(fullPath);

  // Crear directorio si no existe
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  // Guardar el archivo
  fs.writeFileSync(fullPath, buffer);

  // Guardar metadata como archivo JSON asociado (opcional)
  if (metadata) {
    const metadataPath = fullPath + '.meta.json';
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(
        {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          originalPath: fileName,
        },
        null,
        2
      )
    );
  }

  return {
    success: true,
    path: fileName,
    size: buffer.length,
  };
}

/**
 * Leer un archivo del almacenamiento local
 */
export async function readFile(fileName: string): Promise<Buffer | null> {
  const fullPath = path.join(UPLOAD_DIR, fileName);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readFileSync(fullPath);
}

/**
 * Obtener metadata de un archivo
 */
export function getFileMetadata(fileName: string): Record<string, string> | null {
  const metadataPath = path.join(UPLOAD_DIR, fileName + '.meta.json');

  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Eliminar un archivo del almacenamiento local
 */
export async function deleteFile(fileName: string): Promise<boolean> {
  const fullPath = path.join(UPLOAD_DIR, fileName);
  const metadataPath = fullPath + '.meta.json';

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Verificar si el almacenamiento local está disponible
 */
export function isLocalStorageAvailable(): boolean {
  try {
    initializeUploadDir();

    // Test de escritura
    const testFile = path.join(UPLOAD_DIR, '.storage-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    return true;
  } catch (error) {
    console.error('[LocalStorage] Error verificando disponibilidad:', error);
    return false;
  }
}

/**
 * Obtener la URL relativa para acceder al archivo
 */
export function getFileUrl(fileName: string): string {
  return `/api/documents/local/${encodeURIComponent(fileName)}`;
}

/**
 * Obtener estadísticas del almacenamiento
 */
export function getStorageStats(): {
  totalFiles: number;
  totalSize: number;
  byFolder: Record<string, number>;
} {
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    byFolder: {} as Record<string, number>,
  };

  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return stats;
    }

    const countFiles = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          const folderName = path.relative(UPLOAD_DIR, itemPath);
          stats.byFolder[folderName] = 0;
          countFiles(itemPath);
        } else if (!item.endsWith('.meta.json')) {
          stats.totalFiles++;
          stats.totalSize += stat.size;

          const folder = path.relative(UPLOAD_DIR, path.dirname(itemPath)) || 'root';
          stats.byFolder[folder] = (stats.byFolder[folder] || 0) + 1;
        }
      }
    };

    countFiles(UPLOAD_DIR);
  } catch (error) {
    console.error('[LocalStorage] Error obteniendo estadísticas:', error);
  }

  return stats;
}
