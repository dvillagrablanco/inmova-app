import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingSkipped: true,
        onboardingCompletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Skip Onboarding Error]:', error);
    return NextResponse.json(
      { error: 'Error omitiendo onboarding' },
      { status: 500 }
    );
  }
}
