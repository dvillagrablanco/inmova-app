/**
 * API v1 - API Keys Management
 * GET /api/v1/api-keys - Listar API keys de la empresa
 * POST /api/v1/api-keys - Crear nueva API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateApiKey, parseScopes } from '@/lib/api-v1/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createApiKeySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  scopes: z.array(z.string()).or(z.string()),
  rateLimit: z.number().int().positive().default(1000),
  expiresInDays: z.number().int().positive().optional(),
});

/**
 * GET /api/v1/api-keys
 * Lista las API keys de la empresa (sin mostrar el key completo)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        companyId: session.user.companyId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        description: true,
        scopes: true,
        status: true,
        rateLimit: true,
        lastUsedAt: true,
        lastUsedIp: true,
        expiresAt: true,
        createdAt: true,
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    logger.error('[API Keys GET Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/api-keys
 * Crear una nueva API key
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = createApiKeySchema.parse(body);

    // Parsear scopes
    const scopes = Array.isArray(validated.scopes)
      ? validated.scopes
      : parseScopes(validated.scopes);

    if (scopes.length === 0) {
      return NextResponse.json({ error: 'At least one valid scope is required' }, { status: 400 });
    }

    // Calcular expiración
    const expiresAt = validated.expiresInDays
      ? new Date(Date.now() + validated.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Generar API key
    const { key, keyHash, keyPrefix } = generateApiKey('live');

    // Guardar en BD
    const apiKey = await prisma.apiKey.create({
      data: {
        companyId: session.user.companyId,
        key: keyHash,
        keyPrefix,
        name: validated.name,
        description: validated.description,
        scopes,
        status: 'ACTIVE',
        rateLimit: validated.rateLimit,
        expiresAt,
        createdBy: session.user.id,
      },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        description: true,
        scopes: true,
        status: true,
        rateLimit: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: apiKey,
        key, // ⚠️ MOSTRAR UNA SOLA VEZ
        warning: 'Save this key securely. You will not be able to see it again.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('[API Keys POST Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
