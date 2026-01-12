import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listings = await prisma.sTRListing.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        unit: {
          include: {
            building: true
          }
        },
        bookings: {
          where: {
            estado: {
              in: ['CONFIRMADA', 'CHECK_IN']
            }
          },
          orderBy: {
            checkInDate: 'desc'
          },
          take: 5
        },
        channels: true,
        reviews: {
          orderBy: {
            fecha: 'desc'
          },
          take: 3
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(listings);
  } catch (error) {
    logger.error('Error fetching STR listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
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
    
    const listing = await prisma.sTRListing.create({
      data: {
        ...data,
        companyId: session.user.companyId
      },
      include: {
        unit: {
          include: {
            building: true
          }
        }
      }
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    logger.error('Error creating STR listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
