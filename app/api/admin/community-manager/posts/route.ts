import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Posts de ejemplo (en producción, obtener de BD)
let scheduledPosts = [
  { 
    id: '1', 
    content: '🏠 ¿Sabías que el 73% de los compradores busca propiedades online antes de visitar? Con Inmova, digitaliza tu gestión inmobiliaria y llega a más clientes. #PropTech #InmobiliariaDigital', 
    platforms: ['instagram', 'facebook', 'linkedin'], 
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), 
    status: 'scheduled',
    type: 'post',
    createdAt: new Date().toISOString(),
    mediaUrl: null,
  },
  { 
    id: '2', 
    content: '📊 Nuevo informe: El mercado inmobiliario español en 2026. Descarga gratis nuestro análisis completo. Link en bio 👆', 
    platforms: ['instagram'], 
    scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), 
    status: 'scheduled',
    type: 'story',
    createdAt: new Date().toISOString(),
    mediaUrl: null,
  },
];

// GET - Listar posts programados
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // scheduled, published, draft, all
    const platform = searchParams.get('platform');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let filteredPosts = [...scheduledPosts];

    // Filtrar por status
    if (status && status !== 'all') {
      filteredPosts = filteredPosts.filter(p => p.status === status);
    }

    // Filtrar por plataforma
    if (platform) {
      filteredPosts = filteredPosts.filter(p => p.platforms.includes(platform));
    }

    // Filtrar por rango de fechas
    if (startDate) {
      filteredPosts = filteredPosts.filter(p => new Date(p.scheduledDate) >= new Date(startDate));
    }
    if (endDate) {
      filteredPosts = filteredPosts.filter(p => new Date(p.scheduledDate) <= new Date(endDate));
    }

    // Ordenar por fecha
    filteredPosts.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    return NextResponse.json({
      success: true,
      posts: filteredPosts,
      total: filteredPosts.length,
      stats: {
        scheduled: scheduledPosts.filter(p => p.status === 'scheduled').length,
        published: scheduledPosts.filter(p => p.status === 'published').length,
        draft: scheduledPosts.filter(p => p.status === 'draft').length,
      },
    });
  } catch (error: any) {
    console.error('[CM Posts GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo posts' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo post programado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { content, platforms, scheduledDate, type = 'post', mediaUrl = null, status = 'scheduled' } = body;

    // Validaciones
    if (!content) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }
    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos una plataforma' }, { status: 400 });
    }
    if (!scheduledDate) {
      return NextResponse.json({ error: 'La fecha de publicación es requerida' }, { status: 400 });
    }

    // Crear post
    const newPost = {
      id: `post-${Date.now()}`,
      content,
      platforms,
      scheduledDate: new Date(scheduledDate).toISOString(),
      type,
      status,
      mediaUrl,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    scheduledPosts.push(newPost);

    return NextResponse.json({
      success: true,
      post: newPost,
      message: 'Post programado correctamente',
    });
  } catch (error: any) {
    console.error('[CM Posts POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando post' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'ID de post requerido' }, { status: 400 });
    }

    const postIndex = scheduledPosts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    const deletedPost = scheduledPosts.splice(postIndex, 1)[0];

    return NextResponse.json({
      success: true,
      deleted: deletedPost,
      message: 'Post eliminado correctamente',
    });
  } catch (error: any) {
    console.error('[CM Posts DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Error eliminando post' },
      { status: 500 }
    );
  }
}
