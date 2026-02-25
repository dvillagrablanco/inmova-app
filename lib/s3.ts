import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';
import { Readable } from 'stream';
import { gzipSync } from 'zlib';

const s3Client = createS3Client();

// Compress compressible file types (PDFs, text, etc.) before S3 upload
function compressBuffer(buffer: Buffer, fileName: string): { body: Buffer; encoding?: string } {
  if (buffer.length < 10 * 1024) return { body: buffer }; // Skip small files

  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const compressible = ['pdf', 'csv', 'txt', 'json', 'xml', 'docx', 'xlsx', 'doc', 'xls'];
  const skip = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'zip', 'gz', 'rar', '7z', 'mp4', 'mp3'];

  if (skip.includes(ext)) return { body: buffer };

  if (compressible.includes(ext)) {
    try {
      const compressed = gzipSync(buffer, { level: 6 });
      if (compressed.length < buffer.length * 0.95) {
        return { body: compressed, encoding: 'gzip' };
      }
    } catch {
      // Fallback
    }
  }
  return { body: buffer };
}

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const key = `${folderPrefix}${fileName}`;

  const { body, encoding } = compressBuffer(buffer, fileName);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ...(encoding ? { ContentEncoding: encoding } : {}),
    })
  );

  return key;
}

// Obtener URL firmada para descargar
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const { bucketName } = getBucketConfig();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// Descargar archivo como Buffer
export async function downloadFile(key: string): Promise<Buffer> {
  const { bucketName } = getBucketConfig();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('No se pudo obtener el archivo de S3');
  }

  // Convertir el stream a buffer
  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function deleteFile(key: string): Promise<void> {
  const { bucketName } = getBucketConfig();
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}