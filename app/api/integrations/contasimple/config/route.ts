/**
 * API Route: Configuración de Contasimple por empresa
 * 
 * GET /api/integrations/contasimple/config - Obtener configuración actual
 * POST /api/integrations/contasimple/config - Guardar/actualizar credenciales
 * DELETE /api/integrations/contasimple/config - Eliminar integración
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ═══════════════════════════════════════════════════════════════
// ENCRIPTACIÓN DE CREDENCIALES
// ═══════════════════════════════════════════════════════════════

const ENCRYPTION_KEY = process.env.CONTASIMPLE_ENCRYPTION_KEY || 'default-key-change-in-production-32b';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ═══════════════════════════════════════════════════════════════
// GET - Obtener configuración actual
// ═══════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        id: true,
        contasimpleEnabled: true,
        contasimpleAuthKey: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // No devolver la clave completa por seguridad, solo si está configurada
    return NextResponse.json({
      enabled: company.contasimpleEnabled,
      configured: !!company.contasimpleAuthKey,
      authKeyMasked: company.contasimpleAuthKey
        ? `****${company.contasimpleAuthKey.slice(-8)}`
        : null,
    });
  } catch (error: any) {
    logger.error('[Contasimple Config] Error obteniendo configuración:', error);
    return NextResponse.json(
      { error: 'Error obteniendo configuración' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Guardar/actualizar credenciales
// ═══════════════════════════════════════════════════════════════

const configSchema = z.object({
  authKey: z.string().min(10, 'Auth key debe tener al menos 10 caracteres'),
  enabled: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar rol de admin
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden configurar integraciones' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = configSchema.parse(body);

    // Encriptar auth key
    const encryptedAuthKey = encrypt(validated.authKey);

    // Actualizar en BD
    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        contasimpleAuthKey: encryptedAuthKey,
        contasimpleEnabled: validated.enabled ?? true,
      },
    });

    logger.info(`[Contasimple Config] ✅ Credenciales guardadas para empresa ${session.user.companyId}`);

    return NextResponse.json({
      success: true,
      message: 'Credenciales de Contasimple guardadas correctamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[Contasimple Config] Error guardando configuración:', error);
    return NextResponse.json(
      { error: 'Error guardando configuración' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE - Eliminar integración
// ═══════════════════════════════════════════════════════════════

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden eliminar integraciones' },
        { status: 403 }
      );
    }

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        contasimpleAuthKey: null,
        contasimpleEnabled: false,
      },
    });

    logger.info(`[Contasimple Config] ✅ Integración eliminada para empresa ${session.user.companyId}`);

    return NextResponse.json({
      success: true,
      message: 'Integración de Contasimple eliminada',
    });
  } catch (error: any) {
    logger.error('[Contasimple Config] Error eliminando configuración:', error);
    return NextResponse.json(
      { error: 'Error eliminando configuración' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN HELPER PARA USO INTERNO
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene las credenciales desencriptadas de Contasimple para una empresa
 * (Para uso interno en otros servicios)
 */
export async function getContasimpleCredentials(companyId: string): Promise<{
  authKey: string;
  enabled: boolean;
} | null> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        contasimpleEnabled: true,
        contasimpleAuthKey: true,
      },
    });

    if (!company || !company.contasimpleAuthKey || !company.contasimpleEnabled) {
      return null;
    }

    const authKey = decrypt(company.contasimpleAuthKey);

    return {
      authKey,
      enabled: company.contasimpleEnabled,
    };
  } catch (error: any) {
    logger.error('[Contasimple Config] Error obteniendo credenciales:', error);
    return null;
  }
}
