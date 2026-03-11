// @ts-nocheck
/**
 * 📥 CRM Lead Importer - Importación Masiva de Leads
 *
 * CORREGIDO: Usa los campos correctos del modelo Lead (español)
 *
 * Funcionalidades:
 * - Importar desde CSV manual
 * - Deduplicación inteligente
 * - Lead scoring automático
 * - Asignación automática (round-robin)
 * - Validación de datos
 */

import { prisma } from '@/lib/db';
import { CRMService, calculateLeadScore } from './crm-service';

// ============================================================================
// TIPOS
// ============================================================================

export interface ImportLeadData {
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  empresa?: string;
  ciudad?: string;
  pais?: string;
  notas?: string;
  fuente?: string;
  urgencia?: string;
  presupuestoMensual?: number;
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
  fuente?: string;
  asignadoA?: string;
  assignRoundRobin?: boolean;
  deduplicateByEmail?: boolean;
  urgencia?: string;
}

// ============================================================================
// LEAD IMPORTER
// ============================================================================

export class CRMLeadImporter {
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
   * Importar leads desde un job de LinkedIn.
   * Retorna error controlado si la integración no está configurada.
   */
  static async importFromLinkedInJob(
    jobId: string,
    companyId: string,
    options: ImportOptions
  ): Promise<ImportResult> {
    const message = 'Importación de LinkedIn no configurada';
    return {
      success: false,
      totalProcessed: 0,
      imported: 0,
      skipped: 0,
      errors: 1,
      details: {
        imported: [],
        skipped: [],
        errors: [
          {
            name: jobId || 'LinkedIn',
            error: message,
          },
        ],
      },
    };
  }

  /**
   * Queries predefinidas de LinkedIn para INMOVA.
   */
  static getINMOVALinkedInQueries(): string[] {
    return [];
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
            name: `${leadData.nombre} ${leadData.apellidos || ''}`.trim(),
            reason: validationError,
          });
          continue;
        }

        // Verificar duplicados
        if (options.deduplicateByEmail && leadData.email) {
          const existing = await prisma.lead.findFirst({
            where: {
              companyId,
              email: leadData.email,
            },
          });

          if (existing) {
            result.skipped++;
            result.details.skipped.push({
              email: leadData.email,
              name: `${leadData.nombre} ${leadData.apellidos || ''}`.trim(),
              reason: 'Lead duplicado por email',
            });
            continue;
          }
        }

        // Determinar asignación
        let asignadoA = options.asignadoA;
        if (options.assignRoundRobin && assignableUsers.length > 0) {
          asignadoA = assignableUsers[currentUserIndex % assignableUsers.length];
          currentUserIndex++;
        }

        // Crear lead
        const lead = await CRMService.createLead({
          companyId,
          nombre: leadData.nombre,
          apellidos: leadData.apellidos,
          email: leadData.email || '',
          telefono: leadData.telefono,
          empresa: leadData.empresa,
          cargo: leadData.cargo,
          ciudad: leadData.ciudad,
          pais: leadData.pais || 'España',
          fuente: leadData.fuente || options.fuente || 'importacion',
          asignadoA,
          notas: leadData.notas,
          urgencia: leadData.urgencia || options.urgencia || 'media',
          presupuestoMensual: leadData.presupuestoMensual,
        });

        result.imported++;
        result.details.imported.push({
          email: lead.email,
          name: `${lead.nombre} ${lead.apellidos || ''}`.trim(),
          leadId: lead.id,
        });
      } catch (error: any) {
        result.errors++;
        result.details.errors.push({
          email: leadData.email,
          name: `${leadData.nombre} ${leadData.apellidos || ''}`.trim(),
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
    if (!leadData.nombre) {
      return 'Falta el nombre';
    }

    // Email es requerido para evitar duplicados
    if (!leadData.email) {
      return 'Falta el email';
    }

    // Validar email format si existe
    if (leadData.email && !this.isValidEmail(leadData.email)) {
      return 'Formato de email inválido';
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
   * Importar leads de ejemplo para INMOVA
   */
  static async importTargetClients(companyId: string): Promise<ImportResult> {
    // Clientes objetivo de INMOVA basados en el plan de negocio
    const targetClients: ImportLeadData[] = [
      // Segmento 1: Property Managers Madrid
      {
        nombre: 'María',
        apellidos: 'García',
        email: 'maria.garcia@ejemplo.es',
        cargo: 'Property Manager',
        empresa: 'Madrid Propiedades SL',
        ciudad: 'Madrid',
        pais: 'España',
        urgencia: 'media',
        fuente: 'web',
      },
      {
        nombre: 'Carlos',
        apellidos: 'Rodríguez',
        email: 'carlos.rodriguez@ejemplo.es',
        cargo: 'Director de Operaciones',
        empresa: 'Gestión Inmobiliaria Barcelona',
        ciudad: 'Barcelona',
        pais: 'España',
        urgencia: 'alta',
        fuente: 'web',
      },
      // Segmento 2: Administradores de Fincas
      {
        nombre: 'Ana',
        apellidos: 'Martínez',
        email: 'ana.martinez@ejemplo.es',
        cargo: 'Administradora de Fincas',
        empresa: 'Administraciones ABC',
        ciudad: 'Valencia',
        pais: 'España',
        urgencia: 'media',
        fuente: 'referido',
      },
      // Segmento 3: Alquileres Vacacionales
      {
        nombre: 'Jorge',
        apellidos: 'López',
        email: 'jorge.lopez@ejemplo.es',
        cargo: 'Revenue Manager',
        empresa: 'Vacation Rentals Costa del Sol',
        ciudad: 'Málaga',
        pais: 'España',
        urgencia: 'alta',
        fuente: 'landing',
      },
      {
        nombre: 'Laura',
        apellidos: 'Fernández',
        email: 'laura.fernandez@ejemplo.es',
        cargo: 'Channel Manager',
        empresa: 'Airbnb Properties Management',
        ciudad: 'Sevilla',
        pais: 'España',
        urgencia: 'media',
        fuente: 'landing',
      },
      // Segmento 4: Coliving & Coworking
      {
        nombre: 'David',
        apellidos: 'Sánchez',
        email: 'david.sanchez@ejemplo.es',
        cargo: 'Community Manager',
        empresa: 'Urban Coliving Madrid',
        ciudad: 'Madrid',
        pais: 'España',
        urgencia: 'media',
        fuente: 'chatbot',
      },
      // Fundadores Proptech
      {
        nombre: 'Elena',
        apellidos: 'Torres',
        email: 'elena.torres@ejemplo.es',
        cargo: 'CEO & Founder',
        empresa: 'PropTech Innovations',
        ciudad: 'Barcelona',
        pais: 'España',
        urgencia: 'alta',
        fuente: 'social_media',
      },
      {
        nombre: 'Miguel',
        apellidos: 'Ruiz',
        email: 'miguel.ruiz@ejemplo.es',
        cargo: 'Co-founder & CTO',
        empresa: 'Smart Buildings Tech',
        ciudad: 'Madrid',
        pais: 'España',
        urgencia: 'alta',
        fuente: 'referido',
      },
    ];

    return await this.importLeads(companyId, targetClients, {
      fuente: 'importacion',
      assignRoundRobin: true,
      deduplicateByEmail: true,
    });
  }
}

export default CRMLeadImporter;
