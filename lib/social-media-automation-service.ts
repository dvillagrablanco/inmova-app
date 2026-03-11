// @ts-nocheck
/**
 * Servicio de Automatización de Marketing en Redes Sociales
 *
 * Genera contenido automático y publica propiedades en redes sociales
 * usando IA para copywriting optimizado.
 *
 * @module SocialMediaAutomationService
 */

import Anthropic from '@anthropic-ai/sdk';
// Lazy Prisma loading
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
import logger from './logger';
import { createCanvas, loadImage } from 'canvas';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

import { CLAUDE_MODEL_PRIMARY } from './ai-model-config';
const CLAUDE_MODEL = CLAUDE_MODEL_PRIMARY;

// ============================================================================
// TIPOS
// ============================================================================

export type SocialPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TWITTER' | 'TIKTOK';

export interface PropertyPost {
  platform: SocialPlatform;
  copy: string;
  hashtags: string[];
  imageUrl?: string;
  callToAction?: string;
}

export interface MarketingCopyResult {
  instagram: PropertyPost;
  facebook: PropertyPost;
  linkedin: PropertyPost;
  twitter?: PropertyPost;
}

// ============================================================================
// GENERACIÓN DE CONTENIDO
// ============================================================================

/**
 * Genera copy de marketing para redes sociales usando IA
 */
export async function generateMarketingCopy(property: any): Promise<MarketingCopyResult> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('⚠️ ANTHROPIC_API_KEY not configured, using fallback templates');
      return fallbackMarketingCopy(property);
    }

    const prompt = buildMarketingPrompt(property);

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    if (message.content[0].type === 'text') {
      const result = JSON.parse(message.content[0].text);

      logger.info('✅ Marketing copy generated for property', {
        propertyId: property.id,
        platforms: Object.keys(result),
      });

      return result;
    }

    throw new Error('Invalid AI response format');
  } catch (error: any) {
    logger.error('❌ Error generating marketing copy:', error);
    return fallbackMarketingCopy(property);
  }
}

/**
 * Construye el prompt para Claude
 */
function buildMarketingPrompt(property: any): string {
  return `Eres un experto en copywriting inmobiliario y marketing digital. Genera contenido optimizado para redes sociales para esta propiedad:

PROPIEDAD:
- Dirección: ${property.direccion || property.building?.direccion}, ${property.ciudad || property.building?.ciudad}
- Tipo: ${property.tipo || 'Apartamento'}
- Precio: ${property.rentaMensual || property.precio}€/mes
- Habitaciones: ${property.habitaciones}
- Baños: ${property.banos}
- Superficie: ${property.superficie}m²
- Características: ${JSON.stringify({
    amueblado: property.amueblado,
    ascensor: property.building?.tieneAscensor,
    parking: property.building?.tieneParking || property.tieneGaraje,
    terraza: property.tieneTerrazaBalcon,
    mascotas: property.admiteMascotas,
    cercaMetro: property.building?.cercaMetro,
  })}
- Descripción: ${property.descripcion || 'N/A'}

Genera contenido para 3 plataformas en formato JSON:

{
  "instagram": {
    "platform": "INSTAGRAM",
    "copy": "string de 150-200 caracteres, casual, con emojis, enfocado en estilo de vida",
    "hashtags": ["#inmobiliaria", "#alquiler", "#ciudad", "..."], // 10-15 hashtags relevantes
    "callToAction": "Link en bio para más info 📲"
  },
  "facebook": {
    "platform": "FACEBOOK",
    "copy": "string de 200-300 caracteres, tono familiar, detallado, enfocado en comodidad",
    "hashtags": ["#vivienda", "#hogar", "..."], // 5-8 hashtags
    "callToAction": "Contáctanos para agendar visita 📞"
  },
  "linkedin": {
    "platform": "LINKEDIN",
    "copy": "string de 150-250 caracteres, profesional, enfocado en inversión/oportunidad",
    "hashtags": ["#RealEstate", "#Inversión", "..."], // 5-7 hashtags profesionales
    "callToAction": "Más información en inmovaapp.com 🏢"
  }
}

GUÍAS DE ESTILO:
- Instagram: Casual, visual, emojis, lifestyle, hashtags trending
- Facebook: Familiar, cálido, detallado, enfocado en comunidad
- LinkedIn: Profesional, ROI, oportunidad de inversión, datos concretos

Sé creativo pero preciso. Resalta las mejores características.`;
}

/**
 * Genera marketing copy de fallback sin IA
 */
function fallbackMarketingCopy(property: any): MarketingCopyResult {
  const price = property.rentaMensual || property.precio || 0;
  const city = property.ciudad || property.building?.ciudad || 'Madrid';
  const rooms = property.habitaciones || 1;
  const bathrooms = property.banos || 1;
  const sqm = property.superficie || 0;

  const features = [];
  if (property.amueblado) features.push('amueblado');
  if (property.building?.tieneAscensor) features.push('ascensor');
  if (property.building?.tieneParking || property.tieneGaraje) features.push('parking');
  if (property.tieneTerrazaBalcon) features.push('terraza');
  if (property.admiteMascotas) features.push('pet-friendly');

  const featuresText = features.length > 0 ? `, ${features.join(', ')}` : '';

  return {
    instagram: {
      platform: 'INSTAGRAM',
      copy: `🏠 Nueva propiedad disponible en ${city}!\n\n✨ ${rooms} hab | ${bathrooms} baños | ${sqm}m²${featuresText}\n💰 ${price}€/mes\n\n¿Buscas tu próximo hogar? 📍`,
      hashtags: [
        '#inmobiliaria',
        '#alquiler',
        `#${city.toLowerCase().replace(/\s+/g, '')}`,
        '#vivienda',
        '#hogar',
        '#apartamento',
        '#propiedades',
        '#realtor',
        '#realestate',
        '#home',
      ],
      callToAction: 'Link en bio 📲',
    },
    facebook: {
      platform: 'FACEBOOK',
      copy: `🏠 ¡Nueva oportunidad de alquiler en ${city}!\n\n📍 ${rooms} habitaciones, ${bathrooms} baños, ${sqm}m²${featuresText}\n💰 ${price}€/mes\n\n¿Interesado? Contáctanos para más información y agendar una visita.`,
      hashtags: ['#alquiler', `#${city}`, '#vivienda', '#hogar', '#inmobiliaria'],
      callToAction: 'Contáctanos 📞',
    },
    linkedin: {
      platform: 'LINKEDIN',
      copy: `Nueva oportunidad de inversión inmobiliaria en ${city}.\n\n${rooms} habitaciones | ${bathrooms} baños | ${sqm}m²\n€${price}/mes\n\nZona en crecimiento con alta demanda de alquiler.`,
      hashtags: ['#PropTech', '#InversionInmobiliaria', '#RealEstate', `#${city}`, '#Rentabilidad'],
      callToAction: 'Más info en inmovaapp.com 🏢',
    },
  };
}

/**
 * Genera imagen de marketing para redes sociales
 */
export async function generateMarketingImage(
  property: any,
  platform: SocialPlatform = 'INSTAGRAM'
): Promise<Buffer | null> {
  try {
    // Dimensiones según plataforma
    const dimensions = {
      INSTAGRAM: { width: 1080, height: 1080 }, // Cuadrado
      FACEBOOK: { width: 1200, height: 630 }, // Landscape
      LINKEDIN: { width: 1200, height: 627 }, // Landscape
      TWITTER: { width: 1200, height: 675 }, // Landscape
      TIKTOK: { width: 1080, height: 1920 }, // Vertical
    };

    const { width, height } = dimensions[platform];

    // Crear canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Background: Foto de la propiedad (si existe)
    if (property.fotos && property.fotos.length > 0) {
      try {
        const propertyImage = await loadImage(property.fotos[0].url);
        ctx.drawImage(propertyImage, 0, 0, width, height);
      } catch (err) {
        // Si falla cargar imagen, usar color sólido
        ctx.fillStyle = '#1e40af'; // Azul oscuro
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // Fondo azul si no hay foto
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Overlay oscuro para legibilidad
    const gradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height * 0.6, width, height * 0.4);

    // 3. Información de la propiedad
    ctx.fillStyle = 'white';

    // Precio (grande)
    ctx.font = `bold ${width / 15}px Arial`;
    ctx.fillText(`${property.rentaMensual || property.precio}€/mes`, width * 0.05, height * 0.85);

    // Habitaciones y baños
    ctx.font = `${width / 25}px Arial`;
    ctx.fillText(
      `${property.habitaciones} HAB | ${property.banos} BAÑOS | ${property.superficie}m²`,
      width * 0.05,
      height * 0.92
    );

    // Ciudad
    const city = property.ciudad || property.building?.ciudad || '';
    if (city) {
      ctx.fillText(city.toUpperCase(), width * 0.05, height * 0.97);
    }

    // 4. Logo/Marca (esquina superior derecha)
    ctx.font = `bold ${width / 30}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText('INMOVA', width * 0.95, height * 0.08);

    // 5. Badge de "Disponible" (opcional)
    ctx.fillStyle = '#10b981'; // Verde
    ctx.fillRect(width * 0.05, height * 0.05, width * 0.25, height * 0.06);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${width / 40}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('DISPONIBLE', width * 0.05 + (width * 0.25) / 2, height * 0.08);

    return canvas.toBuffer('image/png');
  } catch (error: any) {
    logger.error('❌ Error generating marketing image:', error);
    return null;
  }
}

/**
 * Publica propiedad en redes sociales (mock - integrar con APIs reales)
 */
export async function publishToSocialMedia(
  property: any,
  platforms: SocialPlatform[] = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN']
): Promise<{ platform: SocialPlatform; status: 'success' | 'failed'; postUrl?: string }[]> {
  try {
    // 1. Generar contenido
    const marketingCopy = await generateMarketingCopy(property);

    // 2. Publicar en cada plataforma
    const results = await Promise.allSettled(
      platforms.map(async (platform) => {
        try {
          const post = marketingCopy[platform.toLowerCase() as keyof MarketingCopyResult];
          if (!post) {
            throw new Error(`No content generated for ${platform}`);
          }

          // Generar imagen
          const imageBuffer = await generateMarketingImage(property, platform);

          // TODO: Integrar con APIs reales de cada plataforma
          // - Instagram: Graph API
          // - Facebook: Graph API
          // - LinkedIn: LinkedIn API
          // - Twitter: Twitter API v2

          // Por ahora, guardar en BD como "scheduled"
          await prisma.socialMediaPost.create({
            data: {
              companyId: property.companyId || property.building?.companyId,
              unitId: property.id,
              plataforma: platform,
              contenido: post.copy,
              hashtags: post.hashtags,
              estado: 'PUBLICADO',
              // imagenUrl: imageBuffer ? await uploadImageToS3(imageBuffer) : null,
            },
          });

          logger.info(`✅ Posted to ${platform}`, { propertyId: property.id });

          return {
            platform,
            status: 'success' as const,
            postUrl: `https://example.com/${platform.toLowerCase()}`, // Mock URL
          };
        } catch (error: any) {
          logger.error(`❌ Failed to post to ${platform}:`, error);
          return {
            platform,
            status: 'failed' as const,
          };
        }
      })
    );

    return results.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : { platform: 'INSTAGRAM', status: 'failed' as const }
    );
  } catch (error: any) {
    logger.error('❌ Error publishing to social media:', error);
    throw new Error(`Failed to publish: ${error.message}`);
  }
}

/**
 * Programa publicación automática para todas las propiedades nuevas
 */
export async function scheduleAutoPublish(companyId: string): Promise<void> {
  const prisma = await getPrisma();
  try {
    // Obtener propiedades publicadas recientemente (últimas 24h) sin post en redes
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newProperties = await prisma.unit.findMany({
      where: {
        building: { companyId },
        estado: 'disponible',
        createdAt: { gte: yesterday },
        // No tiene posts en redes sociales
        socialMediaPosts: {
          none: {},
        },
      },
      include: {
        building: true,
        fotos: true,
      },
      take: 5, // Límite para no saturar
    });

    logger.info(`📅 Auto-publishing ${newProperties.length} new properties`);

    for (const property of newProperties) {
      await publishToSocialMedia(property);
      // Esperar 5 minutos entre publicaciones para evitar spam
      await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
    }
  } catch (error: any) {
    logger.error('❌ Error in auto-publish schedule:', error);
  }
}

export default {
  generateMarketingCopy,
  generateMarketingImage,
  publishToSocialMedia,
  scheduleAutoPublish,
};
