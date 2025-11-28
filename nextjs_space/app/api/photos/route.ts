import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadFile, downloadFile } from '@/lib/s3';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string; // 'unit' o 'building'
    const entityId = formData.get('entityId') as string;
    const isPortada = formData.get('isPortada') === 'true';

    if (!file || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Convertir el archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${entityType}s/${entityId}/${Date.now()}-${file.name}`;
    
    // Subir a S3
    const key = await uploadFile(buffer, fileName);
    const url = await downloadFile(key);

    // Actualizar la entidad en la base de datos
    if (entityType === 'unit') {
      const unit = await prisma.unit.findUnique({
        where: { id: entityId },
        select: { imagenes: true },
      });

      const imagenes = unit?.imagenes || [];
      const updatedImagenes = isPortada 
        ? [key, ...imagenes.filter(img => img !== key)]
        : [...imagenes, key];

      await prisma.unit.update({
        where: { id: entityId },
        data: { imagenes: updatedImagenes },
      });
    } else if (entityType === 'building') {
      const building = await prisma.building.findUnique({
        where: { id: entityId },
        select: { imagenes: true },
      });

      const imagenes = building?.imagenes || [];
      const updatedImagenes = isPortada 
        ? [key, ...imagenes.filter(img => img !== key)]
        : [...imagenes, key];

      await prisma.building.update({
        where: { id: entityId },
        data: { imagenes: updatedImagenes },
      });
    }

    return NextResponse.json({ 
      success: true, 
      key,
      url,
      message: 'Foto subida correctamente' 
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Error al subir la foto' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Faltan parámetros' },
        { status: 400 }
      );
    }

    let imagenes: string[] = [];

    if (entityType === 'unit') {
      const unit = await prisma.unit.findUnique({
        where: { id: entityId },
        select: { imagenes: true },
      });
      imagenes = unit?.imagenes || [];
    } else if (entityType === 'building') {
      const building = await prisma.building.findUnique({
        where: { id: entityId },
        select: { imagenes: true },
      });
      imagenes = building?.imagenes || [];
    }

    // Generar URLs firmadas para cada imagen
    const photos = await Promise.all(
      imagenes.map(async (key, index) => ({
        id: key,
        key,
        url: await downloadFile(key),
        isPortada: index === 0,
      }))
    );

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Error al obtener las fotos' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const photoKey = searchParams.get('photoKey');

    if (!entityType || !entityId || !photoKey) {
      return NextResponse.json(
        { error: 'Faltan parámetros' },
        { status: 400 }
      );
    }

    // Eliminar de S3
    // await deleteFile(photoKey); // Comentado para evitar errores si la foto no existe

    // Actualizar la entidad en la base de datos
    if (entityType === 'unit') {
      const unit = await prisma.unit.findUnique({
        where: { id: entityId },
        select: { imagenes: true },
      });

      const imagenes = unit?.imagenes || [];
      const updatedImagenes = imagenes.filter(img => img !== photoKey);

      await prisma.unit.update({
        where: { id: entityId },
        data: { imagenes: updatedImagenes },
      });
    } else if (entityType === 'building') {
      const building = await prisma.building.findUnique({
        where: { id: entityId },
        select: { imagenes: true },
      });

      const imagenes = building?.imagenes || [];
      const updatedImagenes = imagenes.filter(img => img !== photoKey);

      await prisma.building.update({
        where: { id: entityId },
        data: { imagenes: updatedImagenes },
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Foto eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la foto' },
      { status: 500 }
    );
  }
}
