import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateCSSVariables } from '@/lib/branding-service';
import { BrandingConfig } from '@prisma/client';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/branding/preview
 * Genera una preview de los cambios de branding sin guardarlos
 * Solo administradores
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo administradores
    if (session.user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Crear un objeto temporal de configuración para la preview
    const previewConfig: BrandingConfig = {
      id: 'preview',
      companyId: session.user.companyId!,
      appName: body.appName || 'INMOVA',
      appDescription: body.appDescription || null,
      tagline: body.tagline || null,
      logoUrl: body.logoUrl || null,
      logoSmallUrl: body.logoSmallUrl || null,
      faviconUrl: body.faviconUrl || null,
      ogImageUrl: body.ogImageUrl || null,
      primaryColor: body.primaryColor || '#000000',
      secondaryColor: body.secondaryColor || '#FFFFFF',
      accentColor: body.accentColor || '#6366f1',
      backgroundColor: body.backgroundColor || '#FFFFFF',
      textColor: body.textColor || '#000000',
      successColor: body.successColor || '#22c55e',
      warningColor: body.warningColor || '#f59e0b',
      errorColor: body.errorColor || '#ef4444',
      fontFamily: body.fontFamily || 'Inter, sans-serif',
      headingFont: body.headingFont || null,
      borderRadius: body.borderRadius || '0.5rem',
      sidebarPosition: body.sidebarPosition || 'left',
      theme: body.theme || 'light',
      footerText: body.footerText || null,
      contactEmail: body.contactEmail || null,
      contactPhone: body.contactPhone || null,
      websiteUrl: body.websiteUrl || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generar CSS variables para la preview
    const cssVariables = generateCSSVariables(previewConfig);
    
    return NextResponse.json({
      success: true,
      config: previewConfig,
      cssVariables
    });
  } catch (error) {
    logger.error('[API Branding Preview] Error:', error);
    return NextResponse.json(
      { error: 'Error al generar preview' },
      { status: 500 }
    );
  }
}
