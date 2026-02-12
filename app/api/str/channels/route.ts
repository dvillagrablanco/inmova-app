import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    const where: any = {
      companyId: session.user.companyId
    };

    if (listingId) {
      where.listingId = listingId;
    }

    const channels = await prisma.sTRChannelSync.findMany({
      where,
      include: {
        listing: {
          include: {
            unit: {
              include: {
                building: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(channels);
  } catch (error) {
    logger.error('Error fetching STR channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const channel = await prisma.sTRChannelSync.create({
      data: {
        ...data,
        companyId: session.user.companyId
      },
      include: {
        listing: {
          include: {
            unit: {
              include: {
                building: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    logger.error('Error creating STR channel:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}
