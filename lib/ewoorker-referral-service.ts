/**
 * Servicio de Sistema de Referidos para eWoorker
 *
 * Incentiva a empresas a invitar otras empresas.
 * Recompensas cuando el referido se verifica.
 *
 * @module EwoorkerReferralService
 */

import { prisma } from './db';
import logger from './logger';
import { ewoorkerGamification } from './ewoorker-gamification-service';
import { ewoorkerNotifications } from './ewoorker-notifications-service';
import { nanoid } from 'nanoid';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

export const REFERRAL_CONFIG = {
  // Recompensa para quien refiere (cuando referido se verifica)
  REFERRER_REWARD_VERIFIED: 500, // puntos
  REFERRER_DISCOUNT_PERCENT: 10, // % descuento en próxima factura

  // Recompensa para el referido
  REFERRED_BONUS_POINTS: 200,
  REFERRED_DISCOUNT_VERIFICATION: 20, // % descuento en verificación

  // Límites
  MAX_REFERRALS_PER_MONTH: 20,
  REFERRAL_CODE_LENGTH: 8,
  REFERRAL_CODE_EXPIRY_DAYS: 90,

  // Estados
  STATUS: {
    PENDING: 'pending', // Código enviado pero no usado
    REGISTERED: 'registered', // Referido se registró
    VERIFIED: 'verified', // Referido verificado (recompensa dada)
    EXPIRED: 'expired', // Código expirado
    CANCELLED: 'cancelled', // Cancelado
  } as const,
};

export type ReferralStatus = (typeof REFERRAL_CONFIG.STATUS)[keyof typeof REFERRAL_CONFIG.STATUS];

export interface ReferralCode {
  id: string;
  code: string;
  referrerEmpresaId: string;
  referrerEmpresaNombre: string;
  referredEmail?: string;
  referredEmpresaId?: string;
  status: ReferralStatus;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  verifiedAt?: Date;
  rewardGiven: boolean;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EwoorkerReferralService {
  /**
   * Genera un código de referido único
   */
  async generateReferralCode(perfilEmpresaId: string): Promise<{
    success: boolean;
    code?: string;
    error?: string;
  }> {
    try {
      // Verificar límite mensual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const codesThisMonth = await prisma.ewoorkerReferral.count({
        where: {
          referrerEmpresaId: perfilEmpresaId,
          createdAt: { gte: startOfMonth },
        },
      });

      if (codesThisMonth >= REFERRAL_CONFIG.MAX_REFERRALS_PER_MONTH) {
        return {
          success: false,
          error: `Has alcanzado el límite de ${REFERRAL_CONFIG.MAX_REFERRALS_PER_MONTH} códigos este mes`,
        };
      }

      // Generar código único
      const code = nanoid(REFERRAL_CONFIG.REFERRAL_CODE_LENGTH).toUpperCase();

      // Calcular expiración
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + REFERRAL_CONFIG.REFERRAL_CODE_EXPIRY_DAYS);

      // Crear en BD
      await prisma.ewoorkerReferral.create({
        data: {
          code,
          referrerEmpresaId: perfilEmpresaId,
          status: REFERRAL_CONFIG.STATUS.PENDING,
          expiresAt,
        },
      });

      logger.info('[EwoorkerReferral] Código generado:', { perfilEmpresaId, code });

      return { success: true, code };
    } catch (error: any) {
      logger.error('[EwoorkerReferral] Error generando código:', error);
      return { success: false, error: 'Error generando código' };
    }
  }

  /**
   * Envía invitación por email
   */
  async sendInvitation(
    perfilEmpresaId: string,
    targetEmail: string,
    customMessage?: string
  ): Promise<{
    success: boolean;
    code?: string;
    error?: string;
  }> {
    try {
      // Generar código
      const codeResult = await this.generateReferralCode(perfilEmpresaId);
      if (!codeResult.success || !codeResult.code) {
        return { success: false, error: codeResult.error };
      }

      // Obtener info del referidor
      const referrer = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { id: perfilEmpresaId },
        include: { company: { select: { nombre: true } } },
      });

      if (!referrer) {
        return { success: false, error: 'Empresa no encontrada' };
      }

      // Actualizar referral con email destino
      await prisma.ewoorkerReferral.update({
        where: { code: codeResult.code },
        data: { referredEmail: targetEmail },
      });

      // Enviar email
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const registroUrl = `${process.env.NEXTAUTH_URL}/ewoorker/registro?ref=${codeResult.code}`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'eWoorker <noreply@ewoorker.com>',
        to: targetEmail,
        subject: `${referrer.company.nombre} te invita a eWoorker`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">🏗️ eWoorker</h1>
              <p style="margin: 5px 0;">Marketplace de Subcontratación en Construcción</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2>¡${referrer.company.nombre} te invita a unirte!</h2>
              
              ${customMessage ? `<p style="font-style: italic; color: #666;">"${customMessage}"</p>` : ''}
              
              <p>eWoorker es la plataforma donde las empresas de construcción conectan con subcontratistas verificados.</p>
              
              <div style="background: #fff; border: 2px dashed #f59e0b; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; color: #666;">Tu código de referido:</p>
                <h2 style="margin: 10px 0; color: #1e3a5f; letter-spacing: 3px;">${codeResult.code}</h2>
                <p style="margin: 0; color: #22c55e;">🎁 ${REFERRAL_CONFIG.REFERRED_DISCOUNT_VERIFICATION}% descuento en verificación</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${registroUrl}" style="background: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Registrarme Gratis
                </a>
              </div>
              
              <h3>Beneficios de eWoorker:</h3>
              <ul>
                <li>✅ Encuentra subcontratistas verificados en tu zona</li>
                <li>✅ Libro de subcontratación automático (Ley 32/2006)</li>
                <li>✅ Contratos digitales con firma electrónica</li>
                <li>✅ Gestión de pagos segura con escrow</li>
              </ul>
            </div>
            
            <div style="background: #1e3a5f; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p>Código válido por ${REFERRAL_CONFIG.REFERRAL_CODE_EXPIRY_DAYS} días</p>
              <p>© ${new Date().getFullYear()} eWoorker - Parte de Inmova</p>
            </div>
          </div>
        `,
      });

      logger.info('[EwoorkerReferral] Invitación enviada:', {
        perfilEmpresaId,
        targetEmail,
        code: codeResult.code,
      });

      return { success: true, code: codeResult.code };
    } catch (error: any) {
      logger.error('[EwoorkerReferral] Error enviando invitación:', error);
      return { success: false, error: 'Error enviando invitación' };
    }
  }

  /**
   * Valida un código de referido
   */
  async validateCode(code: string): Promise<{
    valid: boolean;
    referrerName?: string;
    discount?: number;
    error?: string;
  }> {
    try {
      const referral = await prisma.ewoorkerReferral.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          referrerEmpresa: {
            include: { company: { select: { nombre: true } } },
          },
        },
      });

      if (!referral) {
        return { valid: false, error: 'Código no encontrado' };
      }

      if (referral.status !== REFERRAL_CONFIG.STATUS.PENDING) {
        return { valid: false, error: 'Código ya utilizado o expirado' };
      }

      if (new Date() > referral.expiresAt) {
        // Marcar como expirado
        await prisma.ewoorkerReferral.update({
          where: { id: referral.id },
          data: { status: REFERRAL_CONFIG.STATUS.EXPIRED },
        });
        return { valid: false, error: 'Código expirado' };
      }

      return {
        valid: true,
        referrerName: referral.referrerEmpresa.company.nombre,
        discount: REFERRAL_CONFIG.REFERRED_DISCOUNT_VERIFICATION,
      };
    } catch (error: any) {
      logger.error('[EwoorkerReferral] Error validando código:', error);
      return { valid: false, error: 'Error validando código' };
    }
  }

  /**
   * Aplica un código de referido al registrar empresa
   */
  async applyReferralCode(
    code: string,
    newEmpresaId: string
  ): Promise<{
    success: boolean;
    discount?: number;
    bonusPoints?: number;
    error?: string;
  }> {
    try {
      const validation = await this.validateCode(code);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Actualizar referral
      await prisma.ewoorkerReferral.update({
        where: { code: code.toUpperCase() },
        data: {
          status: REFERRAL_CONFIG.STATUS.REGISTERED,
          referredEmpresaId: newEmpresaId,
          usedAt: new Date(),
        },
      });

      // Dar puntos bonus al referido
      await ewoorkerGamification.addPoints(newEmpresaId, 'COMPLETE_PROFILE', {
        referralBonus: true,
        bonusPoints: REFERRAL_CONFIG.REFERRED_BONUS_POINTS,
      });

      logger.info('[EwoorkerReferral] Código aplicado:', { code, newEmpresaId });

      return {
        success: true,
        discount: REFERRAL_CONFIG.REFERRED_DISCOUNT_VERIFICATION,
        bonusPoints: REFERRAL_CONFIG.REFERRED_BONUS_POINTS,
      };
    } catch (error: any) {
      logger.error('[EwoorkerReferral] Error aplicando código:', error);
      return { success: false, error: 'Error aplicando código' };
    }
  }

  /**
   * Procesa recompensa cuando un referido se verifica
   */
  async processVerificationReward(referredEmpresaId: string): Promise<{
    success: boolean;
    referrerRewarded: boolean;
  }> {
    try {
      // Buscar referral asociado
      const referral = await prisma.ewoorkerReferral.findFirst({
        where: {
          referredEmpresaId,
          status: REFERRAL_CONFIG.STATUS.REGISTERED,
          rewardGiven: false,
        },
        include: {
          referrerEmpresa: {
            include: { company: { select: { nombre: true, id: true } } },
          },
        },
      });

      if (!referral) {
        return { success: true, referrerRewarded: false };
      }

      // Actualizar estado
      await prisma.ewoorkerReferral.update({
        where: { id: referral.id },
        data: {
          status: REFERRAL_CONFIG.STATUS.VERIFIED,
          verifiedAt: new Date(),
          rewardGiven: true,
        },
      });

      // Recompensar al referidor
      await ewoorkerGamification.addPoints(
        referral.referrerEmpresaId,
        'REFERRED_COMPANY_VERIFIED',
        {
          referredEmpresaId,
        }
      );

      // Verificar logro de referidos
      const totalVerifiedReferrals = await prisma.ewoorkerReferral.count({
        where: {
          referrerEmpresaId: referral.referrerEmpresaId,
          status: REFERRAL_CONFIG.STATUS.VERIFIED,
        },
      });

      await ewoorkerGamification.checkAchievements(
        referral.referrerEmpresaId,
        'REFERRED_COMPANY_VERIFIED',
        totalVerifiedReferrals
      );

      // Notificar al referidor
      const users = await prisma.user.findMany({
        where: { companyId: referral.referrerEmpresa.company.id, activo: true },
        select: { id: true },
      });

      for (const user of users) {
        await ewoorkerNotifications.sendPushToUser(user.id, {
          type: 'VERIFICACION_APROBADA',
          title: '🎉 ¡Tu referido se verificó!',
          body: `Has ganado ${REFERRAL_CONFIG.REFERRER_REWARD_VERIFIED} puntos y ${REFERRAL_CONFIG.REFERRER_DISCOUNT_PERCENT}% descuento en tu próxima factura.`,
          url: '/ewoorker/perfil/referidos',
          priority: 'normal',
        });
      }

      logger.info('[EwoorkerReferral] Recompensa procesada:', {
        referrerEmpresaId: referral.referrerEmpresaId,
        referredEmpresaId,
      });

      return { success: true, referrerRewarded: true };
    } catch (error: any) {
      logger.error('[EwoorkerReferral] Error procesando recompensa:', error);
      return { success: false, referrerRewarded: false };
    }
  }

  /**
   * Obtiene estadísticas de referidos de una empresa
   */
  async getReferralStats(perfilEmpresaId: string): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    registeredReferrals: number;
    verifiedReferrals: number;
    totalPointsEarned: number;
    referralCodes: {
      code: string;
      status: ReferralStatus;
      referredEmail?: string;
      createdAt: Date;
      usedAt?: Date;
    }[];
  }> {
    try {
      const referrals = await prisma.ewoorkerReferral.findMany({
        where: { referrerEmpresaId: perfilEmpresaId },
        orderBy: { createdAt: 'desc' },
        select: {
          code: true,
          status: true,
          referredEmail: true,
          createdAt: true,
          usedAt: true,
        },
      });

      const totalReferrals = referrals.length;
      const pendingReferrals = referrals.filter(
        (r) => r.status === REFERRAL_CONFIG.STATUS.PENDING
      ).length;
      const registeredReferrals = referrals.filter(
        (r) => r.status === REFERRAL_CONFIG.STATUS.REGISTERED
      ).length;
      const verifiedReferrals = referrals.filter(
        (r) => r.status === REFERRAL_CONFIG.STATUS.VERIFIED
      ).length;

      const totalPointsEarned = verifiedReferrals * REFERRAL_CONFIG.REFERRER_REWARD_VERIFIED;

      return {
        totalReferrals,
        pendingReferrals,
        registeredReferrals,
        verifiedReferrals,
        totalPointsEarned,
        referralCodes: referrals.map((r) => ({
          code: r.code,
          status: r.status as ReferralStatus,
          referredEmail: r.referredEmail || undefined,
          createdAt: r.createdAt,
          usedAt: r.usedAt || undefined,
        })),
      };
    } catch (error: any) {
      logger.error('[EwoorkerReferral] Error obteniendo stats:', error);
      return {
        totalReferrals: 0,
        pendingReferrals: 0,
        registeredReferrals: 0,
        verifiedReferrals: 0,
        totalPointsEarned: 0,
        referralCodes: [],
      };
    }
  }

  /**
   * Obtiene el leaderboard de referidos
   */
  async getReferralLeaderboard(limit: number = 10): Promise<
    {
      rank: number;
      empresaId: string;
      empresaNombre: string;
      verifiedReferrals: number;
      totalPoints: number;
    }[]
  > {
    try {
      const results = await prisma.ewoorkerReferral.groupBy({
        by: ['referrerEmpresaId'],
        where: { status: REFERRAL_CONFIG.STATUS.VERIFIED },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      });

      const empresaIds = results.map((r) => r.referrerEmpresaId);
      const empresas = await prisma.ewoorkerPerfilEmpresa.findMany({
        where: { id: { in: empresaIds } },
        include: { company: { select: { nombre: true } } },
      });

      const empresaMap = new Map(empresas.map((e) => [e.id, e.company.nombre]));

      return results.map((r, i) => ({
        rank: i + 1,
        empresaId: r.referrerEmpresaId,
        empresaNombre: empresaMap.get(r.referrerEmpresaId) || 'Desconocido',
        verifiedReferrals: r._count.id,
        totalPoints: r._count.id * REFERRAL_CONFIG.REFERRER_REWARD_VERIFIED,
      }));
    } catch (error: any) {
      logger.error('[EwoorkerReferral] Error obteniendo leaderboard:', error);
      return [];
    }
  }
}

// Exportar instancia singleton
export const ewoorkerReferral = new EwoorkerReferralService();

export default ewoorkerReferral;
