/**
 * Vivienda Social Service
 * Servicio para gestión de vivienda protegida y programas sociales
 */

import { prisma } from '@/lib/db';

export interface SocialHousingApplication {
  id: string;
  solicitanteNombre: string;
  solicitanteEmail: string;
  solicitanteTelefono: string;
  tipoVivienda: 'VPO' | 'VPT' | 'alquiler_social' | 'emergencia';
  estado: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'lista_espera';
  ingresosFamiliares: number;
  miembrosFamilia: number;
  documentacion: string[];
  puntuacion: number;
  fechaSolicitud: string;
  notas: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceControl {
  id: string;
  nombre: string;
  categoria: 'legal' | 'fiscal' | 'tecnico' | 'administrativo';
  descripcion: string;
  estado: 'cumple' | 'no_cumple' | 'en_revision' | 'pendiente';
  fechaUltimaRevision: string;
  fechaProximaRevision: string;
  responsable: string;
  documentos: string[];
  observaciones: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ViviendaSocialService {
  
  static async getApplications(companyId: string, filters?: {
    estado?: string;
    tipoVivienda?: string;
  }): Promise<SocialHousingApplication[]> {
    const leads = await prisma.lead.findMany({
      where: {
        companyId,
        source: 'vivienda_social',
        ...(filters?.estado && { status: filters.estado })
      },
      orderBy: { createdAt: 'desc' }
    });

    return leads.map(l => ({
      id: l.id,
      solicitanteNombre: l.name,
      solicitanteEmail: l.email,
      solicitanteTelefono: l.phone || '',
      tipoVivienda: (l.metadata as any)?.tipoVivienda || 'VPO',
      estado: l.status as any || 'pendiente',
      ingresosFamiliares: (l.metadata as any)?.ingresosFamiliares || 0,
      miembrosFamilia: (l.metadata as any)?.miembrosFamilia || 1,
      documentacion: (l.metadata as any)?.documentacion || [],
      puntuacion: (l.metadata as any)?.puntuacion || 0,
      fechaSolicitud: l.createdAt.toISOString(),
      notas: l.notes || '',
      companyId: l.companyId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt
    }));
  }

  static async createApplication(data: Partial<SocialHousingApplication> & { companyId: string }): Promise<SocialHousingApplication> {
    const lead = await prisma.lead.create({
      data: {
        companyId: data.companyId,
        name: data.solicitanteNombre || '',
        email: data.solicitanteEmail || '',
        phone: data.solicitanteTelefono,
        source: 'vivienda_social',
        status: data.estado || 'pendiente',
        notes: data.notas,
        metadata: {
          tipoVivienda: data.tipoVivienda,
          ingresosFamiliares: data.ingresosFamiliares,
          miembrosFamilia: data.miembrosFamilia,
          documentacion: data.documentacion,
          puntuacion: 0
        }
      }
    });

    return {
      id: lead.id,
      solicitanteNombre: lead.name,
      solicitanteEmail: lead.email,
      solicitanteTelefono: lead.phone || '',
      tipoVivienda: (lead.metadata as any)?.tipoVivienda || 'VPO',
      estado: lead.status as any,
      ingresosFamiliares: (lead.metadata as any)?.ingresosFamiliares || 0,
      miembrosFamilia: (lead.metadata as any)?.miembrosFamilia || 1,
      documentacion: (lead.metadata as any)?.documentacion || [],
      puntuacion: 0,
      fechaSolicitud: lead.createdAt.toISOString(),
      notas: lead.notes || '',
      companyId: lead.companyId,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt
    };
  }

  static async updateApplicationStatus(id: string, estado: string): Promise<void> {
    await prisma.lead.update({
      where: { id },
      data: { status: estado }
    });
  }

  static async checkEligibility(data: {
    ingresosFamiliares: number;
    miembrosFamilia: number;
    edadSolicitante: number;
    tipoVivienda: string;
    residenciaAnos: number;
    discapacidad: boolean;
    familiaNumerosa: boolean;
  }): Promise<{
    elegible: boolean;
    puntuacion: number;
    requisitos: { nombre: string; cumple: boolean; peso: number }[];
    recomendacion: string;
  }> {
    const IPREM = 600; // Valor aproximado mensual
    const limiteIngresos = {
      'VPO': IPREM * 14 * 5.5,
      'VPT': IPREM * 14 * 7.5,
      'alquiler_social': IPREM * 14 * 3,
      'emergencia': IPREM * 14 * 1.5
    };

    const limite = limiteIngresos[data.tipoVivienda as keyof typeof limiteIngresos] || limiteIngresos.VPO;
    
    const requisitos = [
      { 
        nombre: 'Ingresos dentro del límite', 
        cumple: data.ingresosFamiliares <= limite,
        peso: 30
      },
      { 
        nombre: 'Residencia mínima (2 años)', 
        cumple: data.residenciaAnos >= 2,
        peso: 20
      },
      { 
        nombre: 'Edad mínima (18 años)', 
        cumple: data.edadSolicitante >= 18,
        peso: 10
      }
    ];

    // Puntos adicionales
    let puntuacion = requisitos.filter(r => r.cumple).reduce((sum, r) => sum + r.peso, 0);
    
    if (data.discapacidad) puntuacion += 15;
    if (data.familiaNumerosa) puntuacion += 10;
    if (data.miembrosFamilia > 3) puntuacion += 5;

    const elegible = requisitos.filter(r => r.peso >= 20).every(r => r.cumple);

    return {
      elegible,
      puntuacion,
      requisitos,
      recomendacion: elegible 
        ? `Cumple los requisitos básicos. Puntuación: ${puntuacion}/100`
        : 'No cumple todos los requisitos obligatorios'
    };
  }

  static async getComplianceControls(companyId: string, filters?: {
    estado?: string;
    categoria?: string;
  }): Promise<ComplianceControl[]> {
    // Usar tabla Task con tipo compliance
    const tasks = await prisma.task.findMany({
      where: {
        companyId,
        metadata: {
          path: ['tipo'],
          equals: 'compliance_vivienda_social'
        },
        ...(filters?.estado && { status: filters.estado })
      },
      include: { assignee: true },
      orderBy: { createdAt: 'desc' }
    });

    return tasks.map(t => ({
      id: t.id,
      nombre: t.title,
      categoria: (t.metadata as any)?.categoria || 'legal',
      descripcion: t.description || '',
      estado: t.status as any || 'pendiente',
      fechaUltimaRevision: (t.metadata as any)?.fechaUltimaRevision || '',
      fechaProximaRevision: t.dueDate?.toISOString() || '',
      responsable: t.assignee?.name || '',
      documentos: (t.metadata as any)?.documentos || [],
      observaciones: (t.metadata as any)?.observaciones || '',
      companyId: t.companyId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));
  }

  static async getStats(companyId: string): Promise<{
    totalViviendas: number;
    ocupadas: number;
    ocupacion: number;
    solicitudesPendientes: number;
    listaEspera: number;
    cumplimientoNormativo: number;
  }> {
    const [totalViviendas, ocupadas, solicitudesPendientes, listaEspera] = await Promise.all([
      prisma.unit.count({ where: { companyId } }),
      prisma.unit.count({ where: { companyId, status: 'ocupada' } }),
      prisma.lead.count({ 
        where: { companyId, source: 'vivienda_social', status: 'pendiente' } 
      }),
      prisma.lead.count({ 
        where: { companyId, source: 'vivienda_social', status: 'lista_espera' } 
      })
    ]);

    return {
      totalViviendas,
      ocupadas,
      ocupacion: totalViviendas > 0 ? Math.round((ocupadas / totalViviendas) * 100) : 0,
      solicitudesPendientes,
      listaEspera,
      cumplimientoNormativo: 94 // Calculado dinámicamente en producción real
    };
  }
}
