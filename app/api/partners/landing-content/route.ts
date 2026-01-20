/**
 * API: Gestión del Contenido de Landing del Partner
 *
 * GET /api/partners/landing-content - Obtener contenido de la landing
 * PUT /api/partners/landing-content - Actualizar contenido de la landing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const landingContentSchema = z.object({
  // Hero Section
  heroTitulo: z.string().min(1).max(200).optional(),
  heroSubtitulo: z.string().max(500).optional().nullable(),
  heroCTA: z.string().max(50).optional(),
  heroImagenUrl: z.string().url().optional().nullable(),
  heroVideoUrl: z.string().url().optional().nullable(),

  // Propuesta de valor
  propuestaValor: z.string().max(1000).optional().nullable(),

  // Beneficios
  beneficios: z
    .array(
      z.object({
        icono: z.string().optional(),
        titulo: z.string(),
        descripcion: z.string(),
      })
    )
    .optional()
    .nullable(),

  // Testimonios
  testimonios: z
    .array(
      z.object({
        nombre: z.string(),
        cargo: z.string().optional(),
        empresa: z.string().optional(),
        texto: z.string(),
        foto: z.string().url().optional(),
      })
    )
    .optional()
    .nullable(),

  // FAQ
  faqItems: z
    .array(
      z.object({
        pregunta: z.string(),
        respuesta: z.string(),
      })
    )
    .optional()
    .nullable(),

  // Sobre nosotros
  sobreNosotros: z.string().max(2000).optional().nullable(),
  sobreNosotrosImg: z.string().url().optional().nullable(),

  // CTAs
  ctaPrincipal: z.string().max(50).optional(),
  ctaSecundario: z.string().max(50).optional().nullable(),

  // Legal
  textoLegal: z.string().optional().nullable(),
  politicaPrivacidad: z.string().optional().nullable(),

  // SEO
  metaTitulo: z.string().max(70).optional().nullable(),
  metaDescripcion: z.string().max(160).optional().nullable(),
  metaKeywords: z.string().max(200).optional().nullable(),
  ogImagen: z.string().url().optional().nullable(),

  // Configuración de secciones
  mostrarPrecios: z.boolean().optional(),
  mostrarTestimonios: z.boolean().optional(),
  mostrarFAQ: z.boolean().optional(),
  mostrarServicios: z.boolean().optional(),
  mostrarBanners: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const partner = await prisma.partner.findFirst({
      where: { email: session.user.email! },
      include: { landingContent: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      partnerId: partner.id,
      partnerNombre: partner.nombre,
      slug: partner.slug,
      landingUrl: partner.slug ? `/p/${partner.slug}` : null,
      content: partner.landingContent || null,
    });
  } catch (error: any) {
    logger.error('[API Partners Landing Content] Error:', error);
    return NextResponse.json({ error: 'Error obteniendo contenido' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const partner = await prisma.partner.findFirst({
      where: { email: session.user.email! },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = landingContentSchema.parse(body);

    // Upsert de contenido
    const content = await prisma.partnerLandingContent.upsert({
      where: { partnerId: partner.id },
      create: {
        partnerId: partner.id,
        ...validatedData,
      },
      update: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Contenido de landing actualizado',
      content,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[API Partners Landing Content] Error:', error);
    return NextResponse.json({ error: 'Error actualizando contenido' }, { status: 500 });
  }
}
