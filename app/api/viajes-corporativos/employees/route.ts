import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Datos de empleados desde BD o sistema HR
    const employees = [
      { id: 'emp1', nombre: 'Carlos Martínez', departamento: 'Ventas' },
      { id: 'emp2', nombre: 'Laura García', departamento: 'Marketing' },
      { id: 'emp3', nombre: 'Miguel Torres', departamento: 'Dirección' },
      { id: 'emp4', nombre: 'Ana Sánchez', departamento: 'Operaciones' },
      { id: 'emp5', nombre: 'Pedro López', departamento: 'IT' },
    ];

    return NextResponse.json({ data: employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
