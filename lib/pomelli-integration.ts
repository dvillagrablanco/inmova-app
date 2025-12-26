/**
 * POMELLI SOCIAL MEDIA INTEGRATION SERVICE
 * Gestión completa de redes sociales: LinkedIn, Instagram, X (Twitter)
 * Integración con API de Pomelli para automatización de publicaciones
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SocialPlatform = 'linkedin' | 'instagram' | 'x' | 'facebook';

export type PostStatus =
  | 'draft' // Borrador
  | 'scheduled' // Programado
  | 'published' // Publicado
  | 'failed' // Falló
  | 'archived'; // Archivado

export type ContentType =
  | 'text' // Solo texto
  | 'image' // Imagen + texto
  | 'video' // Video + texto
  | 'carousel' // Múltiples imágenes
  | 'story'; // Historia (Instagram/Facebook)

export interface PomelliConfig {
  apiKey: string;
  apiSecret: string;
  webhookUrl?: string;
  enabled: boolean;
}

export interface SocialProfile {
  id: string;
  platform: SocialPlatform;
  profileId: string; // ID del perfil en Pomelli
  profileName: string; // Nombre del perfil
  profileUsername: string; // @username
  profileUrl?: string;
  accessToken?: string; // Token de acceso (encriptado)
  refreshToken?: string; // Token de refresh (encriptado)
  tokenExpiresAt?: Date;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt?: Date;
  metadata?: Record<string, any>;
}

export interface SocialPost {
  id: string;
  companyId: string;
  platforms: SocialPlatform[]; // Múltiples plataformas
  content: string; // Texto del post
  mediaUrls?: string[]; // URLs de imágenes/videos
  contentType: ContentType;
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  pomelliPostId?: string; // ID en Pomelli
  analytics?: PostAnalytics;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface PostAnalytics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagement_rate: number;
  lastUpdatedAt: Date;
}

export interface ScheduledPost {
  postId: string;
  scheduledAt: Date;
  platforms: SocialPlatform[];
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
}

// ============================================================================
// POMELLI API CLIENT
// ============================================================================

export class PomelliClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string = 'https://api.pomelli.com/v1';

  constructor(config: PomelliConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  /**
   * Autenticar con Pomelli API
   */
  private async authenticate(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          api_secret: this.apiSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Pomelli authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      logger.error('Error authenticating with Pomelli:', error);
      throw error;
    }
  }

  /**
   * Conectar perfil de red social
   */
  async connectSocialProfile(platform: SocialPlatform, authCode: string): Promise<SocialProfile> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/profiles/connect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          auth_code: authCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to connect ${platform}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        platform,
        profileId: data.profile_id,
        profileName: data.profile_name,
        profileUsername: data.username,
        profileUrl: data.profile_url,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiresAt: new Date(data.expires_at),
        isActive: true,
        isConnected: true,
        lastSyncAt: new Date(),
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error(`Error connecting ${platform} profile:`, error);
      throw error;
    }
  }

  /**
   * Desconectar perfil de red social
   */
  async disconnectSocialProfile(profileId: string): Promise<void> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/profiles/${profileId}/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to disconnect profile: ${response.statusText}`);
      }

      logger.info(`Profile ${profileId} disconnected successfully`);
    } catch (error) {
      logger.error('Error disconnecting profile:', error);
      throw error;
    }
  }

  /**
   * Crear publicación en redes sociales
   */
  async createPost(
    post: Omit<SocialPost, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const token = await this.authenticate();

      const payload = {
        platforms: post.platforms,
        content: post.content,
        media_urls: post.mediaUrls || [],
        content_type: post.contentType,
        scheduled_at: post.scheduledAt?.toISOString(),
        company_id: post.companyId,
        created_by: post.createdBy,
      };

      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info(`Post created in Pomelli: ${data.post_id}`);

      return data.post_id;
    } catch (error) {
      logger.error('Error creating post in Pomelli:', error);
      throw error;
    }
  }

  /**
   * Actualizar publicación
   */
  async updatePost(
    postId: string,
    updates: Partial<Pick<SocialPost, 'content' | 'mediaUrls' | 'scheduledAt'>>
  ): Promise<void> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: updates.content,
          media_urls: updates.mediaUrls,
          scheduled_at: updates.scheduledAt?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update post: ${response.statusText}`);
      }

      logger.info(`Post ${postId} updated successfully`);
    } catch (error) {
      logger.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * Eliminar publicación
   */
  async deletePost(postId: string): Promise<void> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.statusText}`);
      }

      logger.info(`Post ${postId} deleted successfully`);
    } catch (error) {
      logger.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Obtener analytics de publicación
   */
  async getPostAnalytics(postId: string): Promise<PostAnalytics> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/posts/${postId}/analytics`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get analytics: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        impressions: data.impressions || 0,
        reach: data.reach || 0,
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        clicks: data.clicks || 0,
        engagement_rate: data.engagement_rate || 0,
        lastUpdatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      logger.error('Error getting post analytics:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de perfiles conectados
   */
  async getConnectedProfiles(): Promise<SocialProfile[]> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/profiles`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get profiles: ${response.statusText}`);
      }

      const data = await response.json();

      return data.profiles.map((profile: any) => ({
        id: profile.id,
        platform: profile.platform,
        profileId: profile.profile_id,
        profileName: profile.profile_name,
        profileUsername: profile.username,
        profileUrl: profile.profile_url,
        isActive: profile.is_active,
        isConnected: profile.is_connected,
        lastSyncAt: new Date(profile.last_sync_at),
        metadata: profile.metadata,
      }));
    } catch (error) {
      logger.error('Error getting connected profiles:', error);
      throw error;
    }
  }

  /**
   * Publicar inmediatamente (sin programar)
   */
  async publishNow(postId: string): Promise<void> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/posts/${postId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to publish post: ${response.statusText}`);
      }

      logger.info(`Post ${postId} published immediately`);
    } catch (error) {
      logger.error('Error publishing post:', error);
      throw error;
    }
  }

  /**
   * Subir media (imagen/video)
   */
  async uploadMedia(file: File): Promise<string> {
    try {
      const token = await this.authenticate();

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload media: ${response.statusText}`);
      }

      const data = await response.json();
      return data.media_url;
    } catch (error) {
      logger.error('Error uploading media:', error);
      throw error;
    }
  }

  /**
   * Obtener URL de autorización para conectar red social
   */
  async getAuthorizationUrl(platform: SocialPlatform, redirectUri: string): Promise<string> {
    try {
      const token = await this.authenticate();

      const response = await fetch(`${this.baseUrl}/auth/authorize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get authorization URL: ${response.statusText}`);
      }

      const data = await response.json();
      return data.authorization_url;
    } catch (error) {
      logger.error('Error getting authorization URL:', error);
      throw error;
    }
  }
}

// ============================================================================
// POMELLI SERVICE (Database + API)
// ============================================================================

export class PomelliService {
  private client: PomelliClient;

  constructor(config: PomelliConfig) {
    this.client = new PomelliClient(config);
  }

  /**
   * Inicializar perfiles de redes sociales para una empresa
   */
  async initializeSocialProfiles(companyId: string): Promise<{
    linkedin: string | null;
    instagram: string | null;
    x: string | null;
  }> {
    try {
      // URLs de autorización para cada plataforma
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://inmova.app';

      const linkedinUrl = await this.client.getAuthorizationUrl(
        'linkedin',
        `${baseUrl}/api/pomelli/callback/linkedin?company=${companyId}`
      );

      const instagramUrl = await this.client.getAuthorizationUrl(
        'instagram',
        `${baseUrl}/api/pomelli/callback/instagram?company=${companyId}`
      );

      const xUrl = await this.client.getAuthorizationUrl(
        'x',
        `${baseUrl}/api/pomelli/callback/x?company=${companyId}`
      );

      return {
        linkedin: linkedinUrl,
        instagram: instagramUrl,
        x: xUrl,
      };
    } catch (error) {
      logger.error('Error initializing social profiles:', error);
      throw error;
    }
  }

  /**
   * Conectar perfil después de autorización OAuth
   */
  async handleOAuthCallback(
    platform: SocialPlatform,
    authCode: string,
    companyId: string
  ): Promise<SocialProfile> {
    try {
      const profile = await this.client.connectSocialProfile(platform, authCode);

      // TODO: Guardar en base de datos (Prisma)
      // await prisma.socialProfile.create({ ... })

      logger.info(`${platform} profile connected for company ${companyId}`);
      return profile;
    } catch (error) {
      logger.error(`Error handling OAuth callback for ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Crear y programar publicación multi-plataforma
   */
  async createMultiPlatformPost(
    post: Omit<SocialPost, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<SocialPost> {
    try {
      // Crear post en Pomelli
      const pomelliPostId = await this.client.createPost(post);

      // TODO: Guardar en base de datos
      const savedPost: SocialPost = {
        id: crypto.randomUUID(),
        ...post,
        pomelliPostId,
        status: post.scheduledAt ? 'scheduled' : 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.info(`Multi-platform post created: ${savedPost.id}`);
      return savedPost;
    } catch (error) {
      logger.error('Error creating multi-platform post:', error);
      throw error;
    }
  }

  /**
   * Obtener analytics consolidados de todas las plataformas
   */
  async getConsolidatedAnalytics(
    companyId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<Record<SocialPlatform, PostAnalytics>> {
    try {
      // TODO: Implementar lógica de analytics consolidados
      const analytics: Record<SocialPlatform, PostAnalytics> = {
        linkedin: {
          impressions: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          engagement_rate: 0,
          lastUpdatedAt: new Date(),
        },
        instagram: {
          impressions: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          engagement_rate: 0,
          lastUpdatedAt: new Date(),
        },
        x: {
          impressions: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          engagement_rate: 0,
          lastUpdatedAt: new Date(),
        },
        facebook: {
          impressions: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          engagement_rate: 0,
          lastUpdatedAt: new Date(),
        },
      };

      return analytics;
    } catch (error) {
      logger.error('Error getting consolidated analytics:', error);
      throw error;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validar credenciales de Pomelli
 */
export async function validatePomelliCredentials(
  apiKey: string,
  apiSecret: string
): Promise<boolean> {
  try {
    const client = new PomelliClient({
      apiKey,
      apiSecret,
      enabled: true,
    });

    // Intentar autenticar
    await client.getConnectedProfiles();
    return true;
  } catch (error) {
    logger.error('Invalid Pomelli credentials:', error);
    return false;
  }
}

/**
 * Obtener configuración de Pomelli desde variables de entorno
 */
export function getPomelliConfig(): PomelliConfig | null {
  const apiKey = process.env.POMELLI_API_KEY;
  const apiSecret = process.env.POMELLI_API_SECRET;
  const webhookUrl = process.env.POMELLI_WEBHOOK_URL;

  if (!apiKey || !apiSecret) {
    logger.warn('Pomelli credentials not configured');
    return null;
  }

  return {
    apiKey,
    apiSecret,
    webhookUrl,
    enabled: true,
  };
}

/**
 * Obtener instancia de PomelliService
 */
export function getPomelliService(): PomelliService | null {
  const config = getPomelliConfig();

  if (!config) {
    return null;
  }

  return new PomelliService(config);
}

/**
 * Formatear texto para redes sociales (límites de caracteres)
 */
export function formatPostContent(content: string, platform: SocialPlatform): string {
  const limits: Record<SocialPlatform, number> = {
    linkedin: 3000,
    instagram: 2200,
    x: 280,
    facebook: 63206,
  };

  const maxLength = limits[platform];

  if (content.length <= maxLength) {
    return content;
  }

  return content.substring(0, maxLength - 3) + '...';
}

/**
 * Generar hashtags relevantes
 */
export function generateHashtags(content: string, maxHashtags: number = 10): string[] {
  // TODO: Implementar lógica de generación de hashtags con IA
  const defaultHashtags = [
    '#PropTech',
    '#RealEstate',
    '#PropertyManagement',
    '#INMOVA',
    '#SmartBuildings',
  ];

  return defaultHashtags.slice(0, maxHashtags);
}
