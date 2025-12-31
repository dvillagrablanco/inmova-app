/**
 * 📥 CRM Lead Importer - Importación Masiva de Leads
 *
 * Funcionalidades:
 * - Importar desde LinkedIn (scraping job results)
 * - Importar desde CSV manual
 * - Deduplicación inteligente
 * - Enriquecimiento de datos
 * - Lead scoring automático
 * - Asignación automática (round-robin)
 * - Validación de datos
 */

import type { CompanySize, CRMLeadSource } from '@prisma/client';
import { prisma } from '@/lib/db';
import { CRMService, calculateLeadScore } from './crm-service';
import type { LinkedInProfile } from './linkedin-scraper';

// ============================================================================
// TIPOS
// ============================================================================

export interface ImportLeadData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyName: string;
  companyWebsite?: string;
  companySize?: CompanySize;
  industry?: string;
  city?: string;
  region?: string;
  country?: string;
  linkedInUrl?: string;
  linkedInProfile?: any;
  notes?: string;
  tags?: string[];
}

export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  imported: number;
  skipped: number;
  errors: number;
  details: {
    imported: Array<{ email?: string; name: string; leadId: string }>;
    skipped: Array<{ email?: string; name: string; reason: string }>;
    errors: Array<{ email?: string; name: string; error: string }>;
  };
}

export interface ImportOptions {
  source: CRMLeadSource;
  ownerId?: string;
  assignRoundRobin?: boolean;
  deduplicateBy?: 'email' | 'linkedIn' | 'both';
  autoScore?: boolean;
  tags?: string[];
}

// ============================================================================
// LEAD IMPORTER
// ============================================================================

export class CRMLeadImporter {
  /**
   * Importar leads desde LinkedIn scraping job
   */
  static async importFromLinkedInJob(
    jobId: string,
    companyId: string,
    options: ImportOptions
  ): Promise<ImportResult> {
    // Obtener job results
    const job = await prisma.linkedInScrapingJob.findFirst({
      where: {
        id: jobId,
        companyId,
      },
    });

    if (!job) {
      throw new Error('Scraping job not found');
    }

    if (job.status !== 'completed') {
      throw new Error('Job not completed yet');
    }

    const profiles = (job.results as any as LinkedInProfile[]) || [];

    // Convertir perfiles de LinkedIn a formato importación
    const leadsData: ImportLeadData[] = profiles.map((profile) => ({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      jobTitle: profile.headline,
      companyName: profile.companyName || 'Unknown',
      companyWebsite: profile.website,
      companySize: profile.companySize,
      industry: profile.companyIndustry,
      city: this.parseCity(profile.location),
      region: this.parseRegion(profile.location),
      country: 'ES',
      linkedInUrl: profile.profileUrl,
      linkedInProfile: profile,
      notes: profile.about,
    }));

    // Importar
    const result = await this.importLeads(companyId, leadsData, {
      ...options,
      source: 'linkedin',
    });

    // Actualizar job con estadísticas de importación
    await prisma.linkedInScrapingJob.update({
      where: { id: jobId },
      data: {
        leadsImported: result.imported,
      },
    });

    return result;
  }

  /**
   * Importar leads desde CSV
   */
  static async importFromCSV(
    companyId: string,
    csvData: ImportLeadData[],
    options: ImportOptions
  ): Promise<ImportResult> {
    return await this.importLeads(companyId, csvData, options);
  }

  /**
   * Importar leads (método principal)
   */
  static async importLeads(
    companyId: string,
    leadsData: ImportLeadData[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalProcessed: leadsData.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      details: {
        imported: [],
        skipped: [],
        errors: [],
      },
    };

    // Obtener usuarios de la empresa para asignación round-robin
    let assignableUsers: string[] = [];
    if (options.assignRoundRobin) {
      const users = await prisma.user.findMany({
        where: {
          companyId,
          role: {
            in: ['administrador', 'usuario'],
          },
        },
        select: { id: true },
      });
      assignableUsers = users.map((u) => u.id);
    }

    let currentUserIndex = 0;

    // Procesar cada lead
    for (const leadData of leadsData) {
      try {
        // Validar datos mínimos
        const validationError = this.validateLeadData(leadData);
        if (validationError) {
          result.skipped++;
          result.details.skipped.push({
            email: leadData.email,
            name: `${leadData.firstName} ${leadData.lastName}`,
            reason: validationError,
          });
          continue;
        }

        // Verificar duplicados
        const isDuplicate = await this.checkDuplicate(
          companyId,
          leadData,
          options.deduplicateBy || 'email'
        );

        if (isDuplicate) {
          result.skipped++;
          result.details.skipped.push({
            email: leadData.email,
            name: `${leadData.firstName} ${leadData.lastName}`,
            reason: 'Duplicate lead',
          });
          continue;
        }

        // Determinar owner (asignación)
        let ownerId = options.ownerId;
        if (options.assignRoundRobin && assignableUsers.length > 0) {
          ownerId = assignableUsers[currentUserIndex % assignableUsers.length];
          currentUserIndex++;
        }

        // Crear lead
        const lead = await CRMService.createLead({
          companyId,
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          email: leadData.email || '',
          phone: leadData.phone,
          jobTitle: leadData.jobTitle,
          companyName: leadData.companyName,
          companyWebsite: leadData.companyWebsite,
          companySize: leadData.companySize,
          industry: leadData.industry,
          city: leadData.city,
          region: leadData.region,
          country: leadData.country || 'ES',
          source: options.source,
          ownerId,
          notes: leadData.notes,
          tags: [...(leadData.tags || []), ...(options.tags || [])],
          linkedInUrl: leadData.linkedInUrl,
          linkedInProfile: leadData.linkedInProfile,
        });

        result.imported++;
        result.details.imported.push({
          email: lead.email,
          name: `${lead.firstName} ${lead.lastName}`,
          leadId: lead.id,
        });
      } catch (error: any) {
        result.errors++;
        result.details.errors.push({
          email: leadData.email,
          name: `${leadData.firstName} ${leadData.lastName}`,
          error: error.message,
        });
      }
    }

    result.success = result.imported > 0;

    return result;
  }

  /**
   * Validar datos del lead
   */
  private static validateLeadData(leadData: ImportLeadData): string | null {
    if (!leadData.firstName || !leadData.lastName) {
      return 'Missing first or last name';
    }

    if (!leadData.companyName) {
      return 'Missing company name';
    }

    // Email o LinkedIn URL es requerido para evitar duplicados
    if (!leadData.email && !leadData.linkedInUrl) {
      return 'Missing email or LinkedIn URL';
    }

    // Validar email format si existe
    if (leadData.email && !this.isValidEmail(leadData.email)) {
      return 'Invalid email format';
    }

    return null;
  }

  /**
   * Validar formato de email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Verificar duplicados
   */
  private static async checkDuplicate(
    companyId: string,
    leadData: ImportLeadData,
    deduplicateBy: 'email' | 'linkedIn' | 'both'
  ): Promise<boolean> {
    const conditions: any[] = [{ companyId }];

    if (deduplicateBy === 'email' || deduplicateBy === 'both') {
      if (leadData.email) {
        conditions.push({ email: leadData.email });
      }
    }

    if (deduplicateBy === 'linkedIn' || deduplicateBy === 'both') {
      if (leadData.linkedInUrl) {
        conditions.push({ linkedInUrl: leadData.linkedInUrl });
      }
    }

    if (conditions.length === 1) {
      // Solo companyId, no hay forma de verificar duplicados
      return false;
    }

    const existing = await prisma.cRMLead.findFirst({
      where: {
        AND: [
          { companyId },
          {
            OR: conditions.slice(1), // Excluir el primer elemento (companyId)
          },
        ],
      },
    });

    return !!existing;
  }

  /**
   * Parsear ciudad desde location string
   */
  private static parseCity(location?: string): string | undefined {
    if (!location) return undefined;

    // Formato típico: "Madrid, Comunidad de Madrid, España"
    const parts = location.split(',');
    return parts[0]?.trim();
  }

  /**
   * Parsear región desde location string
   */
  private static parseRegion(location?: string): string | undefined {
    if (!location) return undefined;

    // Formato típico: "Madrid, Comunidad de Madrid, España"
    const parts = location.split(',');
    return parts[1]?.trim();
  }

  /**
   * Enriquecer datos de lead (API externa opcional)
   */
  static async enrichLeadData(leadData: ImportLeadData): Promise<ImportLeadData> {
    // TODO: Integrar con servicios de enriquecimiento de datos:
    // - Clearbit
    // - Hunter.io (email finder)
    // - FullContact
    // - ZoomInfo
    // - Lusha

    // Por ahora, retornar datos sin cambios
    return leadData;
  }

  /**
   * Importar leads desde INMOVA clientes objetivo predefinidos
   */
  static async importTargetClients(companyId: string): Promise<ImportResult> {
    // Clientes objetivo de INMOVA basados en el plan de negocio
    const targetClients: ImportLeadData[] = [
      // Segmento 1: Property Managers Madrid
      {
        firstName: 'María',
        lastName: 'García',
        email: 'maria.garcia@ejemplo.es',
        jobTitle: 'Property Manager',
        companyName: 'Madrid Propiedades SL',
        companySize: 'small',
        industry: 'Real Estate',
        city: 'Madrid',
        region: 'Comunidad de Madrid',
        country: 'ES',
        tags: ['property_manager', 'madrid', 'target'],
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@ejemplo.es',
        jobTitle: 'Director de Operaciones',
        companyName: 'Gestión Inmobiliaria Barcelona',
        companySize: 'medium',
        industry: 'Real Estate',
        city: 'Barcelona',
        region: 'Cataluña',
        country: 'ES',
        tags: ['operations', 'barcelona', 'target'],
      },
      // Segmento 2: Administradores de Fincas
      {
        firstName: 'Ana',
        lastName: 'Martínez',
        email: 'ana.martinez@ejemplo.es',
        jobTitle: 'Administradora de Fincas',
        companyName: 'Administraciones ABC',
        companySize: 'small',
        industry: 'Property Management',
        city: 'Valencia',
        region: 'Comunidad Valenciana',
        country: 'ES',
        tags: ['admin_fincas', 'valencia', 'target'],
      },
      // Segmento 3: Alquileres Vacacionales
      {
        firstName: 'Jorge',
        lastName: 'López',
        email: 'jorge.lopez@ejemplo.es',
        jobTitle: 'Revenue Manager',
        companyName: 'Vacation Rentals Costa del Sol',
        companySize: 'medium',
        industry: 'Vacation Rentals',
        city: 'Málaga',
        region: 'Andalucía',
        country: 'ES',
        tags: ['revenue_manager', 'malaga', 'str', 'target'],
      },
      {
        firstName: 'Laura',
        lastName: 'Fernández',
        email: 'laura.fernandez@ejemplo.es',
        jobTitle: 'Channel Manager',
        companyName: 'Airbnb Properties Management',
        companySize: 'small',
        industry: 'Vacation Rentals',
        city: 'Sevilla',
        region: 'Andalucía',
        country: 'ES',
        tags: ['channel_manager', 'sevilla', 'str', 'target'],
      },
      // Segmento 4: Coliving & Coworking
      {
        firstName: 'David',
        lastName: 'Sánchez',
        email: 'david.sanchez@ejemplo.es',
        jobTitle: 'Community Manager',
        companyName: 'Urban Coliving Madrid',
        companySize: 'small',
        industry: 'Coliving',
        city: 'Madrid',
        region: 'Comunidad de Madrid',
        country: 'ES',
        tags: ['coliving', 'community_manager', 'madrid', 'target'],
      },
      // Fundadores Proptech
      {
        firstName: 'Elena',
        lastName: 'Torres',
        email: 'elena.torres@ejemplo.es',
        jobTitle: 'CEO & Founder',
        companyName: 'PropTech Innovations',
        companySize: 'micro',
        industry: 'Real Estate Technology',
        city: 'Barcelona',
        region: 'Cataluña',
        country: 'ES',
        tags: ['founder', 'proptech', 'barcelona', 'innovator', 'target'],
      },
      {
        firstName: 'Miguel',
        lastName: 'Ruiz',
        email: 'miguel.ruiz@ejemplo.es',
        jobTitle: 'Co-founder & CTO',
        companyName: 'Smart Buildings Tech',
        companySize: 'micro',
        industry: 'Real Estate Technology',
        city: 'Madrid',
        region: 'Comunidad de Madrid',
        country: 'ES',
        tags: ['founder', 'proptech', 'tech', 'madrid', 'target'],
      },
    ];

    return await this.importLeads(companyId, targetClients, {
      source: 'website',
      assignRoundRobin: true,
      deduplicateBy: 'email',
      autoScore: true,
      tags: ['inmova_target_client', 'initial_batch'],
    });
  }

  /**
   * Búsquedas de LinkedIn predefinidas para INMOVA
   */
  static getINMOVALinkedInQueries() {
    return [
      {
        name: 'Property Managers Madrid',
        query: {
          keywords: 'Property Manager OR Gestor Inmobiliario',
          location: 'Madrid, España',
          title: ['Property Manager', 'Gestor de Propiedades', 'Director de Operaciones'],
        },
        targetCount: 100,
      },
      {
        name: 'Administradores de Fincas Barcelona',
        query: {
          keywords: 'Administrador de Fincas',
          location: 'Barcelona, España',
          title: ['Administrador de Fincas', 'Community Manager'],
        },
        targetCount: 100,
      },
      {
        name: 'Revenue Managers Alquileres Vacacionales',
        query: {
          keywords: 'Revenue Manager OR Vacation Rental Manager',
          location: 'España',
          title: ['Revenue Manager', 'Vacation Rental Manager', 'Channel Manager'],
        },
        targetCount: 100,
      },
      {
        name: 'Founders Proptech España',
        query: {
          keywords: 'Proptech OR Real Estate Technology',
          location: 'España',
          title: ['Founder', 'CEO', 'Co-founder'],
        },
        targetCount: 50,
      },
      {
        name: 'Coliving Operations',
        query: {
          keywords: 'Coliving OR Coworking',
          location: 'Madrid OR Barcelona',
          title: ['Operations Manager', 'Community Manager', 'Founder'],
        },
        targetCount: 50,
      },
    ];
  }
}

export default CRMLeadImporter;
