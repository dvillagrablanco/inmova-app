/**
 * Servicio de Matching IA entre Inquilinos y Proveedores
 * Usa Claude AI para encontrar el mejor proveedor según la incidencia
 */
import { prisma } from '@/lib/db';
import { CLAUDE_MODEL_FAST } from './ai-model-config';
import Anthropic from '@anthropic-ai/sdk';

import logger from '@/lib/logger';
// ============================================
// TIPOS
// ============================================

export interface IncidenceData {
  id?: string;
  tenantId: string;
  unitId?: string;
  tipo: string;
  descripcion: string;
  urgencia: 'baja' | 'media' | 'alta' | 'urgente';
  fotos?: string[];
  ubicacion?: string;
}

export interface ProviderMatchResult {
  providerId: string;
  providerName: string;
  specialty: string;
  matchScore: number; // 0-100
  reasoning: string;
  estimatedCost: { min: number; max: number };
  estimatedTime: string;
  rating: number;
  reviews: number;
  available: boolean;
  distance?: number;
}

export interface MatchingResponse {
  incidenceType: string;
  requiredSpecialty: string;
  urgencyAnalysis: string;
  topMatches: ProviderMatchResult[];
  aiRecommendation: string;
}

// ============================================
// CONSTANTES
// ============================================

const INCIDENCE_CATEGORIES: Record<string, string[]> = {
  fontaneria: ['fontanero', 'plomero', 'desatascos'],
  electricidad: ['electricista', 'instalador eléctrico'],
  climatizacion: ['técnico HVAC', 'aire acondicionado', 'calefacción'],
  cerrajeria: ['cerrajero', 'seguridad'],
  pintura: ['pintor', 'decorador'],
  limpieza: ['limpieza', 'mantenimiento'],
  jardineria: ['jardinero', 'paisajista'],
  albañileria: ['albañil', 'constructor', 'obras'],
  electrodomesticos: ['técnico electrodomésticos', 'SAT'],
  mudanzas: ['mudanzas', 'transporte'],
  otros: ['mantenimiento general'],
};

// ============================================
// SERVICIO PRINCIPAL
// ============================================

class TenantProviderMatchingService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  /**
   * Analiza una incidencia y encuentra los mejores proveedores
   */
  async matchProviders(incidence: IncidenceData): Promise<MatchingResponse> {
    // 1. Obtener información del inquilino y su ubicación
    const tenant = await prisma.tenant.findUnique({
      where: { id: incidence.tenantId },
      include: {
        units: {
          include: {
            building: true,
          },
        },
        company: true,
      },
    });

    if (!tenant) {
      throw new Error('Inquilino no encontrado');
    }

    const building = tenant.units[0]?.building;
    const city = building?.ciudad || 'Madrid';

    // 2. Determinar especialidad requerida
    const requiredSpecialty = this.determineSpecialty(incidence.tipo, incidence.descripcion);

    // 3. Buscar proveedores disponibles
    const providers = await prisma.provider.findMany({
      where: {
        companyId: tenant.companyId,
        activo: true,
        OR: [
          { especialidad: { contains: requiredSpecialty, mode: 'insensitive' } },
          { servicios: { hasSome: [requiredSpecialty.toLowerCase()] } },
        ],
      },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        availability: {
          where: {
            dayOfWeek: new Date().getDay(),
            available: true,
          },
        },
      },
    });

    // 4. Si tenemos IA, hacer matching inteligente
    let aiAnalysis: any = null;
    if (this.anthropic && providers.length > 0) {
      aiAnalysis = await this.aiMatchAnalysis(incidence, providers);
    }

    // 5. Calcular scores y ordenar
    const matches = await this.calculateMatches(providers, incidence, aiAnalysis);

    return {
      incidenceType: incidence.tipo,
      requiredSpecialty,
      urgencyAnalysis: this.analyzeUrgency(incidence.urgencia),
      topMatches: matches.slice(0, 5),
      aiRecommendation:
        aiAnalysis?.recommendation ||
        `Te recomendamos los proveedores más cercanos con mejor valoración para ${requiredSpecialty}.`,
    };
  }

  /**
   * Clasifica automáticamente una incidencia
   */
  async classifyIncidence(descripcion: string): Promise<{
    tipo: string;
    urgencia: 'baja' | 'media' | 'alta' | 'urgente';
    specialty: string;
    estimatedCost: { min: number; max: number };
  }> {
    if (!this.anthropic) {
      // Clasificación básica sin IA
      return this.basicClassification(descripcion);
    }

    const prompt = `Analiza esta descripción de una incidencia de mantenimiento en una vivienda y clasifícala.

Descripción: "${descripcion}"

Responde SOLO con un JSON válido (sin markdown):
{
  "tipo": "fontaneria|electricidad|climatizacion|cerrajeria|pintura|limpieza|jardineria|albañileria|electrodomesticos|mudanzas|otros",
  "urgencia": "baja|media|alta|urgente",
  "specialty": "especialidad requerida en español",
  "estimatedCost": {"min": número, "max": número},
  "reasoning": "breve explicación"
}

Criterios de urgencia:
- urgente: riesgo de seguridad, inundación activa, sin electricidad total
- alta: problema que impide uso normal de la vivienda
- media: inconveniente pero la vivienda es habitable
- baja: mejoras estéticas o no urgentes`;

    try {
      const message = await this.anthropic.messages.create({
        model: CLAUDE_MODEL_FAST,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
    } catch (error) {
      logger.error('[AI Classification Error]:', error);
    }

    return this.basicClassification(descripcion);
  }

  /**
   * Obtiene proveedores recomendados para una categoría
   */
  async getRecommendedProviders(
    companyId: string,
    category: string,
    limit: number = 5
  ): Promise<ProviderMatchResult[]> {
    const specialty = this.determineSpecialty(category, '');

    const providers = await prisma.provider.findMany({
      where: {
        companyId,
        activo: true,
        OR: [
          { especialidad: { contains: specialty, mode: 'insensitive' } },
          { servicios: { hasSome: [specialty.toLowerCase()] } },
        ],
      },
      include: {
        reviews: true,
      },
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return providers.map((provider) => {
      const avgRating =
        provider.reviews.length > 0
          ? provider.reviews.reduce((sum, r) => sum + r.rating, 0) / provider.reviews.length
          : 0;

      return {
        providerId: provider.id,
        providerName: provider.nombre || provider.nombreEmpresa || 'Proveedor',
        specialty: provider.especialidad || specialty,
        matchScore: Math.round(avgRating * 20), // Convert 5-star to 100
        reasoning: 'Proveedor recomendado por valoraciones',
        estimatedCost: { min: 50, max: 200 },
        estimatedTime: '24-48 horas',
        rating: avgRating,
        reviews: provider.reviews.length,
        available: true,
      };
    });
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  private determineSpecialty(tipo: string, descripcion: string): string {
    const tipoLower = tipo.toLowerCase();

    for (const [category, keywords] of Object.entries(INCIDENCE_CATEGORIES)) {
      if (tipoLower.includes(category) || keywords.some((k) => tipoLower.includes(k))) {
        return keywords[0];
      }
    }

    // Buscar en descripción
    const descLower = descripcion.toLowerCase();
    for (const [category, keywords] of Object.entries(INCIDENCE_CATEGORIES)) {
      if (keywords.some((k) => descLower.includes(k))) {
        return keywords[0];
      }
    }

    return 'mantenimiento general';
  }

  private analyzeUrgency(urgencia: string): string {
    const analyses: Record<string, string> = {
      urgente:
        '⚠️ URGENTE: Esta incidencia requiere atención inmediata. Contactaremos al proveedor disponible más cercano.',
      alta: '🔴 Prioridad Alta: Recomendamos resolver en las próximas 24 horas.',
      media: '🟡 Prioridad Media: Puede programarse para los próximos 2-3 días.',
      baja: '🟢 Prioridad Baja: Puede programarse para la próxima semana.',
    };

    return analyses[urgencia] || analyses.media;
  }

  private async aiMatchAnalysis(
    incidence: IncidenceData,
    providers: any[]
  ): Promise<{ scores: Record<string, number>; recommendation: string }> {
    if (!this.anthropic) {
      return { scores: {}, recommendation: '' };
    }

    const providersInfo = providers.map((p) => ({
      id: p.id,
      name: p.nombre || p.nombreEmpresa,
      specialty: p.especialidad,
      avgRating:
        p.reviews.length > 0
          ? (
              p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / p.reviews.length
            ).toFixed(1)
          : 'Sin valoraciones',
      reviewCount: p.reviews.length,
      available: p.availability?.length > 0,
    }));

    const prompt = `Eres un asistente de matching para servicios de mantenimiento.

INCIDENCIA:
- Tipo: ${incidence.tipo}
- Descripción: ${incidence.descripcion}
- Urgencia: ${incidence.urgencia}

PROVEEDORES DISPONIBLES:
${JSON.stringify(providersInfo, null, 2)}

Analiza y responde SOLO con JSON válido:
{
  "scores": {"providerId1": 85, "providerId2": 72, ...},
  "recommendation": "Recomendación personalizada en español (máx 100 palabras)",
  "bestMatch": "providerId del mejor match",
  "reasoning": "Por qué este proveedor es el mejor para esta incidencia"
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: CLAUDE_MODEL_FAST,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
    } catch (error) {
      logger.error('[AI Match Analysis Error]:', error);
    }

    return { scores: {}, recommendation: '' };
  }

  private async calculateMatches(
    providers: any[],
    incidence: IncidenceData,
    aiAnalysis: any
  ): Promise<ProviderMatchResult[]> {
    return providers
      .map((provider) => {
        // Calcular rating promedio
        const avgRating =
          provider.reviews.length > 0
            ? provider.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
              provider.reviews.length
            : 3;

        // Score base
        let score = avgRating * 20; // 0-100

        // Bonus por disponibilidad
        if (provider.availability?.length > 0) {
          score += 10;
        }

        // Bonus por número de reviews
        score += Math.min(provider.reviews.length, 10);

        // AI score si existe
        if (aiAnalysis?.scores?.[provider.id]) {
          score = (score + aiAnalysis.scores[provider.id]) / 2;
        }

        // Normalizar
        score = Math.min(Math.round(score), 100);

        return {
          providerId: provider.id,
          providerName: provider.nombre || provider.nombreEmpresa || 'Proveedor',
          specialty: provider.especialidad || 'General',
          matchScore: score,
          reasoning:
            aiAnalysis?.bestMatch === provider.id
              ? aiAnalysis.reasoning
              : `Valoración: ${avgRating.toFixed(1)}⭐ (${provider.reviews.length} reseñas)`,
          estimatedCost: this.estimateCost(incidence.tipo),
          estimatedTime: this.estimateTime(incidence.urgencia),
          rating: avgRating,
          reviews: provider.reviews.length,
          available: provider.availability?.length > 0,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  private estimateCost(tipo: string): { min: number; max: number } {
    const costs: Record<string, { min: number; max: number }> = {
      fontaneria: { min: 60, max: 200 },
      electricidad: { min: 50, max: 180 },
      climatizacion: { min: 80, max: 300 },
      cerrajeria: { min: 40, max: 150 },
      pintura: { min: 100, max: 500 },
      limpieza: { min: 30, max: 100 },
      jardineria: { min: 40, max: 150 },
      albañileria: { min: 150, max: 800 },
      electrodomesticos: { min: 50, max: 250 },
      mudanzas: { min: 200, max: 1000 },
    };

    return costs[tipo.toLowerCase()] || { min: 50, max: 200 };
  }

  private estimateTime(urgencia: string): string {
    const times: Record<string, string> = {
      urgente: '2-4 horas',
      alta: '24 horas',
      media: '2-3 días',
      baja: '1 semana',
    };

    return times[urgencia] || '2-3 días';
  }

  private basicClassification(descripcion: string): {
    tipo: string;
    urgencia: 'baja' | 'media' | 'alta' | 'urgente';
    specialty: string;
    estimatedCost: { min: number; max: number };
  } {
    const descLower = descripcion.toLowerCase();

    // Detectar tipo
    let tipo = 'otros';
    for (const [category, keywords] of Object.entries(INCIDENCE_CATEGORIES)) {
      if (keywords.some((k) => descLower.includes(k))) {
        tipo = category;
        break;
      }
    }

    // Detectar urgencia por palabras clave
    let urgencia: 'baja' | 'media' | 'alta' | 'urgente' = 'media';
    if (
      descLower.includes('urgente') ||
      descLower.includes('inundación') ||
      descLower.includes('peligro') ||
      descLower.includes('sin luz') ||
      descLower.includes('sin agua')
    ) {
      urgencia = 'urgente';
    } else if (descLower.includes('grave') || descLower.includes('importante')) {
      urgencia = 'alta';
    } else if (descLower.includes('menor') || descLower.includes('cosmético')) {
      urgencia = 'baja';
    }

    return {
      tipo,
      urgencia,
      specialty: this.determineSpecialty(tipo, ''),
      estimatedCost: this.estimateCost(tipo),
    };
  }
}

export const tenantProviderMatching = new TenantProviderMatchingService();
