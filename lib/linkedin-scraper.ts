/**
 * 🔍 LinkedIn Scraper - Extracción Inteligente de Leads
 *
 * ⚠️ IMPORTANTE - Consideraciones Legales:
 * - LinkedIn ToS prohíbe scraping automatizado
 * - Esta implementación es SOLO para fines educativos
 * - Producción: Usar LinkedIn Sales Navigator API (oficial)
 * - Alternativa: Importación manual de datos públicos
 * - GDPR: Requiere consentimiento explícito
 *
 * Funcionalidades:
 * - Búsqueda avanzada por cargo, ubicación, industria
 * - Extracción de datos de perfil público
 * - Rate limiting y anti-detección
 * - Parsing inteligente de información
 * - Almacenamiento en CRM
 */

import { PrismaClient } from '@prisma/client';
import type { CompanySize, CRMLeadSource } from '@prisma/client';
import puppeteer, { type Browser, type Page } from 'puppeteer';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  // Rate limiting
  MIN_DELAY: 3000, // 3 segundos entre requests
  MAX_DELAY: 8000, // 8 segundos
  MAX_PROFILES_PER_SESSION: 50, // Límite por sesión

  // User agent rotation
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ],

  // Timeouts
  PAGE_LOAD_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 60000,
};

// ============================================================================
// TIPOS
// ============================================================================

export interface LinkedInSearchQuery {
  keywords?: string; // "Property Manager" OR "Gestor Inmobiliario"
  location?: string; // "Madrid, España"
  title?: string[]; // ["Property Manager", "Gestor de Propiedades"]
  company?: string;
  industry?: string[];
  companySize?: CompanySize[];
  firstName?: string;
  lastName?: string;
}

export interface LinkedInProfile {
  firstName: string;
  lastName: string;
  headline?: string; // Job title
  location?: string;
  profileUrl: string;

  // Datos adicionales
  companyName?: string;
  companyIndustry?: string;
  companySize?: CompanySize;
  about?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration?: string;
    current: boolean;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
  }>;
  skills?: string[];
  connectionCount?: number;

  // Contact info (raramente disponible públicamente)
  email?: string;
  phone?: string;
  website?: string;
}

export interface ScrapingJobResult {
  success: boolean;
  profilesFound: number;
  profilesImported: number;
  profiles: LinkedInProfile[];
  errors?: string[];
}

// ============================================================================
// LINKEDIN SCRAPER
// ============================================================================

export class LinkedInScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isAuthenticated = false;

  /**
   * Inicializar navegador
   */
  async initialize() {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: true, // Cambiar a false para debug
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--user-agent=' + this.getRandomUserAgent(),
      ],
    });

    this.page = await this.browser.newPage();

    // Configurar timeouts
    await this.page.setDefaultNavigationTimeout(CONFIG.NAVIGATION_TIMEOUT);
    await this.page.setDefaultTimeout(CONFIG.PAGE_LOAD_TIMEOUT);

    // Interceptar requests para bloquear imágenes/videos (más rápido)
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'media', 'font'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  /**
   * Cerrar navegador
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * User agent aleatorio
   */
  private getRandomUserAgent(): string {
    return CONFIG.USER_AGENTS[Math.floor(Math.random() * CONFIG.USER_AGENTS.length)];
  }

  /**
   * Delay aleatorio (anti-detección)
   */
  private async randomDelay() {
    const delay = Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY) + CONFIG.MIN_DELAY;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * ⚠️ Autenticación en LinkedIn
   *
   * NOTA: Requiere credenciales válidas
   * Alternativa: Usar LinkedIn OAuth para login oficial
   */
  async authenticate(email: string, password: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.goto('https://www.linkedin.com/login', {
        waitUntil: 'networkidle2',
      });

      await this.page.type('#username', email);
      await this.page.type('#password', password);
      await this.page.click('button[type="submit"]');

      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Verificar si el login fue exitoso
      const url = this.page.url();
      this.isAuthenticated = url.includes('feed') || url.includes('mynetwork');

      return this.isAuthenticated;
    } catch (error) {
      console.error('LinkedIn authentication failed:', error);
      return false;
    }
  }

  /**
   * Buscar perfiles en LinkedIn
   */
  async searchProfiles(query: LinkedInSearchQuery): Promise<LinkedInProfile[]> {
    if (!this.page || !this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const profiles: LinkedInProfile[] = [];

    try {
      // Construir URL de búsqueda
      const searchUrl = this.buildSearchUrl(query);
      console.log('Searching:', searchUrl);

      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await this.randomDelay();

      // Esperar resultados
      await this.page
        .waitForSelector('.search-results-container', {
          timeout: 10000,
        })
        .catch(() => {
          console.log('No search results container found');
        });

      // Scroll para cargar más resultados
      await this.scrollPage();

      // Extraer URLs de perfiles
      const profileUrls = await this.page.$$eval('a.app-aware-link[href*="/in/"]', (links) => {
        const urls = new Set<string>();
        links.forEach((link) => {
          const href = link.getAttribute('href');
          if (href?.includes('/in/')) {
            // Limpiar URL
            const url = href.split('?')[0];
            urls.add(url);
          }
        });
        return Array.from(urls);
      });

      console.log(`Found ${profileUrls.length} profile URLs`);

      // Limitar número de perfiles
      const limitedUrls = profileUrls.slice(0, CONFIG.MAX_PROFILES_PER_SESSION);

      // Extraer datos de cada perfil
      for (const url of limitedUrls) {
        try {
          const profile = await this.extractProfileData(url);
          if (profile) {
            profiles.push(profile);
          }
          await this.randomDelay();
        } catch (error) {
          console.error(`Error extracting profile ${url}:`, error);
        }
      }

      return profiles;
    } catch (error) {
      console.error('Search error:', error);
      return profiles;
    }
  }

  /**
   * Construir URL de búsqueda
   */
  private buildSearchUrl(query: LinkedInSearchQuery): string {
    const baseUrl = 'https://www.linkedin.com/search/results/people/';
    const params = new URLSearchParams();

    if (query.keywords) {
      params.append('keywords', query.keywords);
    }

    if (query.location) {
      params.append('geoUrn', query.location);
    }

    if (query.title?.length) {
      params.append('title', query.title.join(' OR '));
    }

    if (query.company) {
      params.append('company', query.company);
    }

    return baseUrl + '?' + params.toString();
  }

  /**
   * Scroll progresivo en la página
   */
  private async scrollPage() {
    if (!this.page) return;

    await this.page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
  }

  /**
   * Extraer datos de un perfil
   */
  private async extractProfileData(profileUrl: string): Promise<LinkedInProfile | null> {
    if (!this.page) return null;

    try {
      // Asegurar URL completa
      const fullUrl = profileUrl.startsWith('http')
        ? profileUrl
        : `https://www.linkedin.com${profileUrl}`;

      await this.page.goto(fullUrl, { waitUntil: 'networkidle2' });
      await this.randomDelay();

      // Extraer datos del perfil
      const profile = await this.page.evaluate((url) => {
        const getText = (selector: string): string | undefined => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim();
        };

        // Nombre
        const fullName = getText('h1.text-heading-xlarge') || '';
        const [firstName = '', ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');

        // Headline (cargo)
        const headline = getText('.text-body-medium.break-words');

        // Ubicación
        const location = getText('.text-body-small.inline.t-black--light.break-words');

        // Empresa actual
        const companyElement = document.querySelector('.experience-item__subtitle');
        const companyName = companyElement?.textContent?.trim();

        // About
        const about = getText('#about + * .inline-show-more-text');

        return {
          firstName,
          lastName,
          headline,
          location,
          profileUrl: url,
          companyName,
          about,
        };
      }, fullUrl);

      return profile.firstName ? (profile as LinkedInProfile) : null;
    } catch (error) {
      console.error(`Error extracting profile ${profileUrl}:`, error);
      return null;
    }
  }

  /**
   * Parsear tamaño de empresa desde LinkedIn
   */
  static parseCompanySize(sizeText?: string): CompanySize | undefined {
    if (!sizeText) return undefined;

    const size = sizeText.toLowerCase();

    if (size.includes('1-10') || size.includes('self-employed')) {
      return 'micro';
    } else if (size.includes('11-50')) {
      return 'small';
    } else if (size.includes('51-200') || size.includes('51-250')) {
      return 'medium';
    } else if (size.includes('201-500') || size.includes('251-1000')) {
      return 'large';
    } else if (size.includes('500+') || size.includes('1000+')) {
      return 'enterprise';
    }

    return undefined;
  }
}

// ============================================================================
// SCRAPING JOB MANAGER
// ============================================================================

export class LinkedInScrapingJobManager {
  /**
   * Crear nuevo job de scraping
   */
  static async createJob(companyId: string, searchQuery: LinkedInSearchQuery, targetCount = 100) {
    return await prisma.linkedInScrapingJob.create({
      data: {
        companyId,
        searchQuery: JSON.stringify(searchQuery),
        filters: searchQuery as any,
        targetCount,
        status: 'pending',
      },
    });
  }

  /**
   * Ejecutar job de scraping
   */
  static async executeJob(
    jobId: string,
    linkedInEmail: string,
    linkedInPassword: string
  ): Promise<ScrapingJobResult> {
    // Obtener job
    const job = await prisma.linkedInScrapingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Marcar como running
    await prisma.linkedInScrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });

    const scraper = new LinkedInScraper();
    const errors: string[] = [];
    let profiles: LinkedInProfile[] = [];

    try {
      // Inicializar
      await scraper.initialize();

      // Autenticar
      const authenticated = await scraper.authenticate(linkedInEmail, linkedInPassword);

      if (!authenticated) {
        throw new Error('LinkedIn authentication failed');
      }

      // Buscar perfiles
      const query = JSON.parse(job.searchQuery) as LinkedInSearchQuery;
      profiles = await scraper.searchProfiles(query);

      // Actualizar job con resultados
      await prisma.linkedInScrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          leadsFound: profiles.length,
          results: profiles as any,
        },
      });

      return {
        success: true,
        profilesFound: profiles.length,
        profilesImported: 0, // Se importan en otro paso
        profiles,
      };
    } catch (error: any) {
      errors.push(error.message);

      // Marcar como fallido
      await prisma.linkedInScrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      return {
        success: false,
        profilesFound: 0,
        profilesImported: 0,
        profiles: [],
        errors,
      };
    } finally {
      await scraper.close();
    }
  }

  /**
   * Obtener estado del job
   */
  static async getJobStatus(jobId: string) {
    return await prisma.linkedInScrapingJob.findUnique({
      where: { id: jobId },
    });
  }

  /**
   * Listar jobs
   */
  static async listJobs(companyId: string) {
    return await prisma.linkedInScrapingJob.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// ============================================================================
// ALTERNATIVA SEGURA: MANUAL IMPORT
// ============================================================================

/**
 * ✅ Alternativa Legal: Importación Manual
 *
 * En lugar de scraping, permitir que el usuario:
 * 1. Exporte sus conexiones de LinkedIn manualmente (CSV)
 * 2. Suba el CSV a INMOVA
 * 3. Mapee los campos automáticamente
 * 4. Importe los leads al CRM
 *
 * Esto cumple con LinkedIn ToS y GDPR
 */
export interface CSVImportField {
  csvColumn: string;
  crmField: string;
}

export class ManualLinkedInImporter {
  /**
   * Parsear CSV de LinkedIn
   */
  static parseLinkedInCSV(csvContent: string): any[] {
    // Implementar parser CSV
    // LinkedIn export format: First Name, Last Name, Email Address, Company, Position, etc.

    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: any = {};

      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim();
      });

      data.push(row);
    }

    return data;
  }

  /**
   * Mapear CSV a formato CRM
   */
  static mapCSVToCRM(csvData: any[], mapping: CSVImportField[]): any[] {
    return csvData.map((row) => {
      const lead: any = {};

      mapping.forEach((map) => {
        lead[map.crmField] = row[map.csvColumn];
      });

      return lead;
    });
  }
}

export default LinkedInScraper;
