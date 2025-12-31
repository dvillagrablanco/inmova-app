import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        onboardingSkipped: true,
      },
    });

    return NextResponse.json({
      completed: user?.onboardingCompleted || false,
      skipped: user?.onboardingSkipped || false,
      completedAt: user?.onboardingCompletedAt,
    });
  } catch (error: any) {
    console.error('[Onboarding Status Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado de onboarding' },
      { status: 500 }
    );
  }
}
