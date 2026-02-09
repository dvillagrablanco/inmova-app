/**
 * API Routes: A/B Tests
 * 
 * GET /api/v1/ab-tests - List tests
 * POST /api/v1/ab-tests - Create test
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createTestSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  targetPercentage: z.number().min(1).max(100),
  variants: z.array(z.object({
    name: z.enum(['A', 'B', 'C', 'D']),
    description: z.string(),
    config: z.record(z.any()),
    trafficAllocation: z.number().min(0).max(100),
  })).min(2).max(4),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins pueden ver tests
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'A/B Testing no disponible' },
      { status: 501 }
    );

  } catch (error: any) {
    logger.error('Error fetching A/B tests:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createTestSchema.parse(body);

    return NextResponse.json(
      { error: 'A/B Testing no disponible' },
      { status: 501 }
    );

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error creating A/B test:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
