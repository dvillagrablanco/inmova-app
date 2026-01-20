/**
 * Servicio de Branding para Partners
 * 
 * Permite que la aplicación "respire" el look & feel del partner,
 * convirtiéndolos en auténticos prescriptores del producto Inmova.
 * 
 * Según directrices cursorrules:
 * - White-label completo
 * - Landing personalizada
 * - Servicios complementarios
 */

import { prisma } from '@/lib/db';
import { cache } from 'react';

import logger from '@/lib/logger';
export interface PartnerTheme {
  // Identidad
  nombre: string;
  slug: string;
  logo: string | null;
  logoDark: string | null;
  favicon: string | null;
  
  // Colores
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundDark: string;
    text: string;
    textLight: string;
  };
  
  // Tipografía
  fonts: {
    primary: string;
    secondary: string;
  };
  
  // Estilos
  buttonStyle: 'rounded' | 'square' | 'pill';
  buttonAnimation: boolean;
  
  // Redes sociales
  social: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    website?: string;
  };
  
  // Contacto
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
  
  // Footer
  footer: {
    text?: string;
    links?: Array<{ label: string; url: string }>;
  };
  
  // Custom CSS
  customCss?: string;
  customScripts?: string;
}

export interface PartnerLanding {
  // Hero
  hero: {
    title: string;
    subtitle?: string;
    cta: string;
    image?: string;
    video?: string;
  };
  
  // Contenido
  valueProposition?: string;
  benefits?: Array<{ icon: string; title: string; description: string }>;
  testimonials?: Array<{
    name: string;
    role: string;
    company: string;
    text: string;
    photo?: string;
  }>;
  faq?: Array<{ question: string; answer: string }>;
  aboutUs?: {
    text: string;
    image?: string;
  };
  
  // CTAs
  primaryCta: string;
  secondaryCta?: string;
  
  // Legal
  legalText?: string;
  privacyPolicy?: string;
  
  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  };
  
  // Configuración de secciones
  showPricing: boolean;
  showTestimonials: boolean;
  showFaq: boolean;
  showServices: boolean;
  showBanners: boolean;
}

export interface PartnerServiceData {
  id: string;
  nombre: string;
  slug: string;
  descripcionCorta: string;
  descripcionLarga?: string;
  iconoUrl?: string;
  imagenUrl?: string;
  videoUrl?: string;
  categoria: string;
  precio: {
    desde?: number;
    hasta?: number;
    tipo: string;
    moneda: string;
  };
  cta: {
    texto: string;
    url?: string;
    tipo: string;
  };
  destacado: boolean;
}

export interface PartnerPromotionData {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  tipo: string;
  descuento?: {
    valor: number;
    tipo: string;
    codigo?: string;
  };
  vigencia: {
    inicio: Date;
    fin?: Date;
  };
  condiciones?: string;
  cta: {
    texto: string;
    url?: string;
  };
}

export interface PartnerBannerData {
  id: string;
  titulo?: string;
  subtitulo?: string;
  imagenUrl: string;
  imagenMobileUrl?: string;
  enlace?: {
    url: string;
    target: string;
  };
  posicion: string;
}

/**
 * Obtiene el tema completo de un partner por su slug
 * Utiliza cache de React para optimizar rendimiento
 */
export const getPartnerTheme = cache(async (slug: string): Promise<PartnerTheme | null> => {
  const partner = await prisma.partner.findUnique({
    where: { slug },
    include: {
      brandingConfig: true,
    },
  });

  if (!partner || partner.estado !== 'ACTIVE') {
    return null;
  }

  const branding = partner.brandingConfig;

  return {
    nombre: partner.nombre,
    slug: partner.slug!,
    logo: branding?.logoUrl || partner.logo || null,
    logoDark: branding?.logoUrlDark || null,
    favicon: branding?.faviconUrl || null,
    colors: {
      primary: branding?.colorPrimario || '#6366f1',
      secondary: branding?.colorSecundario || '#8b5cf6',
      accent: branding?.colorAccento || '#06b6d4',
      background: branding?.colorFondo || '#ffffff',
      backgroundDark: branding?.colorFondoOscuro || '#0f172a',
      text: branding?.colorTexto || '#1e293b',
      textLight: branding?.colorTextoClaro || '#64748b',
    },
    fonts: {
      primary: branding?.fuentePrincipal || 'Inter',
      secondary: branding?.fuenteSecundaria || 'Inter',
    },
    buttonStyle: (branding?.botonEstilo as any) || 'rounded',
    buttonAnimation: branding?.botonAnimacion ?? true,
    social: {
      linkedin: branding?.urlLinkedin || undefined,
      twitter: branding?.urlTwitter || undefined,
      instagram: branding?.urlInstagram || undefined,
      facebook: branding?.urlFacebook || undefined,
      youtube: branding?.urlYoutube || undefined,
      website: branding?.urlWebsite || undefined,
    },
    contact: {
      email: branding?.emailContacto || partner.contactoEmail,
      phone: branding?.telefonoContacto || partner.contactoTelefono || undefined,
      address: branding?.direccion || undefined,
    },
    footer: {
      text: branding?.textoFooter || undefined,
      links: branding?.linksFooter as any || undefined,
    },
    customCss: branding?.cssPersonalizado || undefined,
    customScripts: branding?.scriptsExtras || undefined,
  };
});

/**
 * Obtiene el contenido de la landing de un partner
 */
export const getPartnerLanding = cache(async (slug: string): Promise<PartnerLanding | null> => {
  const partner = await prisma.partner.findUnique({
    where: { slug },
    include: {
      landingContent: true,
    },
  });

  if (!partner || partner.estado !== 'ACTIVE') {
    return null;
  }

  const content = partner.landingContent;

  return {
    hero: {
      title: content?.heroTitulo || 'Gestiona tus propiedades con nosotros',
      subtitle: content?.heroSubtitulo || undefined,
      cta: content?.heroCTA || 'Empezar gratis',
      image: content?.heroImagenUrl || undefined,
      video: content?.heroVideoUrl || undefined,
    },
    valueProposition: content?.propuestaValor || undefined,
    benefits: content?.beneficios as any || undefined,
    testimonials: content?.testimonios as any || undefined,
    faq: content?.faqItems as any || undefined,
    aboutUs: content?.sobreNosotros ? {
      text: content.sobreNosotros,
      image: content.sobreNosotrosImg || undefined,
    } : undefined,
    primaryCta: content?.ctaPrincipal || 'Solicitar demo',
    secondaryCta: content?.ctaSecundario || undefined,
    legalText: content?.textoLegal || undefined,
    privacyPolicy: content?.politicaPrivacidad || undefined,
    seo: {
      title: content?.metaTitulo || `${partner.nombre} | Powered by Inmova`,
      description: content?.metaDescripcion || undefined,
      keywords: content?.metaKeywords || undefined,
      ogImage: content?.ogImagen || undefined,
    },
    showPricing: content?.mostrarPrecios ?? true,
    showTestimonials: content?.mostrarTestimonios ?? true,
    showFaq: content?.mostrarFAQ ?? true,
    showServices: content?.mostrarServicios ?? true,
    showBanners: content?.mostrarBanners ?? true,
  };
});

/**
 * Obtiene los servicios complementarios de un partner
 */
export const getPartnerServices = cache(async (slug: string): Promise<PartnerServiceData[]> => {
  const partner = await prisma.partner.findUnique({
    where: { slug },
    include: {
      serviciosComplementarios: {
        where: { activo: true },
        orderBy: [
          { destacado: 'desc' },
          { orden: 'asc' },
        ],
      },
    },
  });

  if (!partner || partner.estado !== 'ACTIVE') {
    return [];
  }

  return partner.serviciosComplementarios.map(s => ({
    id: s.id,
    nombre: s.nombre,
    slug: s.slug,
    descripcionCorta: s.descripcionCorta,
    descripcionLarga: s.descripcionLarga || undefined,
    iconoUrl: s.iconoUrl || undefined,
    imagenUrl: s.imagenUrl || undefined,
    videoUrl: s.videoUrl || undefined,
    categoria: s.categoria,
    precio: {
      desde: s.precioDesde || undefined,
      hasta: s.precioHasta || undefined,
      tipo: s.precioTipo,
      moneda: s.moneda,
    },
    cta: {
      texto: s.ctaTexto,
      url: s.ctaUrl || undefined,
      tipo: s.ctaTipo,
    },
    destacado: s.destacado,
  }));
});

/**
 * Obtiene las promociones activas de un partner
 */
export const getPartnerPromotions = cache(async (slug: string): Promise<PartnerPromotionData[]> => {
  const partner = await prisma.partner.findUnique({
    where: { slug },
    include: {
      promociones: {
        where: {
          activo: true,
          OR: [
            { fechaFin: null },
            { fechaFin: { gte: new Date() } },
          ],
        },
        orderBy: [
          { destacado: 'desc' },
          { fechaInicio: 'desc' },
        ],
      },
    },
  });

  if (!partner || partner.estado !== 'ACTIVE') {
    return [];
  }

  return partner.promociones.map(p => ({
    id: p.id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    imagenUrl: p.imagenUrl || undefined,
    tipo: p.tipo,
    descuento: p.valorDescuento ? {
      valor: p.valorDescuento,
      tipo: p.tipoDescuento || 'porcentaje',
      codigo: p.codigoCupon || undefined,
    } : undefined,
    vigencia: {
      inicio: p.fechaInicio,
      fin: p.fechaFin || undefined,
    },
    condiciones: p.condiciones || undefined,
    cta: {
      texto: p.ctaTexto,
      url: p.ctaUrl || undefined,
    },
  }));
});

/**
 * Obtiene los banners activos de un partner
 */
export const getPartnerBanners = cache(async (slug: string, posicion?: string): Promise<PartnerBannerData[]> => {
  const partner = await prisma.partner.findUnique({
    where: { slug },
    include: {
      banners: {
        where: {
          activo: true,
          ...(posicion && { posicion }),
          OR: [
            { fechaFin: null },
            { fechaFin: { gte: new Date() } },
          ],
        },
        orderBy: { orden: 'asc' },
      },
    },
  });

  if (!partner || partner.estado !== 'ACTIVE') {
    return [];
  }

  return partner.banners.map(b => ({
    id: b.id,
    titulo: b.titulo || undefined,
    subtitulo: b.subtitulo || undefined,
    imagenUrl: b.imagenUrl,
    imagenMobileUrl: b.imagenMobileUrl || undefined,
    enlace: b.enlaceUrl ? {
      url: b.enlaceUrl,
      target: b.enlaceTarget,
    } : undefined,
    posicion: b.posicion,
  }));
});

/**
 * Genera variables CSS para el tema del partner
 */
export function generatePartnerCssVariables(theme: PartnerTheme): string {
  return `
    :root {
      --partner-primary: ${theme.colors.primary};
      --partner-secondary: ${theme.colors.secondary};
      --partner-accent: ${theme.colors.accent};
      --partner-background: ${theme.colors.background};
      --partner-background-dark: ${theme.colors.backgroundDark};
      --partner-text: ${theme.colors.text};
      --partner-text-light: ${theme.colors.textLight};
      --partner-font-primary: '${theme.fonts.primary}', sans-serif;
      --partner-font-secondary: '${theme.fonts.secondary}', sans-serif;
      --partner-button-radius: ${
        theme.buttonStyle === 'pill' ? '9999px' : 
        theme.buttonStyle === 'square' ? '4px' : '8px'
      };
    }
  `.trim();
}

/**
 * Registra una visita a la landing del partner
 */
export async function trackPartnerLandingView(slug: string): Promise<void> {
  try {
    await prisma.partner.update({
      where: { slug },
      data: {
        landingViews: { increment: 1 },
        ultimaVisita: new Date(),
      },
    });
  } catch (error) {
    logger.error('[Partner Branding] Error tracking view:', error);
  }
}

/**
 * Registra un lead generado desde la landing del partner
 */
export async function trackPartnerLandingLead(slug: string): Promise<void> {
  try {
    await prisma.partner.update({
      where: { slug },
      data: {
        landingLeads: { increment: 1 },
      },
    });
  } catch (error) {
    logger.error('[Partner Branding] Error tracking lead:', error);
  }
}

/**
 * Registra un click en un banner
 */
export async function trackBannerClick(bannerId: string): Promise<void> {
  try {
    await prisma.partnerBanner.update({
      where: { id: bannerId },
      data: {
        clicks: { increment: 1 },
      },
    });
  } catch (error) {
    logger.error('[Partner Branding] Error tracking banner click:', error);
  }
}

/**
 * Registra interacción con un servicio
 */
export async function trackServiceInteraction(serviceId: string, tipo: 'vista' | 'click'): Promise<void> {
  try {
    await prisma.partnerService.update({
      where: { id: serviceId },
      data: tipo === 'vista' 
        ? { vistas: { increment: 1 } }
        : { clicks: { increment: 1 } },
    });
  } catch (error) {
    logger.error('[Partner Branding] Error tracking service:', error);
  }
}

/**
 * Obtiene datos completos del partner para su landing
 */
export async function getFullPartnerData(slug: string) {
  const [theme, landing, services, promotions, banners] = await Promise.all([
    getPartnerTheme(slug),
    getPartnerLanding(slug),
    getPartnerServices(slug),
    getPartnerPromotions(slug),
    getPartnerBanners(slug),
  ]);

  if (!theme || !landing) {
    return null;
  }

  return {
    theme,
    landing,
    services,
    promotions,
    banners,
  };
}
