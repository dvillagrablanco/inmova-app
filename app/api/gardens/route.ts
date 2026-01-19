import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory storage for demo
let urbanGardens: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const gardens = urbanGardens.filter((g) => g.companyId === companyId);

    return NextResponse.json(gardens);
  } catch (error) {
    console.error('[Gardens API] Error fetching gardens:', error);
    return NextResponse.json({ error: 'Error al obtener huertos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    if (!body.nombre || !body.ubicacion || !body.superficie || !body.numeroParcelas) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const newGarden = {
      id: `garden_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId,
      nombre: body.nombre,
      ubicacion: body.ubicacion,
      superficie: parseFloat(body.superficie),
      numeroParcelas: parseInt(body.numeroParcelas),
      parcelasDisponibles: parseInt(body.numeroParcelas), // Initially all available
      precioParcela: parseFloat(body.precioParcela) || 0,
      tipoRiego: body.tipoRiego || 'MANUAL',
      estado: body.estado || 'ACTIVO',
      buildingId: body.buildingId || null,
      buildingName: null,
      amenities: body.amenities || [],
      descripcion: body.descripcion || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    urbanGardens.push(newGarden);

    return NextResponse.json(newGarden, { status: 201 });
  } catch (error) {
    console.error('[Gardens API] Error creating garden:', error);
    return NextResponse.json({ error: 'Error al crear huerto' }, { status: 500 });
  }
}
