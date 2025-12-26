/**
 * FACEBOOK BUSINESS INTEGRATION SERVICE
 * Gestión de páginas de Facebook y publicación de contenido
 * Complemento a Pomelli para redes sociales
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FacebookConfig {
  appId: string;
  appSecret: string;
  accessToken?: string;
  pageId?: string;
  enabled: boolean;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  followers: number;
  likes: number;
  about?: string;
  website?: string;
  phone?: string;
  email?: string;
  coverPhoto?: string;
  profilePicture?: string;
}

export interface FacebookPost {
  id?: string;
  message: string;
  link?: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledTime?: Date;
  published?: boolean;
}

export interface FacebookPostResult {
  id: string;
  postId: string;
  createdTime: Date;
}

export interface FacebookInsights {
  pageId: string;
  date: Date;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  pageViews: number;
}

// ============================================================================
// FACEBOOK CLIENT
// ============================================================================

export class FacebookClient {
  private appId: string;
  private appSecret: string;
  private accessToken?: string;
  private pageId?: string;
  private baseUrl: string = 'https://graph.facebook.com/v18.0';

  constructor(config: FacebookConfig) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.accessToken = config.accessToken;
    this.pageId = config.pageId;
  }

  /**
   * Obtener long-lived access token
   */
  async getLongLivedToken(shortToken: string): Promise<string> {
    try {
      const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: shortToken,
      });

      const response = await fetch(`${this.baseUrl}/oauth/access_token?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get long-lived token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      logger.info('Long-lived access token obtained');

      return data.access_token;
    } catch (error) {
      logger.error('Error getting long-lived token:', error);
      throw error;
    }
  }

  /**
   * Obtener páginas del usuario
   */
  async getPages(): Promise<FacebookPage[]> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${this.baseUrl}/me/accounts?access_token=${this.accessToken}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get pages: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.data?.length || 0} Facebook pages`);

      return (data.data || []).map((page: any) => this.mapPage(page));
    } catch (error) {
      logger.error('Error getting Facebook pages:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de una página
   */
  async getPage(pageId: string): Promise<FacebookPage> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const fields = 'id,name,category,fan_count,likes,about,website,phone,emails,cover,picture';

      const response = await fetch(
        `${this.baseUrl}/${pageId}?fields=${fields}&access_token=${this.accessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to get page: ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapPage(data);
    } catch (error) {
      logger.error('Error getting Facebook page:', error);
      throw error;
    }
  }

  /**
   * Mapear página de Facebook
   */
  private mapPage(page: any): FacebookPage {
    return {
      id: page.id,
      name: page.name || '',
      category: page.category || '',
      followers: page.fan_count || page.followers_count || 0,
      likes: page.likes || 0,
      about: page.about,
      website: page.website,
      phone: page.phone,
      email: page.emails?.[0],
      coverPhoto: page.cover?.source,
      profilePicture: page.picture?.data?.url,
    };
  }

  /**
   * Publicar en la página
   */
  async createPost(post: FacebookPost): Promise<FacebookPostResult> {
    try {
      if (!this.accessToken || !this.pageId) {
        throw new Error('No access token or page ID available');
      }

      const formData = new URLSearchParams();
      formData.append('message', post.message);
      formData.append('access_token', this.accessToken);

      if (post.link) {
        formData.append('link', post.link);
      }

      if (post.scheduledTime) {
        formData.append('published', 'false');
        formData.append(
          'scheduled_publish_time',
          Math.floor(post.scheduledTime.getTime() / 1000).toString()
        );
      }

      // Si hay imagen, usar endpoint de fotos
      let endpoint = `${this.baseUrl}/${this.pageId}/feed`;
      if (post.imageUrl) {
        endpoint = `${this.baseUrl}/${this.pageId}/photos`;
        formData.append('url', post.imageUrl);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create post: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Facebook post created: ${data.id}`);

      return {
        id: data.id,
        postId: data.post_id || data.id,
        createdTime: new Date(),
      };
    } catch (error) {
      logger.error('Error creating Facebook post:', error);
      throw error;
    }
  }

  /**
   * Eliminar post
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${this.baseUrl}/${postId}?access_token=${this.accessToken}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.statusText}`);
      }

      logger.info(`Facebook post deleted: ${postId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting Facebook post:', error);
      return false;
    }
  }

  /**
   * Obtener insights de la página
   */
  async getPageInsights(params: { startDate: Date; endDate: Date }): Promise<FacebookInsights[]> {
    try {
      if (!this.accessToken || !this.pageId) {
        throw new Error('No access token or page ID available');
      }

      const metrics = [
        'page_impressions',
        'page_reach',
        'page_engaged_users',
        'page_post_engagements',
        'page_fans',
        'page_views_total',
      ];

      const since = Math.floor(params.startDate.getTime() / 1000);
      const until = Math.floor(params.endDate.getTime() / 1000);

      const response = await fetch(
        `${this.baseUrl}/${this.pageId}/insights?metric=${metrics.join(',')}&period=day&since=${since}&until=${until}&access_token=${this.accessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to get insights: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved Facebook insights for page ${this.pageId}`);

      // Procesar métricas por día
      return this.processInsights(data.data || []);
    } catch (error) {
      logger.error('Error getting Facebook insights:', error);
      return [];
    }
  }

  /**
   * Procesar insights en formato estructurado
   */
  private processInsights(metrics: any[]): FacebookInsights[] {
    const insightsByDate: Record<string, Partial<FacebookInsights>> = {};

    metrics.forEach((metric) => {
      const values = metric.values || [];
      values.forEach((value: any) => {
        const date = value.end_time.split('T')[0];

        if (!insightsByDate[date]) {
          insightsByDate[date] = {
            pageId: this.pageId!,
            date: new Date(date),
            impressions: 0,
            reach: 0,
            engagement: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            followers: 0,
            pageViews: 0,
          };
        }

        switch (metric.name) {
          case 'page_impressions':
            insightsByDate[date].impressions = value.value;
            break;
          case 'page_reach':
            insightsByDate[date].reach = value.value;
            break;
          case 'page_engaged_users':
            insightsByDate[date].engagement = value.value;
            break;
          case 'page_fans':
            insightsByDate[date].followers = value.value;
            break;
          case 'page_views_total':
            insightsByDate[date].pageViews = value.value;
            break;
        }
      });
    });

    return Object.values(insightsByDate) as FacebookInsights[];
  }

  /**
   * Obtener posts de la página
   */
  async getPosts(limit: number = 25): Promise<any[]> {
    try {
      if (!this.accessToken || !this.pageId) {
        throw new Error('No access token or page ID available');
      }

      const fields =
        'id,message,created_time,permalink_url,full_picture,likes.summary(true),comments.summary(true),shares';

      const response = await fetch(
        `${this.baseUrl}/${this.pageId}/posts?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to get posts: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`Retrieved ${data.data?.length || 0} Facebook posts`);

      return data.data || [];
    } catch (error) {
      logger.error('Error getting Facebook posts:', error);
      return [];
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isFacebookConfigured(config?: FacebookConfig | null): boolean {
  if (!config) return false;
  return !!(config.appId && config.appSecret && config.enabled);
}

export function getFacebookClient(config?: FacebookConfig): FacebookClient | null {
  if (!config || !isFacebookConfigured(config)) {
    return null;
  }

  return new FacebookClient(config);
}

/**
 * Generar URL de autorización OAuth
 */
export function getFacebookAuthUrl(appId: string, redirectUri: string, state: string): string {
  const permissions = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_read_user_content',
    'read_insights',
  ];

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: permissions.join(','),
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
}
