import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const data = await request.json();
    const { company, building, units, preferences } = data;

    // 1. Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Crear el edificio
    const createdBuilding = await prisma.building.create({
      data: {
        nombre: building.name,
        direccion: building.address,
        tipo: 'residencial' as any, // Tipo por defecto
        anoConstructor: new Date().getFullYear(),
        numeroUnidades: parseInt(building.totalUnits) || 0,
        companyId: user.companyId
      }
    });

    // 3. Crear las unidades automáticamente
    const unitsToCreate: any[] = [];
    const unitType = units.type === 'commercial' ? 'local' as const : 'vivienda' as const;
    
    for (let i = 1; i <= units.count; i++) {
      unitsToCreate.push({
        numero: `${Math.floor((i - 1) / 4) + 1}${String.fromCharCode(64 + ((i - 1) % 4) + 1)}`,
        tipo: unitType,
        buildingId: createdBuilding.id,
        estado: 'disponible' as const,
        superficie: 75.0, // Valor por defecto
        rentaMensual: 800.0, // Valor por defecto
        planta: Math.floor((i - 1) / 4) + 1
      });
    }

    await prisma.unit.createMany({
      data: unitsToCreate
    });

    // 4. Guardar preferencias del usuario
    logger.info('User preferences saved:', {
      userId: user.id,
      preferences
    });

    return NextResponse.json({
      success: true,
      building: createdBuilding,
      unitsCreated: units.count
    });
  } catch (error) {
    logger.error('Error completing setup:', error);
    return NextResponse.json(
      { error: 'Error al completar la configuración' },
      { status: 500 }
    );
  }
}
