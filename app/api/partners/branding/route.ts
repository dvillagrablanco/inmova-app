/**
 * API: Gestión de Branding del Partner
 *
 * GET /api/partners/branding - Obtener configuración de branding
 * PUT /api/partners/branding - Actualizar configuración de branding
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Schema de validación para branding
const brandingSchema = z.object({
  // Identidad visual
  logoUrl: z.string().url().optional().nullable(),
  logoUrlDark: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),

  // Paleta de colores
  colorPrimario: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  colorSecundario: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  colorAccento: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  colorFondo: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  colorFondoOscuro: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  colorTexto: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  colorTextoClaro: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),

  // Tipografía
  fuentePrincipal: z.string().optional(),
  fuenteSecundaria: z.string().optional(),

  // Botones
  botonEstilo: z.enum(['rounded', 'square', 'pill']).optional(),
  botonAnimacion: z.boolean().optional(),

  // Redes sociales
  urlLinkedin: z.string().url().optional().nullable(),
  urlTwitter: z.string().url().optional().nullable(),
  urlInstagram: z.string().url().optional().nullable(),
  urlFacebook: z.string().url().optional().nullable(),
  urlYoutube: z.string().url().optional().nullable(),
  urlWebsite: z.string().url().optional().nullable(),

  // Contacto
  emailContacto: z.string().email().optional().nullable(),
  telefonoContacto: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),

  // Footer
  textoFooter: z.string().optional().nullable(),
  linksFooter: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().url(),
      })
    )
    .optional()
    .nullable(),

  // Custom
  cssPersonalizado: z.string().optional().nullable(),
  scriptsExtras: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar partner asociado al usuario
    const partner = await prisma.partner.findFirst({
      where: { email: session.user.email! },
      include: { brandingConfig: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      partnerId: partner.id,
      partnerNombre: partner.nombre,
      slug: partner.slug,
      branding: partner.brandingConfig || null,
    });
  } catch (error: any) {
    logger.error('[API Partners Branding] Error:', error);
    return NextResponse.json({ error: 'Error obteniendo branding' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar partner asociado al usuario
    const partner = await prisma.partner.findFirst({
      where: { email: session.user.email! },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = brandingSchema.parse(body);
    const sanitizedData = {
      ...validatedData,
      linksFooter: validatedData.linksFooter ?? undefined,
    };

    // Upsert de branding
    const branding = await prisma.partnerBranding.upsert({
      where: { partnerId: partner.id },
      create: {
        partnerId: partner.id,
        ...sanitizedData,
      },
      update: sanitizedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Branding actualizado correctamente',
      branding,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[API Partners Branding] Error:', error);
    return NextResponse.json({ error: 'Error actualizando branding' }, { status: 500 });
  }
}
