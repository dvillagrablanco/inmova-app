import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;
    const data = await request.json();

    // Verificar que la plantilla pertenece a la empresa del usuario
    const plantilla = await prisma.sMSTemplate.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    });

    if (!plantilla) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    const updated = await prisma.sMSTemplate.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        mensaje: data.mensaje,
        activa: data.activa,
        envioAutomatico: data.envioAutomatico,
        eventoTrigger: data.eventoTrigger,
        anticipacionDias: data.anticipacionDias,
        horaEnvio: data.horaEnvio
      }
    });

    return NextResponse.json({ 
      success: true, 
      plantilla: updated,
      message: 'Plantilla actualizada exitosamente' 
    });
  } catch (error: any) {
    console.error('Error updating SMS template:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plantilla', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verificar que la plantilla pertenece a la empresa del usuario
    const plantilla = await prisma.sMSTemplate.findFirst({
      where: {
        id,
        companyId: session.user.companyId
      }
    });

    if (!plantilla) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    await prisma.sMSTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Plantilla eliminada exitosamente' 
    });
  } catch (error: any) {
    console.error('Error deleting SMS template:', error);
    return NextResponse.json(
      { error: 'Error al eliminar plantilla', details: error.message },
      { status: 500 }
    );
  }
}
