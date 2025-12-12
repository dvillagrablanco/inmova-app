import { prisma } from '@/lib/db';
import type {SocialMediaPlatform, SocialPostStatus } from '@prisma/client';
import logger, { logError } from '@/lib/logger';

/**
 * SERVICIO DE REDES SOCIALES
 * 
 * Este servicio proporciona la estructura para integrar con las principales redes sociales.
 * Para activar en producción, necesitas:
 * 
 * 1. Facebook/Instagram:
 *    - Crear App en https://developers.facebook.com
 *    - Obtener App ID y App Secret
 *    - Configurar OAuth redirect URI
 *    - Solicitar permisos: pages_manage_posts, instagram_basic, instagram_content_publish
 * 
 * 2. Twitter/X:
 *    - Crear App en https://developer.twitter.com
 *    - Obtener API Key, API Secret, Access Token, Access Secret
 *    - Habilitar OAuth 2.0
 * 
 * 3. LinkedIn:
 *    - Crear App en https://www.linkedin.com/developers
 *    - Obtener Client ID y Client Secret
 *    - Solicitar permisos: w_member_social, r_basicprofile
 * 
 * 4. WhatsApp Business:
 *    - Configurar en https://business.facebook.com/
 *    - Obtener Business Account ID y Phone Number ID
 *    - Configurar Webhook
 */

interface SocialMediaConfig {
  platform: SocialMediaPlatform;
  accessToken: string;
  pageId?: string;
  businessAccountId?: string;
}

interface PostContent {
  mensaje: string;
  imagenesUrls?: string[];
  videoUrl?: string;
  enlace?: string;
}

interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Conectar cuenta de red social
 * En producción, esto manejaría el flujo OAuth completo
 */
export async function connectSocialMediaAccount(
  companyId: string,
  platform: SocialMediaPlatform,
  accountName: string,
  accountId: string,
  accessToken: string,
  config?: {
    refreshToken?: string;
    tokenExpiry?: Date;
    pageId?: string;
    businessAccountId?: string;
  }
) {
  try {
    // Verificar si ya existe
    const existing = await prisma.socialMediaAccount.findUnique({
      where: {
        companyId_platform_accountId: {
          companyId,
          platform,
          accountId,
        },
      },
    });

    if (existing) {
      // Actualizar tokens
      return await prisma.socialMediaAccount.update({
        where: { id: existing.id },
        data: {
          accountName,
          accessToken,
          refreshToken: config?.refreshToken,
          tokenExpiry: config?.tokenExpiry,
          pageId: config?.pageId,
          businessAccountId: config?.businessAccountId,
          activo: true,
          updatedAt: new Date(),
        },
      });
    }

    // Crear nueva cuenta
    return await prisma.socialMediaAccount.create({
      data: {
        companyId,
        platform,
        accountName,
        accountId,
        accessToken,
        refreshToken: config?.refreshToken,
        tokenExpiry: config?.tokenExpiry,
        pageId: config?.pageId,
        businessAccountId: config?.businessAccountId,
        activo: true,
      },
    });
  } catch (error) {
    logger.error('Error connecting social media account:', error);
    throw error;
  }
}

/**
 * Desconectar cuenta de red social
 */
export async function disconnectSocialMediaAccount(accountId: string) {
  return await prisma.socialMediaAccount.update({
    where: { id: accountId },
    data: { activo: false },
  });
}

/**
 * Obtener cuentas conectadas de una empresa
 */
export async function getConnectedAccounts(companyId: string) {
  return await prisma.socialMediaAccount.findMany({
    where: {
      companyId,
      activo: true,
    },
    orderBy: {
      platform: 'asc',
    },
  });
}

/**
 * Publicar en red social
 * DEMO: En producción, esto haría llamadas reales a las APIs
 */
export async function publishToSocialMedia(
  accountId: string,
  content: PostContent,
  creadoPor: string,
  programar?: Date
): Promise<PostResult> {
  try {
    const account = await prisma.socialMediaAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.activo) {
      return { success: false, error: 'Cuenta no encontrada o inactiva' };
    }

    // Crear registro de post
    const post = await prisma.socialMediaPost.create({
      data: {
        companyId: account.companyId,
        accountId,
        mensaje: content.mensaje,
        imagenesUrls: content.imagenesUrls || [],
        videoUrl: content.videoUrl,
        enlace: content.enlace,
        estado: programar ? 'programado' : 'borrador',
        fechaProgramada: programar,
        creadoPor,
      },
    });

    // DEMO: Simular publicación
    if (!programar) {
      return await executePublish(post.id, account);
    }

    return { success: true, postId: post.id };
  } catch (error) {
    logger.error('Error publishing to social media:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Ejecutar publicación (llamado inmediatamente o por scheduler)
 * DEMO: Simula publicación exitosa
 */
async function executePublish(
  postId: string,
  account: any
): Promise<PostResult> {
  try {
    // En producción, aquí irían las llamadas a las APIs:
    // - Facebook: POST /v18.0/{page-id}/feed
    // - Instagram: POST /v18.0/{ig-user-id}/media + POST /v18.0/{ig-user-id}/media_publish
    // - Twitter: POST /2/tweets
    // - LinkedIn: POST /v2/ugcPosts
    // - WhatsApp: POST /{whatsapp-business-account-id}/messages

    logger.info(`[DEMO] Publicando en ${account.platform}...`);

    // Simular ID de post
    const externalPostId = `${account.platform}_${Date.now()}`;

    // Actualizar post como publicado
    await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        estado: 'publicado',
        fechaPublicacion: new Date(),
        postId: externalPostId,
        alcance: Math.floor(Math.random() * 1000) + 100,
        impresiones: Math.floor(Math.random() * 2000) + 200,
      },
    });

    return { success: true, postId: externalPostId };
  } catch (error) {
    // Marcar como error
    await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        estado: 'error',
        errorMessage: (error as Error).message,
      },
    });

    return { success: false, error: (error as Error).message };
  }
}

/**
 * Obtener posts de una empresa
 */
export async function getCompanyPosts(
  companyId: string,
  filters?: {
    accountId?: string;
    estado?: SocialPostStatus;
    limit?: number;
  }
) {
  return await prisma.socialMediaPost.findMany({
    where: {
      companyId,
      ...(filters?.accountId && { accountId: filters.accountId }),
      ...(filters?.estado && { estado: filters.estado }),
    },
    include: {
      account: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters?.limit || 50,
  });
}

/**
 * Actualizar métricas de un post
 * En producción, esto se ejecutaría periódicamente para actualizar likes, comentarios, etc.
 */
export async function updatePostMetrics(postId: string) {
  try {
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      include: { account: true },
    });

    if (!post || !post.postId) return;

    // En producción, aquí se harían llamadas a las APIs para obtener métricas reales
    // Por ahora, simulamos incrementos aleatorios
    await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        likes: post.likes + Math.floor(Math.random() * 10),
        comentarios: post.comentarios + Math.floor(Math.random() * 5),
        compartidos: post.compartidos + Math.floor(Math.random() * 3),
        alcance: post.alcance + Math.floor(Math.random() * 50),
        impresiones: post.impresiones + Math.floor(Math.random() * 100),
      },
    });
  } catch (error) {
    logger.error('Error updating post metrics:', error);
  }
}

/**
 * Procesar posts programados
 * Esta función debería ejecutarse periódicamente (cron job)
 */
export async function processScheduledPosts() {
  const now = new Date();
  
  const scheduledPosts = await prisma.socialMediaPost.findMany({
    where: {
      estado: 'programado',
      fechaProgramada: {
        lte: now,
      },
    },
    include: {
      account: true,
    },
    take: 20,
  });

  for (const post of scheduledPosts) {
    if (post.account) {
      await executePublish(post.id, post.account);
    }
  }

  return scheduledPosts.length;
}

/**
 * Obtener estadísticas de redes sociales
 */
export async function getSocialMediaStats(companyId: string) {
  const [totalPosts, publishedPosts, scheduledPosts, accounts] = await Promise.all([
    prisma.socialMediaPost.count({
      where: { companyId },
    }),
    prisma.socialMediaPost.count({
      where: { companyId, estado: 'publicado' },
    }),
    prisma.socialMediaPost.count({
      where: { companyId, estado: 'programado' },
    }),
    prisma.socialMediaAccount.count({
      where: { companyId, activo: true },
    }),
  ]);

  // Métricas totales
  const metricsSum = await prisma.socialMediaPost.aggregate({
    where: {
      companyId,
      estado: 'publicado',
    },
    _sum: {
      likes: true,
      comentarios: true,
      compartidos: true,
      alcance: true,
      impresiones: true,
    },
  });

  return {
    totalPosts,
    publishedPosts,
    scheduledPosts,
    connectedAccounts: accounts,
    totalLikes: metricsSum._sum.likes || 0,
    totalComentarios: metricsSum._sum.comentarios || 0,
    totalCompartidos: metricsSum._sum.compartidos || 0,
    totalAlcance: metricsSum._sum.alcance || 0,
    totalImpresiones: metricsSum._sum.impresiones || 0,
  };
}

/**
 * Generar contenido automático para una nueva propiedad
 */
export async function generatePropertyPostContent(propertyData: {
  type: 'building' | 'unit';
  name: string;
  address?: string;
  precio?: number;
  superficie?: number;
  habitaciones?: number;
  imageUrl?: string;
}) {
  const { type, name, address, precio, superficie, habitaciones, imageUrl } = propertyData;

  let mensaje = '';
  const hashtags = ['#InmovaApp', '#PropTech', '#GestiónInmobiliaria'];

  if (type === 'building') {
    mensaje = `🏢 ¡Nuevo edificio incorporado a nuestra cartera!\n\n` +
      `📍 ${name}${address ? `\n${address}` : ''}\n\n` +
      `Gestionado con tecnología INMOVA para máxima eficiencia operativa.\n\n` +
      `#NuevaPropiedad #Inmobiliaria ${hashtags.join(' ')}`;
  } else {
    mensaje = `🏠 ¡Nueva propiedad disponible!\n\n` +
      `${name}\n` +
      `${habitaciones ? `🛏️ ${habitaciones} habitaciones\n` : ''}` +
      `${superficie ? `📐 ${superficie} m²\n` : ''}` +
      `${precio ? `💰 ${precio.toLocaleString('es-ES')}€/mes\n` : ''}\n` +
      `${address || ''}\n\n` +
      `Contáctanos para más información.\n\n` +
      `#PropiedadDisponible #Alquiler ${hashtags.join(' ')}`;
  }

  return {
    mensaje,
    imagenesUrls: imageUrl ? [imageUrl] : [],
    hashtags
  };
}

/**
 * Publicar automáticamente en redes sociales cuando se crea una propiedad
 */
export async function autoPublishProperty(
  companyId: string,
  userId: string,
  propertyData: {
    type: 'building' | 'unit';
    id: string;
    name: string;
    address?: string;
    precio?: number;
    superficie?: number;
    habitaciones?: number;
    imageUrl?: string;
  },
  options?: {
    platforms?: SocialMediaPlatform[];
    scheduleMinutesDelay?: number;
  }
) {
  try {
    // Obtener cuentas activas
    const accounts = await getConnectedAccounts(companyId);
    
    if (accounts.length === 0) {
      logger.info('No hay cuentas de redes sociales conectadas para autopublicar');
      return {
        success: false,
        published: 0,
        failed: 0,
        total: 0,
        message: 'No hay cuentas conectadas'
      };
    }

    // Generar contenido
    const postContent = await generatePropertyPostContent(propertyData);

    // Filtrar cuentas por plataforma si se especifica
    let targetAccounts = accounts;
    if (options?.platforms) {
      targetAccounts = accounts.filter(acc => 
        options.platforms!.includes(acc.platform)
      );
    }

    if (targetAccounts.length === 0) {
      return {
        success: false,
        published: 0,
        failed: 0,
        total: 0,
        message: 'No hay cuentas para las plataformas especificadas'
      };
    }

    // Crear posts en cada cuenta
    const publishPromises = targetAccounts.map(async (account) => {
      const scheduledFor = options?.scheduleMinutesDelay 
        ? new Date(Date.now() + options.scheduleMinutesDelay * 60 * 1000)
        : undefined;

      return publishToSocialMedia(
        account.id,
        {
          mensaje: postContent.mensaje,
          imagenesUrls: postContent.imagenesUrls,
        },
        userId,
        scheduledFor
      );
    });

    const results = await Promise.allSettled(publishPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    logger.info(`Autopublicación de propiedad: ${successful} éxitos, ${failed} fallos`);

    return {
      success: successful > 0,
      published: successful,
      failed,
      total: results.length,
      message: `Publicado en ${successful} de ${results.length} cuentas`
    };
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error en autopublicación'), {
      companyId,
      propertyId: propertyData.id
    });
    
    return {
      success: false,
      published: 0,
      failed: 1,
      total: 1,
      message: 'Error en autopublicación'
    };
  }
}
