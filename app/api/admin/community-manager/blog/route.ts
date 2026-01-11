import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Artículos de ejemplo (en producción, obtener de BD)
let blogPosts = [
  { 
    id: '1', 
    title: 'Guía completa: Digitaliza tu inmobiliaria en 2026', 
    slug: 'guia-digitaliza-inmobiliaria-2026',
    excerpt: 'Descubre los pasos esenciales para transformar tu negocio inmobiliario con las últimas herramientas tecnológicas.', 
    content: '', // Contenido completo del artículo
    status: 'published', 
    publishDate: new Date('2026-01-05').toISOString(), 
    category: 'Guías', 
    tags: ['digitalización', 'proptech', 'guía'],
    author: 'Inmova',
    views: 1250,
    readTime: 8,
    seo: {
      metaTitle: 'Guía Completa: Digitaliza tu Inmobiliaria en 2026 | Inmova',
      metaDescription: 'Aprende cómo digitalizar tu inmobiliaria paso a paso con nuestra guía completa. PropTech, automatización y más.',
      keywords: ['digitalización inmobiliaria', 'proptech', 'gestión inmobiliaria digital'],
    },
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-05').toISOString(),
  },
  { 
    id: '2', 
    title: '10 errores comunes en la gestión de alquileres (y cómo evitarlos)', 
    slug: '10-errores-gestion-alquileres',
    excerpt: 'Evita estos errores que cometen la mayoría de gestores de propiedades y mejora tu rentabilidad.', 
    content: '',
    status: 'scheduled', 
    publishDate: new Date('2026-01-15').toISOString(), 
    category: 'Tips', 
    tags: ['alquiler', 'gestión', 'errores'],
    author: 'Inmova',
    views: 0,
    readTime: 6,
    seo: {
      metaTitle: '10 Errores en Gestión de Alquileres y Cómo Evitarlos | Inmova',
      metaDescription: 'Descubre los 10 errores más comunes en la gestión de alquileres y aprende cómo evitarlos para mejorar tu rentabilidad.',
      keywords: ['errores gestión alquileres', 'tips propietarios', 'gestión de propiedades'],
    },
    createdAt: new Date('2026-01-10').toISOString(),
    updatedAt: new Date('2026-01-10').toISOString(),
  },
  { 
    id: '3', 
    title: 'El futuro de la firma digital en el sector inmobiliario', 
    slug: 'futuro-firma-digital-inmobiliario',
    excerpt: 'La firma electrónica está revolucionando cómo se cierran las operaciones inmobiliarias. Descubre las tendencias.', 
    content: '',
    status: 'draft', 
    publishDate: null, 
    category: 'Tendencias', 
    tags: ['firma digital', 'tecnología', 'contratos'],
    author: 'Inmova',
    views: 0,
    readTime: 5,
    seo: null,
    createdAt: new Date('2026-01-08').toISOString(),
    updatedAt: new Date('2026-01-08').toISOString(),
  },
];

// GET - Listar artículos del blog
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let filteredPosts = [...blogPosts];

    if (status && status !== 'all') {
      filteredPosts = filteredPosts.filter(p => p.status === status);
    }

    if (category) {
      filteredPosts = filteredPosts.filter(p => p.category === category);
    }

    // Ordenar por fecha de actualización (más recientes primero)
    filteredPosts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({
      success: true,
      posts: filteredPosts,
      total: filteredPosts.length,
      stats: {
        published: blogPosts.filter(p => p.status === 'published').length,
        scheduled: blogPosts.filter(p => p.status === 'scheduled').length,
        draft: blogPosts.filter(p => p.status === 'draft').length,
        totalViews: blogPosts.reduce((sum, p) => sum + p.views, 0),
      },
      categories: ['Guías', 'Tips', 'Tendencias', 'Casos de Éxito', 'Novedades'],
    });
  } catch (error: any) {
    console.error('[Blog GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo artículos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo artículo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      excerpt, 
      content = '', 
      status = 'draft', 
      publishDate = null, 
      category = 'Novedades', 
      tags = [],
      seo = null,
    } = body;

    // Validaciones
    if (!title) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 });
    }

    // Generar slug
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Calcular tiempo de lectura (aproximado: 200 palabras por minuto)
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200) || 1;

    // Crear artículo
    const newPost = {
      id: `blog-${Date.now()}`,
      title,
      slug,
      excerpt,
      content,
      status,
      publishDate: publishDate ? new Date(publishDate).toISOString() : null,
      category,
      tags,
      author: session.user.name || 'Inmova',
      views: 0,
      readTime,
      seo: seo || {
        metaTitle: `${title} | Inmova`,
        metaDescription: excerpt,
        keywords: tags,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    blogPosts.push(newPost);

    return NextResponse.json({
      success: true,
      post: newPost,
      message: status === 'published' ? 'Artículo publicado' : status === 'scheduled' ? 'Artículo programado' : 'Borrador guardado',
    });
  } catch (error: any) {
    console.error('[Blog POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando artículo' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar artículo
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID del artículo requerido' }, { status: 400 });
    }

    const postIndex = blogPosts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    // Actualizar
    blogPosts[postIndex] = {
      ...blogPosts[postIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      post: blogPosts[postIndex],
      message: 'Artículo actualizado correctamente',
    });
  } catch (error: any) {
    console.error('[Blog PUT Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando artículo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar artículo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'ID del artículo requerido' }, { status: 400 });
    }

    const postIndex = blogPosts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    const deletedPost = blogPosts.splice(postIndex, 1)[0];

    return NextResponse.json({
      success: true,
      deleted: deletedPost,
      message: 'Artículo eliminado correctamente',
    });
  } catch (error: any) {
    console.error('[Blog DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Error eliminando artículo' },
      { status: 500 }
    );
  }
}
