import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

// GET /api/company - Obtener configuración de la empresa
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar configuración existente
    let company = await db.company.findFirst();

    // Si no existe, crear una por defecto
    if (!company) {
      company = await db.company.create({
        data: {
          nombre: 'INMOVA',
          colorPrimario: '#000000',
          colorSecundario: '#FFFFFF',
        },
      });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// PUT /api/company - Actualizar configuración de la empresa
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    // Buscar configuración existente
    const existing = await db.company.findFirst();

    let company;
    if (existing) {
      // Actualizar existente
      company = await db.company.update({
        where: { id: existing.id },
        data: {
          nombre: data.nombre,
          cif: data.cif,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          logoUrl: data.logoUrl,
          codigoPostal: data.codigoPostal,
          ciudad: data.ciudad,
          pais: data.pais,
          iban: data.iban,
          colorPrimario: data.colorPrimario,
          colorSecundario: data.colorSecundario,
          pieDocumento: data.pieDocumento,
        },
      });
    } else {
      // Crear nueva
      company = await db.company.create({
        data: {
          nombre: data.nombre || 'INMOVA',
          cif: data.cif,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          logoUrl: data.logoUrl,
          codigoPostal: data.codigoPostal,
          ciudad: data.ciudad,
          pais: data.pais || 'España',
          iban: data.iban,
          colorPrimario: data.colorPrimario || '#000000',
          colorSecundario: data.colorSecundario || '#FFFFFF',
          pieDocumento: data.pieDocumento,
        },
      });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
