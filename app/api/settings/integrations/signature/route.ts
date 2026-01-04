/**
 * API Route: Configuración de Firma Digital
 * 
 * POST /api/settings/integrations/signature
 * Guarda la configuración de Signaturit/DocuSign de la empresa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

const signatureConfigSchema = z.object({
  companyId: z.string(),
  mode: z.enum(['own', 'shared']),
  provider: z.enum(['signaturit', 'docusign', '']).optional(),
  apiKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  environment: z.enum(['sandbox', 'production']).optional(),
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
    const validated = signatureConfigSchema.parse(body);

    // Verificar que la empresa es la del usuario
    if (validated.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 3. Preparar datos para actualizar
    const updateData: any = {};

    if (validated.mode === 'own') {
      // Modo propio: guardar credenciales encriptadas
      updateData.signatureProvider = validated.provider || null;
      updateData.signatureEnvironment = validated.environment || 'sandbox';

      if (validated.apiKey && !validated.apiKey.startsWith('••')) {
        updateData.signatureApiKey = encrypt(validated.apiKey);
      }

      if (validated.webhookSecret && !validated.webhookSecret.startsWith('••')) {
        updateData.signatureWebhookSecret = encrypt(validated.webhookSecret);
      }
    } else {
      // Modo compartido: limpiar credenciales
      updateData.signatureProvider = null;
      updateData.signatureApiKey = null;
      updateData.signatureWebhookSecret = null;
      updateData.signatureEnvironment = null;
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
    console.error('[Signature Config] Error:', error);

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
