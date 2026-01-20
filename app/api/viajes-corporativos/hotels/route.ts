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

    // Catálogo de hoteles corporativos
    const hotels = [
      { id: 'h1', nombre: 'Hotel Arts Barcelona', ciudad: 'Barcelona', precioBase: 180 },
      { id: 'h2', nombre: 'NH Collection Madrid', ciudad: 'Madrid', precioBase: 145 },
      { id: 'h3', nombre: 'The Westin Valencia', ciudad: 'Valencia', precioBase: 250 },
      { id: 'h4', nombre: 'Hotel Alfonso XIII', ciudad: 'Sevilla', precioBase: 220 },
      { id: 'h5', nombre: 'Gran Hotel Domine', ciudad: 'Bilbao', precioBase: 160 },
    ];

    return NextResponse.json({ data: hotels });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
