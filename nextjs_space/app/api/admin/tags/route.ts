import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener todos los tags únicos de todas las empresas
    const companies = await prisma.company.findMany({
      select: {
        tags: true,
      },
    });

    // Crear set de tags únicos
    const allTagsSet = new Set<string>();
    companies.forEach((company) => {
      company.tags.forEach((tag) => allTagsSet.add(tag));
    });

    const allTags = Array.from(allTagsSet).sort();

    // Contar uso de cada tag
    const tagCounts = new Map<string, number>();
    companies.forEach((company) => {
      company.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const tagsWithCount = allTags.map((tag) => ({
      tag,
      count: tagCounts.get(tag) || 0,
    }));

    return NextResponse.json({
      tags: allTags,
      tagsWithCount,
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Error al obtener tags' },
      { status: 500 }
    );
  }
}
