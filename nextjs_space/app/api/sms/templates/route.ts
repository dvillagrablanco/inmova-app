import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { crearPlantilla, instalarPlantillasPredefinidas } from '@/lib/sms-service';
import { SMSTipo } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sms/templates
 * Obtiene plantillas de SMS
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const activa = searchParams.get('activa');

    const where: any = {
      companyId: session.user.companyId
    };

    if (tipo) where.tipo = tipo as SMSTipo;
    if (activa !== null && activa !== undefined) {
      where.activa = activa === 'true';
    }

    const templates = await prisma.sMSTemplate.findMany({
      where,
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error al obtener plantillas:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sms/templates
 * Crea una nueva plantilla de SMS o instala plantillas predefinidas
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { accion, ...datos } = body;

    // Acción especial: instalar plantillas predefinidas
    if (accion === 'instalar_predefinidas') {
      const plantillas = await instalarPlantillasPredefinidas(
        session.user.companyId,
        session.user.id
      );
      
      return NextResponse.json(
        { mensaje: `${plantillas.length} plantillas instaladas`, plantillas },
        { status: 201 }
      );
    }

    // Crear plantilla personalizada
    const { nombre, descripcion, tipo, mensaje, activa, envioAutomatico, eventoTrigger, anticipacionDias, horaEnvio } = datos;

    if (!nombre || !tipo || !mensaje) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: nombre, tipo, mensaje' },
        { status: 400 }
      );
    }

    const template = await crearPlantilla(
      session.user.companyId,
      {
        nombre,
        descripcion,
        tipo: tipo as SMSTipo,
        mensaje,
        activa,
        envioAutomatico,
        eventoTrigger,
        anticipacionDias,
        horaEnvio
      },
      session.user.id
    );

    return NextResponse.json(template, { status: 201 });
    
  } catch (error: any) {
    console.error('Error al crear plantilla:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear plantilla' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sms/templates
 * Actualiza una plantilla
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...datos } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const template = await prisma.sMSTemplate.update({
      where: { id },
      data: {
        ...datos,
        ultimaModificacion: session.user.id
      }
    });

    return NextResponse.json(template);
    
  } catch (error: any) {
    console.error('Error al actualizar plantilla:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plantilla' },
      { status: 500 }
    );
  }
}
