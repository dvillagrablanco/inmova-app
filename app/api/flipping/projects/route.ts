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

    const projects = await prisma.flippingProject.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        unit: {
          include: {
            building: true
          }
        },
        building: true,
        renovations: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        expenses: {
          orderBy: {
            fecha: 'desc'
          }
        },
        milestones: {
          orderBy: {
            fechaPrevista: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    logger.error('Error fetching flipping projects:', error);
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
    
    // Calcular inversión total
    const inversionTotal = data.precioCompra + data.gastosCompra + data.presupuestoRenovacion;
    
    // Si ya se vendió, calcular beneficio y ROI
    let updateData: any = {
      ...data,
      companyId: session.user.companyId,
      inversionTotal
    };

    if (data.precioVentaReal && data.gastosVenta) {
      const beneficioNeto = data.precioVentaReal - inversionTotal - data.gastosVenta;
      const roiPorcentaje = (beneficioNeto / inversionTotal) * 100;
      updateData.beneficioNeto = beneficioNeto;
      updateData.roiPorcentaje = roiPorcentaje;
    }

    const project = await prisma.flippingProject.create({
      data: updateData,
      include: {
        unit: {
          include: {
            building: true
          }
        },
        building: true
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    logger.error('Error creating flipping project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
