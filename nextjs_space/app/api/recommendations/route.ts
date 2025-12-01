import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateRecommendations } from '@/lib/prediction-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const recommendations = await prisma.recommendation.findMany({
      where: {
        companyId,
        aplicada: false,
      },
      orderBy: [
        { prioridad: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
    });

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar recomendaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const recommendations = await generateRecommendations(companyId);

    return NextResponse.json({ recommendations }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar recomendaciones' },
      { status: 500 }
    );
  }
}
