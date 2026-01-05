/**
 * Servicio de Verificación Exprés para eWoorker
 *
 * Permite a empresas pagar €29 para:
 * - Verificación prioritaria en 24h
 * - Revisión de documentos acelerada
 * - Badge de verificación inmediato
 *
 * Revenue stream adicional para socio (50%)
 *
 * @module EwoorkerVerificationService
 */

import { prisma } from './db';
import logger from './logger';
import Stripe from 'stripe';
import { EWOORKER_REVENUE_SPLIT } from './ewoorker-stripe-service';
import { ewoorkerNotifications } from './ewoorker-notifications-service';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const VERIFICATION_PRICE = 29; // €29 por verificación exprés
const VERIFICATION_PRICE_CENTS = VERIFICATION_PRICE * 100;

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

// ============================================================================
// TIPOS
// ============================================================================

export type VerificationStatus =
  | 'PENDING' // Esperando pago
  | 'PAID' // Pagado, en cola de revisión
  | 'IN_REVIEW' // En revisión por admin
  | 'APPROVED' // Aprobado
  | 'REJECTED' // Rechazado (con motivo)
  | 'REFUNDED'; // Reembolsado

export interface VerificationRequest {
  id: string;
  perfilEmpresaId: string;
  empresaNombre: string;
  status: VerificationStatus;
  tipo: 'STANDARD' | 'EXPRESS';
  monto: number;
  stripePaymentIntentId?: string;
  createdAt: Date;
  paidAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  documentosSubidos: number;
  documentosAprobados: number;
}

export interface VerificationCheckResult {
  canVerify: boolean;
  missingDocuments: string[];
  pendingDocuments: string[];
  warnings: string[];
}

// ============================================================================
// DOCUMENTOS REQUERIDOS PARA VERIFICACIÓN
// ============================================================================

const REQUIRED_DOCUMENTS = [
  { tipo: 'REA', nombre: 'Registro de Empresas Acreditadas', obligatorio: true },
  { tipo: 'SEGURO_RC', nombre: 'Seguro de Responsabilidad Civil', obligatorio: true },
  { tipo: 'CIF', nombre: 'Tarjeta CIF', obligatorio: true },
  { tipo: 'TC1', nombre: 'TC1 (Seguridad Social)', obligatorio: false },
  { tipo: 'CERTIFICADO_CORRIENTE_HACIENDA', nombre: 'Certificado Hacienda', obligatorio: false },
];

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EwoorkerVerificationService {
  /**
   * Verifica si una empresa puede solicitar verificación
   */
  async checkVerificationEligibility(perfilEmpresaId: string): Promise<VerificationCheckResult> {
    try {
      const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { id: perfilEmpresaId },
        include: {
          documentos: true,
          company: true,
        },
      });

      if (!perfil) {
        return {
          canVerify: false,
          missingDocuments: [],
          pendingDocuments: [],
          warnings: ['Perfil no encontrado'],
        };
      }

      // Ya está verificada
      if (perfil.verificado) {
        return {
          canVerify: false,
          missingDocuments: [],
          pendingDocuments: [],
          warnings: ['La empresa ya está verificada'],
        };
      }

      const missingDocuments: string[] = [];
      const pendingDocuments: string[] = [];
      const warnings: string[] = [];

      // Verificar documentos obligatorios
      for (const doc of REQUIRED_DOCUMENTS.filter((d) => d.obligatorio)) {
        const documento = perfil.documentos.find((d) => d.tipoDocumento === doc.tipo);

        if (!documento) {
          missingDocuments.push(doc.nombre);
        } else if (documento.estado === 'pendiente') {
          pendingDocuments.push(doc.nombre);
        } else if (documento.estado === 'rechazado') {
          missingDocuments.push(`${doc.nombre} (rechazado, subir nuevo)`);
        } else if (documento.fechaVencimiento && documento.fechaVencimiento < new Date()) {
          missingDocuments.push(`${doc.nombre} (vencido)`);
        }
      }

      // Verificar datos mínimos del perfil
      if (!perfil.cif) warnings.push('Falta CIF de empresa');
      if (!perfil.direccion) warnings.push('Falta dirección');
      if (!perfil.especialidadPrincipal) warnings.push('Falta especialidad principal');

      const canVerify = missingDocuments.length === 0 && warnings.length === 0;

      return {
        canVerify,
        missingDocuments,
        pendingDocuments,
        warnings,
      };
    } catch (error: any) {
      logger.error('[EwoorkerVerification] Error verificando elegibilidad:', error);
      return {
        canVerify: false,
        missingDocuments: [],
        pendingDocuments: [],
        warnings: ['Error verificando elegibilidad'],
      };
    }
  }

  /**
   * Crea una solicitud de verificación exprés con pago
   */
  async createExpressVerificationRequest(
    perfilEmpresaId: string,
    userId: string
  ): Promise<{
    success: boolean;
    requestId?: string;
    clientSecret?: string;
    error?: string;
  }> {
    try {
      if (!stripe) {
        return { success: false, error: 'Stripe no configurado' };
      }

      // Verificar elegibilidad
      const eligibility = await this.checkVerificationEligibility(perfilEmpresaId);
      if (!eligibility.canVerify) {
        return {
          success: false,
          error: `No elegible para verificación: ${eligibility.missingDocuments.join(', ')} ${eligibility.warnings.join(', ')}`,
        };
      }

      // Obtener datos de empresa
      const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { id: perfilEmpresaId },
        include: { company: true },
      });

      if (!perfil) {
        return { success: false, error: 'Perfil no encontrado' };
      }

      // Verificar que no haya solicitud pendiente
      const solicitudExistente = await prisma.ewoorkerVerificacionSolicitud.findFirst({
        where: {
          perfilEmpresaId,
          status: { in: ['PENDING', 'PAID', 'IN_REVIEW'] },
        },
      });

      if (solicitudExistente) {
        return { success: false, error: 'Ya existe una solicitud de verificación en proceso' };
      }

      // Crear PaymentIntent en Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: VERIFICATION_PRICE_CENTS,
        currency: 'eur',
        metadata: {
          type: 'ewoorker_verification',
          perfilEmpresaId,
          empresaNombre: perfil.company.nombre,
          userId,
          socioPercentage: EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE.toString(),
        },
        description: `Verificación Exprés eWoorker - ${perfil.company.nombre}`,
      });

      // Crear solicitud en BD
      const solicitud = await prisma.ewoorkerVerificacionSolicitud.create({
        data: {
          perfilEmpresaId,
          tipo: 'EXPRESS',
          status: 'PENDING',
          monto: VERIFICATION_PRICE,
          stripePaymentIntentId: paymentIntent.id,
          solicitadoPorId: userId,
        },
      });

      logger.info('[EwoorkerVerification] Solicitud creada:', {
        solicitudId: solicitud.id,
        empresa: perfil.company.nombre,
      });

      return {
        success: true,
        requestId: solicitud.id,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error: any) {
      logger.error('[EwoorkerVerification] Error creando solicitud:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirma pago y pone solicitud en cola de revisión
   */
  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      const solicitud = await prisma.ewoorkerVerificacionSolicitud.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!solicitud) {
        logger.warn(
          '[EwoorkerVerification] Solicitud no encontrada para PaymentIntent:',
          paymentIntentId
        );
        return false;
      }

      await prisma.ewoorkerVerificacionSolicitud.update({
        where: { id: solicitud.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Registrar pago para el socio
      await prisma.ewoorkerPago.create({
        data: {
          perfilEmpresaId: solicitud.perfilEmpresaId,
          tipo: 'VERIFICACION_EXPRESS',
          monto: VERIFICATION_PRICE_CENTS,
          moneda: 'EUR',
          estado: 'completado',
          stripePaymentIntentId: paymentIntentId,
          beneficioSocio: Math.round(
            (VERIFICATION_PRICE_CENTS * EWOORKER_REVENUE_SPLIT.SOCIO_PERCENTAGE) / 100
          ),
          beneficioPlataforma: Math.round(
            (VERIFICATION_PRICE_CENTS * EWOORKER_REVENUE_SPLIT.PLATAFORMA_PERCENTAGE) / 100
          ),
          descripcion: 'Verificación Exprés 24h',
        },
      });

      logger.info('[EwoorkerVerification] Pago confirmado:', solicitud.id);

      return true;
    } catch (error: any) {
      logger.error('[EwoorkerVerification] Error confirmando pago:', error);
      return false;
    }
  }

  /**
   * Procesa revisión de verificación (admin)
   */
  async processVerification(
    solicitudId: string,
    adminUserId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const solicitud = await prisma.ewoorkerVerificacionSolicitud.findUnique({
        where: { id: solicitudId },
        include: {
          perfilEmpresa: {
            include: { company: true },
          },
        },
      });

      if (!solicitud) {
        return { success: false, error: 'Solicitud no encontrada' };
      }

      if (solicitud.status !== 'PAID' && solicitud.status !== 'IN_REVIEW') {
        return { success: false, error: 'Solicitud no está en estado válido para revisión' };
      }

      if (approved) {
        // Aprobar verificación
        await prisma.$transaction([
          // Actualizar solicitud
          prisma.ewoorkerVerificacionSolicitud.update({
            where: { id: solicitudId },
            data: {
              status: 'APPROVED',
              reviewedAt: new Date(),
              reviewedById: adminUserId,
            },
          }),
          // Marcar empresa como verificada
          prisma.ewoorkerPerfilEmpresa.update({
            where: { id: solicitud.perfilEmpresaId },
            data: {
              verificado: true,
              fechaVerificacion: new Date(),
            },
          }),
        ]);

        // Notificar
        await ewoorkerNotifications.notifyVerificacionAprobada(solicitud.perfilEmpresaId);

        logger.info('[EwoorkerVerification] Verificación aprobada:', {
          solicitudId,
          empresa: solicitud.perfilEmpresa.company.nombre,
        });
      } else {
        // Rechazar verificación
        await prisma.ewoorkerVerificacionSolicitud.update({
          where: { id: solicitudId },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: adminUserId,
            rejectionReason,
          },
        });

        // TODO: Procesar reembolso si aplica

        logger.info('[EwoorkerVerification] Verificación rechazada:', {
          solicitudId,
          motivo: rejectionReason,
        });
      }

      return { success: true };
    } catch (error: any) {
      logger.error('[EwoorkerVerification] Error procesando verificación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene solicitudes pendientes de revisión (admin)
   */
  async getPendingVerifications(): Promise<VerificationRequest[]> {
    try {
      const solicitudes = await prisma.ewoorkerVerificacionSolicitud.findMany({
        where: {
          status: { in: ['PAID', 'IN_REVIEW'] },
        },
        include: {
          perfilEmpresa: {
            include: {
              company: true,
              documentos: true,
            },
          },
        },
        orderBy: [
          { tipo: 'desc' }, // EXPRESS primero
          { paidAt: 'asc' }, // Más antiguo primero
        ],
      });

      return solicitudes.map((s) => ({
        id: s.id,
        perfilEmpresaId: s.perfilEmpresaId,
        empresaNombre: s.perfilEmpresa.company.nombre,
        status: s.status as VerificationStatus,
        tipo: s.tipo as 'STANDARD' | 'EXPRESS',
        monto: s.monto,
        stripePaymentIntentId: s.stripePaymentIntentId || undefined,
        createdAt: s.createdAt,
        paidAt: s.paidAt || undefined,
        documentosSubidos: s.perfilEmpresa.documentos.length,
        documentosAprobados: s.perfilEmpresa.documentos.filter((d) => d.estado === 'aprobado')
          .length,
      }));
    } catch (error: any) {
      logger.error('[EwoorkerVerification] Error obteniendo pendientes:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de verificaciones
   */
  async getVerificationStats(): Promise<{
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    ingresosMes: number;
    beneficioSocio: number;
  }> {
    try {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const [pendientes, aprobadas, rechazadas, pagosMes] = await Promise.all([
        prisma.ewoorkerVerificacionSolicitud.count({
          where: { status: { in: ['PAID', 'IN_REVIEW'] } },
        }),
        prisma.ewoorkerVerificacionSolicitud.count({
          where: { status: 'APPROVED' },
        }),
        prisma.ewoorkerVerificacionSolicitud.count({
          where: { status: 'REJECTED' },
        }),
        prisma.ewoorkerPago.aggregate({
          where: {
            tipo: 'VERIFICACION_EXPRESS',
            estado: 'completado',
            createdAt: { gte: inicioMes },
          },
          _sum: {
            monto: true,
            beneficioSocio: true,
          },
        }),
      ]);

      return {
        pendientes,
        aprobadas,
        rechazadas,
        ingresosMes: (pagosMes._sum.monto || 0) / 100, // Convertir de céntimos
        beneficioSocio: (pagosMes._sum.beneficioSocio || 0) / 100,
      };
    } catch (error: any) {
      logger.error('[EwoorkerVerification] Error obteniendo stats:', error);
      return {
        pendientes: 0,
        aprobadas: 0,
        rechazadas: 0,
        ingresosMes: 0,
        beneficioSocio: 0,
      };
    }
  }
}

// Exportar instancia singleton
export const ewoorkerVerification = new EwoorkerVerificationService();

export default ewoorkerVerification;
