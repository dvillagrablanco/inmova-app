import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Canva Connect API base URL
const CANVA_API_URL = 'https://api.canva.com/rest/v1';

// Dimensiones predefinidas para templates PropTech
const TEMPLATE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1080x1080': { width: 1080, height: 1080 }, // Instagram Square
  '1080x1920': { width: 1080, height: 1920 }, // Instagram Story
  '1200x627': { width: 1200, height: 627 },   // LinkedIn/Facebook
  '1200x675': { width: 1200, height: 675 },   // Twitter
  '820x312': { width: 820, height: 312 },     // Facebook Cover
  '1920x1080': { width: 1920, height: 1080 }, // Presentation
  'A4': { width: 2480, height: 3508 },        // A4 @ 300dpi
  'A5': { width: 1748, height: 2480 },        // A5 @ 300dpi
  '600x200': { width: 600, height: 200 },     // Email Header
};

// POST - Crear nuevo diseño
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, templateId, dimensions } = body;

    if (!name || !dimensions) {
      return NextResponse.json(
        { error: 'Nombre y dimensiones son requeridos' },
        { status: 400 }
      );
    }

    const canvaAccessToken = process.env.CANVA_ACCESS_TOKEN;

    // Si Canva está conectado, crear diseño vía API
    if (canvaAccessToken) {
      const dim = TEMPLATE_DIMENSIONS[dimensions] || { width: 1080, height: 1080 };
      
      const response = await fetch(`${CANVA_API_URL}/designs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${canvaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          design_type: 'custom',
          title: name,
          width: dim.width,
          height: dim.height,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Canva API Error]:', error);
        
        // Si falla la API, ofrecer alternativa
        return NextResponse.json({
          success: false,
          fallback: true,
          message: 'No se pudo crear en Canva directamente. Usa el enlace alternativo.',
          editUrl: `https://www.canva.com/design/new?designType=custom&width=${dim.width}&height=${dim.height}`,
          localDesign: {
            id: `local-${Date.now()}`,
            name,
            templateId,
            dimensions,
            status: 'draft',
            createdAt: new Date().toISOString(),
          },
        });
      }

      const design = await response.json();
      
      return NextResponse.json({
        success: true,
        design: {
          id: design.design.id,
          name: design.design.title,
          editUrl: design.design.edit_url,
          viewUrl: design.design.view_url,
          thumbnailUrl: design.design.thumbnail?.url,
        },
      });
    }

    // Sin conexión a Canva - crear enlace directo
    const dim = TEMPLATE_DIMENSIONS[dimensions] || { width: 1080, height: 1080 };
    
    // URLs de templates de Canva según el tipo
    const templateUrls: Record<string, string> = {
      'instagram-property': 'https://www.canva.com/templates/?query=real%20estate%20instagram',
      'instagram-story': 'https://www.canva.com/templates/?query=property%20story',
      'facebook-cover': 'https://www.canva.com/templates/?query=real%20estate%20facebook%20cover',
      'linkedin-post': 'https://www.canva.com/templates/?query=real%20estate%20linkedin',
      'twitter-post': 'https://www.canva.com/templates/?query=property%20twitter',
      'investor-deck': 'https://www.canva.com/templates/?query=real%20estate%20investor%20presentation',
      'client-proposal': 'https://www.canva.com/templates/?query=property%20proposal',
      'property-portfolio': 'https://www.canva.com/templates/?query=real%20estate%20portfolio',
      'property-card': 'https://www.canva.com/templates/?query=property%20listing%20flyer',
      'property-flyer': 'https://www.canva.com/templates/?query=open%20house%20flyer',
      'sold-announcement': 'https://www.canva.com/templates/?query=sold%20announcement',
      'promo-banner': 'https://www.canva.com/templates/?query=real%20estate%20banner',
      'email-header': 'https://www.canva.com/templates/?query=email%20header%20real%20estate',
      'testimonial': 'https://www.canva.com/templates/?query=testimonial%20real%20estate',
      'market-report': 'https://www.canva.com/templates/?query=market%20report%20real%20estate',
      'monthly-stats': 'https://www.canva.com/templates/?query=statistics%20infographic',
    };

    const editUrl = templateUrls[templateId] || 
      `https://www.canva.com/design/new?designType=custom&width=${dim.width}&height=${dim.height}`;

    return NextResponse.json({
      success: true,
      fallback: true,
      message: 'Conecta tu cuenta de Canva Pro para acceso API completo',
      editUrl,
      localDesign: {
        id: `local-${Date.now()}`,
        name,
        templateId,
        dimensions,
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Canva Designs Error]:', error);
    return NextResponse.json(
      { error: 'Error creando diseño' },
      { status: 500 }
    );
  }
}

// GET - Listar diseños
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const canvaAccessToken = process.env.CANVA_ACCESS_TOKEN;

    if (canvaAccessToken) {
      // Obtener diseños de Canva
      const response = await fetch(`${CANVA_API_URL}/designs`, {
        headers: {
          'Authorization': `Bearer ${canvaAccessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          designs: data.designs || [],
          source: 'canva',
        });
      }
    }

    // Diseños de ejemplo (cuando no hay conexión a Canva)
    const sampleDesigns = [
      {
        id: 'sample-1',
        name: 'Post Instagram - Ático Barcelona',
        templateId: 'instagram-property',
        dimensions: '1080x1080',
        status: 'published',
        views: 234,
        createdAt: '2026-01-10T10:00:00Z',
        thumbnail: null,
      },
      {
        id: 'sample-2',
        name: 'Presentación Q1 2026',
        templateId: 'investor-deck',
        dimensions: '1920x1080',
        status: 'draft',
        views: 0,
        createdAt: '2026-01-08T15:30:00Z',
        thumbnail: null,
      },
      {
        id: 'sample-3',
        name: 'LinkedIn - Nuevo Proyecto',
        templateId: 'linkedin-post',
        dimensions: '1200x627',
        status: 'published',
        views: 567,
        createdAt: '2026-01-05T09:00:00Z',
        thumbnail: null,
      },
    ];

    return NextResponse.json({
      success: true,
      designs: sampleDesigns,
      source: 'local',
      message: 'Conecta Canva Pro para sincronizar tus diseños',
    });
  } catch (error: any) {
    console.error('[Canva Designs List Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo diseños' },
      { status: 500 }
    );
  }
}
