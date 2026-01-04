/**
 * API Route: Test de Almacenamiento AWS S3
 * 
 * POST /api/settings/integrations/storage/test
 * Prueba la conexión con AWS S3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { decrypt } from '@/lib/encryption';
import * as S3Service from '@/lib/aws-s3-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { companyId } = await request.json();

    // Verificar permisos
    if (companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 2. Obtener configuración
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        awsAccessKeyId: true,
        awsSecretAccessKey: true,
        awsBucket: true,
        awsRegion: true,
      },
    });

    // Obtener config (cliente o default de Inmova)
    const s3Config = S3Service.getConfig(company);

    if (!s3Config) {
      return NextResponse.json(
        { error: 'No hay configuración de almacenamiento disponible' },
        { status: 400 }
      );
    }

    // 3. Test de conexión
    const client = S3Service.getS3Client(s3Config);
    const command = new HeadBucketCommand({ Bucket: s3Config.bucket });
    
    await client.send(command);

    return NextResponse.json({
      success: true,
      bucket: s3Config.bucket,
      region: s3Config.region,
      mode: company?.awsAccessKeyId ? 'own' : 'shared',
    });
  } catch (error: any) {
    console.error('[Storage Test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la prueba de conexión' },
      { status: 500 }
    );
  }
}
