import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Implementar cálculo real desde base de datos
    // Por ahora devolvemos datos de ejemplo
    const plans = [
      {
        id: '1',
        buildingId: 'bld_1',
        buildingName: 'Edificio Central - C/ Mayor 45',
        targetYear: 2030,
        currentEmissions: 125.5,
        targetReduction: 55,
        status: 'on_track',
        progress: 42,
        actions: [
          {
            id: 'a1',
            name: 'Instalación de paneles solares',
            impact: 15000,
            cost: 45000,
            status: 'in_progress',
            deadline: '2025-06-30',
          },
          {
            id: 'a2',
            name: 'Sustitución de calderas por bomba de calor',
            impact: 22000,
            cost: 35000,
            status: 'pending',
            deadline: '2025-09-30',
          },
          {
            id: 'a3',
            name: 'Mejora del aislamiento térmico',
            impact: 12000,
            cost: 28000,
            status: 'completed',
            deadline: '2024-12-31',
          },
        ],
      },
      {
        id: '2',
        buildingId: 'bld_2',
        buildingName: 'Residencial Las Flores',
        targetYear: 2035,
        currentEmissions: 89.3,
        targetReduction: 40,
        status: 'at_risk',
        progress: 28,
        actions: [
          {
            id: 'a4',
            name: 'LED en zonas comunes',
            impact: 3500,
            cost: 8000,
            status: 'completed',
            deadline: '2024-11-30',
          },
          {
            id: 'a5',
            name: 'Sistema de gestión energética',
            impact: 8000,
            cost: 15000,
            status: 'pending',
            deadline: '2026-03-31',
          },
        ],
      },
    ];

    return NextResponse.json(plans);
  } catch (error) {
    logger.error('Error fetching decarbonization plans:', error);
    return NextResponse.json(
      { error: 'Error al obtener planes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // TODO: Implementar creación real en base de datos
    
    logger.info('Creating new decarbonization plan:', body);

    return NextResponse.json({ 
      success: true, 
      message: 'Plan de descarbonización creado' 
    });
  } catch (error) {
    logger.error('Error creating decarbonization plan:', error);
    return NextResponse.json(
      { error: 'Error al crear plan' },
      { status: 500 }
    );
  }
}
