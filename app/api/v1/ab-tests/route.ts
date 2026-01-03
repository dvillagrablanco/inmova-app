/**
 * API Routes: A/B Tests
 * 
 * GET /api/v1/ab-tests - List tests
 * POST /api/v1/ab-tests - Create test
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createABTest } from '@/lib/ab-testing-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const tests = await prisma.aBTest.findMany({
      include: {
        variants: true,
        _count: {
          select: {
            assignments: true,
            events: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tests });

  } catch (error: any) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createTestSchema.parse(body);

    const test = await createABTest({
      ...validated,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      createdBy: session.user.id,
    });

    return NextResponse.json({ test }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating A/B test:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
