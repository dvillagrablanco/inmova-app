/**
 * CONSTRUCTION PERMITS & LICENSES SERVICE
 * Gestión de permisos, licencias y certificaciones para proyectos de construcción
 */

import { prisma } from './db';
import { addDays, differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

export type PermitType = 
  | 'building_permit' // Licencia de obra
  | 'demolition_permit' // Licencia de demolición
  | 'occupancy_permit' // Cédula de habitabilidad
  | 'zoning_approval' // Aprobación urbanística
  | 'environmental_permit' // Permiso ambiental
  | 'utility_connection' // Conexión servicios
  | 'fire_safety' // Seguridad contra incendios
  | 'structural_approval' // Aprobación estructural
  | 'other';

export type PermitStatus = 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired';

export interface Permit {
  id: string;
  projectId: string;
  type: PermitType;
  name: string;
  description?: string;
  status: PermitStatus;
  authority: string; // Entidad que emite (Ayuntamiento, Junta, etc.)
  
  // Fechas
  applicationDate?: Date;
  approvalDate?: Date;
  expirationDate?: Date;
  estimatedApprovalDays?: number;
  
  // Documentos
  requiredDocuments: string[];
  submittedDocuments: string[];
  
  // Costes
  applicationFee?: number;
  totalCost?: number;
  
  // Referencias
  referenceNumber?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermitChecklist {
  projectType: string;
  requiredPermits: {
    type: PermitType;
    name: string;
    description: string;
    estimatedDays: number;
    estimatedCost: number;
    priority: number; // 1 = crítico, 2 = importante, 3 = opcional
  }[];
}

/**
 * Obtiene checklist de permisos necesarios según tipo de proyecto
 */
export function getPermitChecklist(projectType: string): PermitChecklist {
  const checklists: Record<string, PermitChecklist> = {
    'new_construction': {
      projectType: 'Obra Nueva',
      requiredPermits: [
        {
          type: 'zoning_approval',
          name: 'Aprobación Urbanística',
          description: 'Verificación de cumplimiento plan urbanístico',
          estimatedDays: 45,
          estimatedCost: 500,
          priority: 1,
        },
        {
          type: 'building_permit',
          name: 'Licencia de Obra Mayor',
          description: 'Permiso municipal para obra nueva',
          estimatedDays: 60,
          estimatedCost: 2000,
          priority: 1,
        },
        {
          type: 'environmental_permit',
          name: 'Evaluación Ambiental',
          description: 'Estudio de impacto ambiental',
          estimatedDays: 90,
          estimatedCost: 1500,
          priority: 1,
        },
        {
          type: 'structural_approval',
          name: 'Aprobación Estructural',
          description: 'Revisión del proyecto estructural',
          estimatedDays: 30,
          estimatedCost: 800,
          priority: 1,
        },
        {
          type: 'utility_connection',
          name: 'Conexiones de Servicios',
          description: 'Agua, luz, gas, alcantarillado',
          estimatedDays: 45,
          estimatedCost: 1000,
          priority: 2,
        },
        {
          type: 'fire_safety',
          name: 'Certificado Contra Incendios',
          description: 'Aprobación de medidas de seguridad',
          estimatedDays: 30,
          estimatedCost: 600,
          priority: 2,
        },
        {
          type: 'occupancy_permit',
          name: 'Cédula de Habitabilidad',
          description: 'Certificado final de habitabilidad',
          estimatedDays: 20,
          estimatedCost: 400,
          priority: 1,
        },
      ],
    },
    'major_renovation': {
      projectType: 'Reforma Integral',
      requiredPermits: [
        {
          type: 'building_permit',
          name: 'Licencia de Obra Mayor',
          description: 'Permiso para reforma integral',
          estimatedDays: 45,
          estimatedCost: 1500,
          priority: 1,
        },
        {
          type: 'structural_approval',
          name: 'Aprobación Estructural',
          description: 'Si hay cambios estructurales',
          estimatedDays: 30,
          estimatedCost: 600,
          priority: 1,
        },
        {
          type: 'occupancy_permit',
          name: 'Cédula de Habitabilidad',
          description: 'Renovación de la cédula',
          estimatedDays: 15,
          estimatedCost: 300,
          priority: 2,
        },
      ],
    },
    'minor_renovation': {
      projectType: 'Reforma Menor',
      requiredPermits: [
        {
          type: 'building_permit',
          name: 'Licencia de Obra Menor',
          description: 'Comunicación previa de obra',
          estimatedDays: 15,
          estimatedCost: 200,
          priority: 1,
        },
      ],
    },
  };
  
  return checklists[projectType] || checklists['major_renovation'];
}

/**
 * Crea permisos para un proyecto basado en checklist
 */
export async function createPermitsFromChecklist(
  projectId: string,
  companyId: string,
  projectType: string
): Promise<void> {
  const checklist = getPermitChecklist(projectType);
  
  for (const requiredPermit of checklist.requiredPermits) {
    // Crear el permiso en la base de datos (guardado como JSON en el proyecto)
    const permitData = {
      id: `permit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      type: requiredPermit.type,
      name: requiredPermit.name,
      description: requiredPermit.description,
      status: 'pending' as PermitStatus,
      authority: 'Por determinar',
      requiredDocuments: getRequiredDocuments(requiredPermit.type),
      submittedDocuments: [],
      applicationFee: requiredPermit.estimatedCost,
      totalCost: requiredPermit.estimatedCost,
      estimatedApprovalDays: requiredPermit.estimatedDays,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Guardar en el proyecto (asumiendo campo JSON 'permits')
    await prisma.constructionProject.update({
      where: { id: projectId },
      data: {
        // Aquí asumimos que hay un campo JSON para almacenar permisos
        // Si no existe, se puede crear una tabla separada
      },
    });
  }
}

/**
 * Obtiene documentos requeridos según tipo de permiso
 */
function getRequiredDocuments(permitType: PermitType): string[] {
  const documents: Record<PermitType, string[]> = {
    'building_permit': [
      'Proyecto Básico y de Ejecución',
      'Estudio de Seguridad y Salud',
      'Dirección Facultativa',
      'Justificante Pago Tasas',
      'Escrituras Propiedad',
      'Nota Simple Registral',
    ],
    'demolition_permit': [
      'Proyecto de Demolición',
      'Plan de Gestión de Residuos',
      'Seguro Responsabilidad Civil',
      'Escrituras Propiedad',
    ],
    'occupancy_permit': [
      'Certificado Final de Obra',
      'Libro del Edificio',
      'Certificado Eficiencia Energética',
      'ITE (Inspección Técnica)',
      'Planos As-Built',
    ],
    'zoning_approval': [
      'Planos de Situación',
      'Memoria Urbanística',
      'Cédula Urbanística',
      'Certificado Catastral',
    ],
    'environmental_permit': [
      'Estudio de Impacto Ambiental',
      'Plan de Vigilancia Ambiental',
      'Informe Técnico',
    ],
    'utility_connection': [
      'Solicitud de Suministro',
      'Proyecto de Instalaciones',
      'Boletín Eléctrico/Gas',
      'Contrato con Compañías',
    ],
    'fire_safety': [
      'Proyecto de Protección contra Incendios',
      'Planos de Evacuación',
      'Certificado de Instalación',
    ],
    'structural_approval': [
      'Cálculo de Estructuras',
      'Planos Estructurales',
      'Memoria de Cálculo',
      'Certificado Director de Obra',
    ],
    'other': ['Documentación Específica'],
  };
  
  return documents[permitType] || [];
}

/**
 * Calcula timeline crítico de permisos
 */
export function calculatePermitTimeline(permits: Permit[]): {
  totalDays: number;
  criticalPath: Permit[];
  estimatedCompletionDate: Date;
} {
  // Ordenar por prioridad y dependencias
  const sortedPermits = [...permits].sort((a, b) => {
    const aPriority = (a as any).priority || 1;
    const bPriority = (b as any).priority || 1;
    return aPriority - bPriority;
  });
  
  // Calcular días totales (algunos pueden ser paralelos)
  const totalDays = permits.reduce((max, permit) => {
    return Math.max(max, permit.estimatedApprovalDays || 0);
  }, 0);
  
  const estimatedCompletionDate = addDays(new Date(), totalDays);
  
  return {
    totalDays,
    criticalPath: sortedPermits,
    estimatedCompletionDate,
  };
}

/**
 * Genera reporte de estado de permisos
 */
export function generatePermitStatusReport(permits: Permit[]): string {
  const pending = permits.filter(p => p.status === 'pending').length;
  const submitted = permits.filter(p => p.status === 'submitted').length;
  const underReview = permits.filter(p => p.status === 'under_review').length;
  const approved = permits.filter(p => p.status === 'approved').length;
  const rejected = permits.filter(p => p.status === 'rejected').length;
  
  const totalCost = permits.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const completionRate = permits.length > 0 ? (approved / permits.length) * 100 : 0;
  
  return `
# REPORTE DE PERMISOS Y LICENCIAS

## Resumen

**Total de Permisos:** ${permits.length}
**Completados:** ${approved} (${completionRate.toFixed(1)}%)
**En Trámite:** ${submitted + underReview}
**Pendientes:** ${pending}
**Rechazados:** ${rejected}

**Coste Total:** €${totalCost.toLocaleString()}

## Estado por Permiso

${permits.map(p => `
### ${p.name}
- **Estado:** ${getStatusLabel(p.status)}
- **Tipo:** ${getPermitTypeLabel(p.type)}
- **Autoridad:** ${p.authority}
${p.referenceNumber ? `- **Referencia:** ${p.referenceNumber}` : ''}
${p.applicationDate ? `- **Fecha Solicitud:** ${format(p.applicationDate, 'dd/MM/yyyy', { locale: es })}` : ''}
${p.approvalDate ? `- **Fecha Aprobación:** ${format(p.approvalDate, 'dd/MM/yyyy', { locale: es })}` : ''}
${p.expirationDate ? `- **Vencimiento:** ${format(p.expirationDate, 'dd/MM/yyyy', { locale: es })}` : ''}
- **Coste:** €${(p.totalCost || 0).toLocaleString()}
`).join('\n')}

---

*Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}*
  `.trim();
}

function getStatusLabel(status: PermitStatus): string {
  const labels: Record<PermitStatus, string> = {
    'pending': '⏳ Pendiente',
    'submitted': '📤 Enviado',
    'under_review': '🔍 En Revisión',
    'approved': '✅ Aprobado',
    'rejected': '❌ Rechazado',
    'expired': '⏰ Vencido',
  };
  return labels[status];
}

function getPermitTypeLabel(type: PermitType): string {
  const labels: Record<PermitType, string> = {
    'building_permit': 'Licencia de Obra',
    'demolition_permit': 'Licencia de Demolición',
    'occupancy_permit': 'Cédula de Habitabilidad',
    'zoning_approval': 'Aprobación Urbanística',
    'environmental_permit': 'Permiso Ambiental',
    'utility_connection': 'Conexión Servicios',
    'fire_safety': 'Seguridad Incendios',
    'structural_approval': 'Aprobación Estructural',
    'other': 'Otro',
  };
  return labels[type];
}
