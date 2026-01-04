/**
 * API Route: Configuración de Almacenamiento (AWS S3)
 * 
 * POST /api/settings/integrations/storage
 * Guarda la configuración de AWS S3 de la empresa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

const storageConfigSchema = z.object({
  companyId: z.string(),
  mode: z.enum(['own', 'shared']),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  bucket: z.string().optional(),
  region: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins
    if (session.user.role !== 'super_admin' && session.user.role !== 'administrador') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // 2. Validar datos
    const body = await request.json();
    const validated = storageConfigSchema.parse(body);

    // Verificar que la empresa es la del usuario
    if (validated.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 3. Preparar datos para actualizar
    const updateData: any = {};

    if (validated.mode === 'own') {
      // Modo propio: guardar credenciales encriptadas
      updateData.awsBucket = validated.bucket;
      updateData.awsRegion = validated.region || 'eu-west-1';

      if (validated.accessKeyId && !validated.accessKeyId.startsWith('••')) {
        updateData.awsAccessKeyId = encrypt(validated.accessKeyId);
      }

      if (validated.secretAccessKey && !validated.secretAccessKey.startsWith('••')) {
        updateData.awsSecretAccessKey = encrypt(validated.secretAccessKey);
      }
    } else {
      // Modo compartido: limpiar credenciales
      updateData.awsAccessKeyId = null;
      updateData.awsSecretAccessKey = null;
      updateData.awsBucket = null;
      updateData.awsRegion = null;
    }

    // 4. Actualizar en BD
    await prisma.company.update({
      where: { id: validated.companyId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada correctamente',
    });
  } catch (error: any) {
    console.error('[Storage Config] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error guardando configuración' },
      { status: 500 }
    );
  }
}
