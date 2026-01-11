import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración por defecto del Community Manager
const DEFAULT_CONFIG = {
  enabled: true,
  autoGenerate: true,
  postsPerDay: 2,
  preferredTimes: ['10:00', '18:00'],
  tone: 'profesional',
  language: 'es',
  hashtags: {
    auto: true,
    maxCount: 10,
    custom: ['PropTech', 'InmobiliariaDigital', 'GestiónInmobiliaria', 'Inmova'],
  },
  topics: ['PropTech', 'Gestión Inmobiliaria', 'Tendencias del Mercado', 'Tips para Propietarios', 'Novedades Inmova'],
  platforms: {
    instagram: { enabled: true, stories: true, reels: false },
    facebook: { enabled: true, stories: true },
    linkedin: { enabled: true, articles: true },
    twitter: { enabled: false, threads: false },
  },
  blog: {
    enabled: true,
    postsPerWeek: 2,
    categories: ['Guías', 'Tips', 'Tendencias', 'Casos de Éxito', 'Novedades'],
    autoSEO: true,
  },
};

// En producción, esto debería guardarse en base de datos
let currentConfig = { ...DEFAULT_CONFIG };

// GET - Obtener configuración actual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      config: currentConfig,
      status: {
        agentRunning: currentConfig.enabled,
        lastActivity: new Date().toISOString(),
        scheduledPosts: 5, // En producción, obtener de BD
        publishedToday: 2,
        queueSize: 12,
      },
    });
  } catch (error: any) {
    console.error('[CM Config GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo configuración' },
      { status: 500 }
    );
  }
}

// POST - Actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar y actualizar configuración
    currentConfig = {
      ...currentConfig,
      ...body,
      // Asegurar que ciertas propiedades mantienen su estructura
      hashtags: { ...currentConfig.hashtags, ...(body.hashtags || {}) },
      platforms: { ...currentConfig.platforms, ...(body.platforms || {}) },
      blog: { ...currentConfig.blog, ...(body.blog || {}) },
    };

    // En producción, guardar en base de datos
    // await prisma.communityManagerConfig.upsert({ ... });

    return NextResponse.json({
      success: true,
      config: currentConfig,
      message: 'Configuración actualizada correctamente',
    });
  } catch (error: any) {
    console.error('[CM Config POST Error]:', error);
    return NextResponse.json(
      { error: 'Error actualizando configuración' },
      { status: 500 }
    );
  }
}

// PUT - Reiniciar a valores por defecto
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    currentConfig = { ...DEFAULT_CONFIG };

    return NextResponse.json({
      success: true,
      config: currentConfig,
      message: 'Configuración reiniciada a valores por defecto',
    });
  } catch (error: any) {
    console.error('[CM Config PUT Error]:', error);
    return NextResponse.json(
      { error: 'Error reiniciando configuración' },
      { status: 500 }
    );
  }
}
