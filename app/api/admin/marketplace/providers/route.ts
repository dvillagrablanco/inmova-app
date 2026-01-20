import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const providerSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  categoria: z.string().min(1),
  descripcion: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Por ahora, retornar array vacío
    // TODO: Cuando se cree el modelo Provider específico para marketplace, conectar aquí
    return NextResponse.json({
      success: true,
      providers: [],
      message: 'No hay proveedores registrados aún. Use el botón "Nuevo Proveedor" para añadir.',
    });
  } catch (error) {
    logger.error('[API Error] Marketplace providers:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = providerSchema.parse(body);

    // TODO: Crear modelo MarketplaceProvider en Prisma
    // Por ahora, simular creación exitosa
    const newProvider = {
      id: `prov_${Date.now()}`,
      ...validated,
      estado: 'pending',
      rating: 0,
      serviciosCount: 0,
      transaccionesTotal: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: newProvider,
      message: 'Proveedor creado correctamente. Pendiente de aprobación.',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[API Error] Create marketplace provider:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
