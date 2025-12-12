import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Por ahora devolvemos datos de ejemplo
    // En una implementación real, esto vendría de la base de datos
    const partners = [
      {
        id: '1',
        nombre: 'Grupo Inmobiliario Norte',
        tipo: 'inmobiliaria',
        estado: 'activo',
        email: 'contacto@gruponorte.es',
        telefono: '+34 912 345 678',
        sitioWeb: 'https://www.gruponorte.es',
        descripcion: 'Líder en gestión de propiedades residenciales en la zona norte',
        comision: 15,
        clientesReferidos: 23,
        ingresoGenerado: 45000,
        fechaInicio: '2024-01-15',
        contactoPrincipal: 'María González',
      },
      {
        id: '2',
        nombre: 'Constructora Moderna SL',
        tipo: 'constructora',
        estado: 'activo',
        email: 'info@constructoramoderna.es',
        telefono: '+34 913 456 789',
        sitioWeb: 'https://www.constructoramoderna.es',
        descripcion: 'Desarrollo y construcción de proyectos residenciales premium',
        comision: 20,
        clientesReferidos: 12,
        ingresoGenerado: 68000,
        fechaInicio: '2024-02-20',
        contactoPrincipal: 'Carlos Pérez',
      },
      {
        id: '3',
        nombre: 'PropTech Solutions',
        tipo: 'tecnologia',
        estado: 'activo',
        email: 'contact@proptech.com',
        telefono: '+34 914 567 890',
        sitioWeb: 'https://www.proptech.com',
        descripcion: 'Proveedor de soluciones tecnológicas para el sector inmobiliario',
        comision: 10,
        clientesReferidos: 8,
        ingresoGenerado: 32000,
        fechaInicio: '2024-03-10',
        contactoPrincipal: 'Ana Martínez',
      },
    ];

    return NextResponse.json(partners);
  } catch (error) {
    logger.error('Error al obtener partners:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    // Validación básica
    if (!data.nombre || !data.email || !data.tipo) {
      return NextResponse.json(
        { error: 'Nombre, email y tipo son campos requeridos' },
        { status: 400 }
      );
    }

    // Aquí deberías guardar en la base de datos
    const newPartner = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      clientesReferidos: 0,
      ingresoGenerado: 0,
      fechaInicio: new Date().toISOString(),
    };

    logger.info('Partner creado:', { partnerId: newPartner.id, nombre: newPartner.nombre });

    return NextResponse.json(newPartner, { status: 201 });
  } catch (error) {
    logger.error('Error al crear partner:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
