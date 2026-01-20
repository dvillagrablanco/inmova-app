import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener items del marketplace
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Por ahora devolvemos array vacío - sin datos ficticios
    // Los usuarios pueden crear items reales
    return NextResponse.json([]);
  } catch (error: any) {
    logger.error('[Circular Economy Marketplace GET]:', error);
    return NextResponse.json(
      { error: 'Error al obtener items del marketplace' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, condition, price, isFree } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    // Crear item en la base de datos (cuando el modelo exista)
    // Por ahora simulamos la creación exitosa
    const newItem = {
      id: `item_${Date.now()}`,
      title,
      description: description || '',
      category: category || 'otros',
      condition: condition || 'buen_estado',
      price: isFree ? 0 : (price || 0),
      isFree: isFree || false,
      images: [],
      location: 'Tu edificio',
      createdAt: new Date().toISOString(),
      user: {
        name: session.user?.name || 'Usuario',
        building: 'Tu edificio',
      },
    };

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    logger.error('[Circular Economy Marketplace POST]:', error);
    return NextResponse.json(
      { error: 'Error al crear item' },
      { status: 500 }
    );
  }
}
