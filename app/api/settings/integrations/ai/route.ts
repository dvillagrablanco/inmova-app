/**
 * API Route: Configuración de IA (Claude)
 * 
 * POST /api/settings/integrations/ai
 * Guarda la configuración de Claude IA de la empresa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

const aiConfigSchema = z.object({
  companyId: z.string(),
  mode: z.enum(['own', 'shared']),
  apiKey: z.string().optional(),
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
    const validated = aiConfigSchema.parse(body);

    // Verificar que la empresa es la del usuario
    if (validated.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 3. Preparar datos para actualizar
    const updateData: any = {};

    if (validated.mode === 'own') {
      // Modo propio: guardar API key encriptada
      if (validated.apiKey && !validated.apiKey.startsWith('••')) {
        updateData.anthropicApiKey = encrypt(validated.apiKey);
      }
    } else {
      // Modo compartido: limpiar credenciales
      updateData.anthropicApiKey = null;
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
    console.error('[AI Config] Error:', error);

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
