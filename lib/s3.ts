import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';
import { Readable } from 'stream';

const s3Client = createS3Client();

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const key = `${folderPrefix}${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
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
