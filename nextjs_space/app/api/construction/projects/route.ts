import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.constructionProject.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        building: true,
        workOrders: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        inspections: {
          orderBy: {
            fecha: 'desc'
          }
        },
        suppliers: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    logger.error('Error fetching construction projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const project = await prisma.constructionProject.create({
      data: {
        ...data,
        companyId: session.user.companyId
      },
      include: {
        building: true
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    logger.error('Error creating construction project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
