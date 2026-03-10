/**
 * API: Opciones para formulario de liquidaciones
 * Propietarios e inmuebles (mock o desde BD)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mock data cuando no hay modelo Prisma
const MOCK_PROPIETARIOS = [
  { id: 'prop-1', nombre: 'Juan García López', email: 'juan.garcia@email.com' },
  { id: 'prop-2', nombre: 'María Fernández Ruiz', email: 'maria.fernandez@email.com' },
  { id: 'prop-3', nombre: 'Carlos Martínez Sánchez', email: 'carlos.martinez@email.com' },
  { id: 'prop-4', nombre: 'Ana Rodríguez Pérez', email: 'ana.rodriguez@email.com' },
  { id: 'prop-5', nombre: 'Pedro Sánchez Gómez', email: 'pedro.sanchez@email.com' },
];

const MOCK_INMUEBLES = [
  { id: 'inv-1', nombre: 'Calle Mayor 10, 1A', direccion: 'Calle Mayor 10, 1A, 28013 Madrid', propietarioId: 'prop-1' },
  { id: 'inv-2', nombre: 'Calle Mayor 10, 2B', direccion: 'Calle Mayor 10, 2B, 28013 Madrid', propietarioId: 'prop-1' },
  { id: 'inv-3', nombre: 'Avenida España 45, 3º', direccion: 'Avenida España 45, 3º, 28003 Madrid', propietarioId: 'prop-2' },
  { id: 'inv-4', nombre: 'Plaza Central 7, Bajo', direccion: 'Plaza Central 7, Bajo, 08001 Barcelona', propietarioId: 'prop-3' },
  { id: 'inv-5', nombre: 'Calle Nueva 22, 4C', direccion: 'Calle Nueva 22, 4C, 41001 Sevilla', propietarioId: 'prop-4' },
  { id: 'inv-6', nombre: 'Paseo del Parque 15', direccion: 'Paseo del Parque 15, 29001 Málaga', propietarioId: 'prop-5' },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        propietarios: MOCK_PROPIETARIOS,
        inmuebles: MOCK_INMUEBLES,
      },
    });
  } catch (error: unknown) {
    console.error('[Liquidaciones Options GET]:', error);
    return NextResponse.json(
      { error: 'Error al obtener opciones' },
      { status: 500 }
    );
  }
}
