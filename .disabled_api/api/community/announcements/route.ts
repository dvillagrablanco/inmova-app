import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, hasPermission, forbiddenResponse } from '@/lib/permissions';

// GET - Listar anuncios
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const active = searchParams.get('active') === 'true';
    
    const where: any = {
      companyId: user.companyId,
    };
    
    if (buildingId) where.buildingId = buildingId;
    if (active) {
      where.AND = [
        { activo: true },
        { OR: [{ fechaExpiracion: null }, { fechaExpiracion: { gte: new Date() } }] },
        { fechaPublicacion: { lte: new Date() } }
      ];
    }
    
    const announcements = await prisma.communityAnnouncement.findMany({
      where,
      orderBy: [
        { fechaPublicacion: 'desc' }
      ],
      include: {
        building: {
          select: { id: true, nombre: true }
        }
      }
    });
    
    return NextResponse.json(announcements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST - Crear nuevo anuncio
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    if (!hasPermission(user.role, 'manageAnnouncements' as any)) {
      // Fallback a permisos de admin si no tiene el específico
      if (user.role !== 'community_manager' && user.role !== 'administrador' && user.role !== 'super_admin') {
        return forbiddenResponse('No tienes permiso para crear anuncios');
      }
    }
    
    const data = await request.json();
    
    const announcement = await prisma.communityAnnouncement.create({
      data: {
        companyId: user.companyId,
        titulo: data.titulo,
        contenido: data.contenido,
        tipo: data.tipo || 'informacion',
        buildingId: data.buildingId,
        importante: data.importante || false,
        enviarNotificacion: data.enviarNotificacion || false,
        fechaPublicacion: data.fechaPublicacion ? new Date(data.fechaPublicacion) : new Date(),
        fechaExpiracion: data.fechaExpiracion ? new Date(data.fechaExpiracion) : null,
        adjuntos: data.adjuntos || [],
        publicadoPor: user.id,
      }
    });
    
    return NextResponse.json(announcement, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
