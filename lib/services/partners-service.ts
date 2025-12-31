/**
 * Servicio de Partners Avanzado
 *
 * Gestiona funcionalidades avanzadas del programa de partners:
 * - API pública para integraciones
 * - White Label y branding personalizado
 * - Materiales de marketing
 * - Sistema de certificaciones
 * - Afiliados de nivel 2 (sub-afiliados)
 */

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-service';
import crypto from 'crypto';

// ====================================
// GESTIÓN DE API KEYS PARA PARTNERS
// ====================================

/**
 * Generar API Key para un partner
 */
export async function generatePartnerAPIKey(salesRepId: string) {
  const apiKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
  const apiSecret = `sk_${crypto.randomBytes(32).toString('hex')}`;

  const hashedSecret = crypto.createHash('sha256').update(apiSecret).digest('hex');

  await prisma.salesRepresentative.update({
    where: { id: salesRepId },
    data: {
      apiKey,
      apiSecret: hashedSecret,
      apiEnabled: true,
    },
  });

  // Solo devolver el secret esta única vez
  return {
    apiKey,
    apiSecret,
    message: 'Guarda el API Secret en un lugar seguro. No podrás verlo nuevamente.',
  };
}

/**
 * Verificar API Key de un partner
 */
export async function verifyPartnerAPIKey(apiKey: string, apiSecret: string) {
  const hashedSecret = crypto.createHash('sha256').update(apiSecret).digest('hex');

  const partner = await prisma.salesRepresentative.findFirst({
    where: {
      apiKey,
      apiSecret: hashedSecret,
      apiEnabled: true,
      activo: true,
    },
  });

  return partner;
}

/**
 * Revocar API Key de un partner
 */
export async function revokePartnerAPIKey(salesRepId: string) {
  await prisma.salesRepresentative.update({
    where: { id: salesRepId },
    data: {
      apiKey: null,
      apiSecret: null,
      apiEnabled: false,
    },
  });
}

// ====================================
// WHITE LABEL Y BRANDING
// ====================================

interface WhiteLabelConfig {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  domain?: string;
  emailFrom?: string;
  supportEmail?: string;
  supportPhone?: string;
  customCss?: string;
}

/**
 * Configurar White Label para un partner
 */
export async function configureWhiteLabel(salesRepId: string, config: WhiteLabelConfig) {
  await prisma.salesRepresentative.update({
    where: { id: salesRepId },
    data: {
      whiteLabelEnabled: true,
      whiteLabelConfig: config as any,
    },
  });

  return { success: true, message: 'Configuración de White Label guardada' };
}

/**
 * Obtener configuración de White Label de un partner
 */
export async function getWhiteLabelConfig(salesRepId: string) {
  const partner = await prisma.salesRepresentative.findUnique({
    where: { id: salesRepId },
    select: {
      whiteLabelEnabled: true,
      whiteLabelConfig: true,
    },
  });

  return partner;
}

// ====================================
// MATERIALES DE MARKETING
// ====================================

interface MarketingMaterial {
  id: string;
  tipo: 'banner' | 'email_template' | 'landing_page' | 'video' | 'documento';
  titulo: string;
  descripcion: string;
  url?: string;
  contenido?: string;
  tags: string[];
  activo: boolean;
}

/**
 * Crear material de marketing (admin)
 */
export async function createMarketingMaterial(data: {
  tipo: string;
  titulo: string;
  descripcion: string;
  url?: string;
  contenido?: string;
  tags: string[];
}) {
  return await prisma.marketingMaterial.create({
    data: {
      ...data,
      activo: true,
    },
  });
}

/**
 * Obtener materiales de marketing disponibles
 */
export async function getMarketingMaterials(tipo?: string) {
  const where: any = { activo: true };
  if (tipo) where.tipo = tipo;

  return await prisma.marketingMaterial.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Registrar descarga de material por partner
 */
export async function trackMaterialDownload(salesRepId: string, materialId: string) {
  await prisma.materialDownload.create({
    data: {
      salesRepId,
      materialId,
    },
  });
}

// ====================================
// SISTEMA DE CERTIFICACIONES
// ====================================

interface Certification {
  id: string;
  nombre: string;
  descripcion: string;
  nivel: 'basic' | 'intermedio' | 'avanzado' | 'experto';
  requisitos: string[];
  beneficios: string[];
  activo: boolean;
}

/**
 * Crear certificación (admin)
 */
export async function createCertification(data: {
  nombre: string;
  descripcion: string;
  nivel: string;
  requisitos: string[];
  beneficios: string[];
}) {
  return await prisma.partnerCertification.create({
    data: {
      ...data,
      activo: true,
    } as any,
  });
}

/**
 * Asignar certificación a un partner
 */
export async function awardCertification(salesRepId: string, certificationId: string) {
  const cert = await prisma.partnerCertification.findUnique({
    where: { id: certificationId },
  });

  if (!cert) throw new Error('Certificación no encontrada');

  const awarded = await prisma.partnerCertificationAwarded.create({
    data: {
      salesRepId,
      certificationId,
      fechaObtencion: new Date(),
      certificadoNumero: `CERT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
    },
  });

  // Enviar email de felicitación
  const partner = await prisma.salesRepresentative.findUnique({
    where: { id: salesRepId },
  });

  if (partner && partner.email) {
    await sendEmail({
      to: partner.email,
      subject: `🏆 ¡Felicitaciones! Has obtenido la certificación ${cert.nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 20px;">
            <h1 style="color: white; font-size: 36px; margin: 0;">🏆</h1>
            <h2 style="color: white; margin: 20px 0 0 0;">¡Felicitaciones!</h2>
          </div>
          
          <div style="padding: 40px 20px;">
            <p style="font-size: 18px; color: #4B5563;">Has obtenido la certificación</p>
            <h3 style="font-size: 28px; color: #4F46E5; margin: 20px 0;">${cert.nombre}</h3>
            <p style="color: #6B7280; line-height: 1.6;">${cert.descripcion}</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p><strong>Número de Certificado:</strong></p>
              <p style="font-size: 20px; color: #4F46E5; font-weight: bold; letter-spacing: 1px;">
                ${awarded.certificadoNumero}
              </p>
            </div>
            
            <p style="text-align: center; margin-top: 40px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal-comercial/certificaciones" 
                 style="background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Ver Mi Certificación
              </a>
            </p>
          </div>
        </div>
      `,
    });
  }

  return awarded;
}

/**
 * Obtener certificaciones de un partner
 */
export async function getPartnerCertifications(salesRepId: string) {
  return await prisma.partnerCertificationAwarded.findMany({
    where: { salesRepId },
    include: {
      certification: true,
    },
    orderBy: { fechaObtencion: 'desc' },
  });
}

// ====================================
// AFILIADOS NIVEL 2 (SUB-AFILIADOS)
// ====================================

/**
 * Registrar sub-afiliado (afiliado de nivel 2)
 */
export async function createSubAffiliate(data: {
  parentSalesRepId: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  password: string;
}) {
  const subAffiliate = await prisma.salesRepresentative.create({
    data: {
      ...data,
      nombreCompleto: `${data.nombre} ${data.apellidos}`,
      codigoReferido: `SUB-${data.nombre.toUpperCase()}-${Date.now()}`,
      parentSalesRepId: data.parentSalesRepId,
      nivel: 2,
      comisionCaptacion: 100.0, // Menor que nivel 1
      comisionRecurrente: 7.0, // Menor que nivel 1
      activo: false, // Requiere aprobación
      estado: 'PENDIENTE',
    } as any,
  });

  // Notificar al partner padre
  const parent = await prisma.salesRepresentative.findUnique({
    where: { id: data.parentSalesRepId },
  });

  if (parent && parent.email) {
    await sendEmail({
      to: parent.email,
      subject: 'Nuevo Sub-Afiliado Registrado',
      html: `
        <p>Se ha registrado un nuevo sub-afiliado bajo tu cuenta:</p>
        <p><strong>${data.nombre} ${data.apellidos}</strong> (${data.email})</p>
        <p>El sub-afiliado está pendiente de aprobación por parte del administrador.</p>
      `,
    });
  }

  return subAffiliate;
}

/**
 * Obtener sub-afiliados de un partner
 */
export async function getSubAffiliates(parentSalesRepId: string) {
  return await prisma.salesRepresentative.findMany({
    where: { parentSalesRepId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Calcular comisión para el partner padre por sub-afiliado
 * (Ej: 10% de las comisiones del sub-afiliado)
 */
export async function calculateParentCommission(
  subAffiliateSalesRepId: string,
  commission: number
) {
  const subAffiliate = await prisma.salesRepresentative.findUnique({
    where: { id: subAffiliateSalesRepId },
    include: { parentSalesRep: true },
  });

  if (!subAffiliate || !subAffiliate.parentSalesRepId) return null;

  const parentCommissionRate = 0.1; // 10% de las comisiones del sub-afiliado
  const parentCommission = commission * parentCommissionRate;

  // Crear comisión para el padre
  return await prisma.salesCommission.create({
    data: {
      salesRepId: subAffiliate.parentSalesRepId,
      tipo: 'NIVEL2',
      descripcion: `Comisión nivel 2 por ${subAffiliate.nombreCompleto}`,
      montoBase: commission,
      porcentaje: parentCommissionRate * 100,
      montoComision: parentCommission,
      montoNeto: parentCommission,
      estado: 'PENDIENTE',
    },
  });
}

// ====================================
// ANALYTICS AVANZADO
// ====================================

/**
 * Obtener métricas avanzadas de un partner
 */
export async function getPartnerAdvancedAnalytics(salesRepId: string, periodo?: string) {
  const partner = await prisma.salesRepresentative.findUnique({
    where: { id: salesRepId },
    include: {
      leads: {
        where: periodo
          ? {
              fechaCaptura: {
                gte: new Date(`${periodo}-01`),
                lte: new Date(
                  new Date(`${periodo}-01`).setMonth(new Date(`${periodo}-01`).getMonth() + 1)
                ),
              },
            }
          : {},
      },
      comisiones: {
        where: periodo ? { periodo } : {},
      },
      subAffiliates: true,
    },
  });

  if (!partner) throw new Error('Partner no encontrado');

  // Calcular métricas avanzadas
  const totalLeads = partner.leads.length;
  const leadsConvertidos = partner.leads.filter((l) => l.convertido).length;
  const tasaConversion = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;

  const comisionesTotales = partner.comisiones.reduce((sum, c) => sum + c.montoNeto, 0);
  const comisionesPendientes = partner.comisiones
    .filter((c) => c.estado === 'PENDIENTE')
    .reduce((sum, c) => sum + c.montoNeto, 0);

  // Métricas de sub-afiliados
  const subAffiliatesActivos = partner.subAffiliates?.filter((s) => s.activo).length || 0;
  const subAffiliatesComisiones = await prisma.salesCommission.findMany({
    where: {
      tipo: 'NIVEL2',
      salesRepId,
      ...(periodo ? { periodo } : {}),
    },
  });
  const comisionesNivel2 = subAffiliatesComisiones.reduce((sum, c) => sum + c.montoNeto, 0);

  // Distribución de leads por estado
  const leadsPorEstado = partner.leads.reduce(
    (acc, lead) => {
      acc[lead.estado] = (acc[lead.estado] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Distribución de comisiones por tipo
  const comisionesPorTipo = partner.comisiones.reduce(
    (acc, com) => {
      acc[com.tipo] = (acc[com.tipo] || 0) + com.montoNeto;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    resumen: {
      totalLeads,
      leadsConvertidos,
      tasaConversion: tasaConversion.toFixed(1),
      comisionesTotales,
      comisionesPendientes,
      subAffiliatesActivos,
      comisionesNivel2,
    },
    distribucion: {
      leadsPorEstado,
      comisionesPorTipo,
    },
  };
}

export default {
  // API Keys
  generatePartnerAPIKey,
  verifyPartnerAPIKey,
  revokePartnerAPIKey,

  // White Label
  configureWhiteLabel,
  getWhiteLabelConfig,

  // Materiales de Marketing
  createMarketingMaterial,
  getMarketingMaterials,
  trackMaterialDownload,

  // Certificaciones
  createCertification,
  awardCertification,
  getPartnerCertifications,

  // Sub-Afiliados
  createSubAffiliate,
  getSubAffiliates,
  calculateParentCommission,

  // Analytics
  getPartnerAdvancedAnalytics,
};
