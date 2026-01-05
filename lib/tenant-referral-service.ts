/**
 * Servicio de Referidos para Inquilinos B2C
 * Adaptado de ewoorker-referral-service.ts
 */
import { prisma } from '@/lib/db';
import { tenantGamification, TENANT_POINTS } from '@/lib/tenant-gamification-service';
import { customAlphabet } from 'nanoid';

// ============================================
// CONSTANTES
// ============================================

const generateCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

export const REFERRAL_CONFIG = {
  CODE_EXPIRY_DAYS: 30,
  REFERRER_REWARD_POINTS: TENANT_POINTS.REFERIR_INQUILINO, // 300 pts
  REFERRED_REWARD_POINTS: 200, // Puntos para el nuevo inquilino
  MAX_ACTIVE_REFERRALS: 10,
  VERIFIED_BONUS_POINTS: TENANT_POINTS.REFERIDO_VERIFICADO, // 500 pts extra cuando verificado
};

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  verifiedReferrals: number;
  expiredReferrals: number;
  totalPointsEarned: number;
}

export interface ReferralInvitation {
  code: string;
  referredEmail: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  verifiedAt?: Date;
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

class TenantReferralService {
  /**
   * Genera un código de referido único para un inquilino
   */
  async generateReferralCode(tenantId: string): Promise<string> {
    // Verificar límite de referidos activos
    const activeReferrals = await prisma.tenantReferral.count({
      where: {
        referrerId: tenantId,
        status: { in: ['pending', 'registered'] },
        expiresAt: { gte: new Date() },
      },
    });

    if (activeReferrals >= REFERRAL_CONFIG.MAX_ACTIVE_REFERRALS) {
      throw new Error(
        `Has alcanzado el límite de ${REFERRAL_CONFIG.MAX_ACTIVE_REFERRALS} referidos activos`
      );
    }

    // Generar código único
    let code: string;
    let isUnique = false;

    do {
      code = `INQ-${generateCode()}`;
      const existing = await prisma.tenantReferral.findUnique({
        where: { code },
      });
      isUnique = !existing;
    } while (!isUnique);

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFERRAL_CONFIG.CODE_EXPIRY_DAYS);

    // Crear el referral
    await prisma.tenantReferral.create({
      data: {
        code,
        referrerId: tenantId,
        status: 'pending',
        expiresAt,
      },
    });

    return code;
  }

  /**
   * Envía una invitación por email
   */
  async sendInvitation(
    tenantId: string,
    referredEmail: string,
    message?: string
  ): Promise<{ code: string; sent: boolean }> {
    // Verificar que el email no esté ya registrado
    const existingTenant = await prisma.tenant.findUnique({
      where: { email: referredEmail },
    });

    if (existingTenant) {
      throw new Error('Este email ya está registrado como inquilino');
    }

    // Verificar que no haya ya una invitación para este email
    const existingInvitation = await prisma.tenantReferral.findFirst({
      where: {
        referrerId: tenantId,
        referredEmail,
        status: { in: ['pending', 'registered'] },
      },
    });

    if (existingInvitation) {
      throw new Error('Ya has enviado una invitación a este email');
    }

    // Generar código
    const code = await this.generateReferralCode(tenantId);

    // Actualizar con email del referido
    await prisma.tenantReferral.update({
      where: { code },
      data: { referredEmail },
    });

    // Obtener info del referrer para el email
    const referrer = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nombreCompleto: true, email: true },
    });

    // TODO: Enviar email con nodemailer
    // Por ahora solo retornamos el código
    console.log(`[Referral] Invitación enviada a ${referredEmail} con código ${code}`);

    // Añadir puntos por referir
    try {
      await tenantGamification.addPoints(tenantId, 'REFERIR_INQUILINO', {
        referredEmail,
        code,
      });
    } catch (err) {
      console.warn('[Referral Gamification Error]:', err);
    }

    return { code, sent: true };
  }

  /**
   * Valida y usa un código de referido
   */
  async useReferralCode(
    code: string,
    newTenantId: string
  ): Promise<{
    valid: boolean;
    referrerName?: string;
    pointsAwarded?: number;
  }> {
    const referral = await prisma.tenantReferral.findUnique({
      where: { code },
      include: {
        referrer: {
          select: { id: true, nombreCompleto: true },
        },
      },
    });

    if (!referral) {
      return { valid: false };
    }

    // Verificar estado
    if (referral.status !== 'pending') {
      return { valid: false };
    }

    // Verificar expiración
    if (new Date() > referral.expiresAt) {
      await prisma.tenantReferral.update({
        where: { code },
        data: { status: 'expired' },
      });
      return { valid: false };
    }

    // Verificar que no se use el propio código
    if (referral.referrerId === newTenantId) {
      return { valid: false };
    }

    // Marcar como usado
    await prisma.tenantReferral.update({
      where: { code },
      data: {
        status: 'registered',
        referredId: newTenantId,
        usedAt: new Date(),
      },
    });

    // Dar puntos al nuevo inquilino
    try {
      await tenantGamification.addPoints(newTenantId, 'REFERIDO_VERIFICADO', {
        code,
        referrerId: referral.referrerId,
        isWelcomeBonus: true,
      });
    } catch (err) {
      console.warn('[Referral New Tenant Points Error]:', err);
    }

    return {
      valid: true,
      referrerName: referral.referrer.nombreCompleto,
      pointsAwarded: REFERRAL_CONFIG.REFERRED_REWARD_POINTS,
    };
  }

  /**
   * Verifica un referido (cuando paga primer mes, etc.)
   */
  async verifyReferral(referredTenantId: string): Promise<boolean> {
    const referral = await prisma.tenantReferral.findFirst({
      where: {
        referredId: referredTenantId,
        status: 'registered',
      },
    });

    if (!referral) {
      return false;
    }

    // Marcar como verificado
    await prisma.tenantReferral.update({
      where: { id: referral.id },
      data: {
        status: 'verified',
        verifiedAt: new Date(),
        rewardGiven: true,
      },
    });

    // Dar bonus al referrer
    try {
      await tenantGamification.addPoints(referral.referrerId, 'REFERIDO_VERIFICADO', {
        referredId: referredTenantId,
        code: referral.code,
      });
    } catch (err) {
      console.warn('[Referral Verification Points Error]:', err);
    }

    return true;
  }

  /**
   * Obtiene estadísticas de referidos de un inquilino
   */
  async getReferralStats(tenantId: string): Promise<ReferralStats> {
    const referrals = await prisma.tenantReferral.findMany({
      where: { referrerId: tenantId },
    });

    const stats: ReferralStats = {
      totalReferrals: referrals.length,
      pendingReferrals: referrals.filter((r) => r.status === 'pending').length,
      verifiedReferrals: referrals.filter((r) => r.status === 'verified').length,
      expiredReferrals: referrals.filter((r) => r.status === 'expired').length,
      totalPointsEarned: 0,
    };

    // Calcular puntos ganados
    stats.totalPointsEarned =
      referrals.filter((r) => r.status === 'registered' || r.status === 'verified').length *
        REFERRAL_CONFIG.REFERRER_REWARD_POINTS +
      stats.verifiedReferrals * REFERRAL_CONFIG.VERIFIED_BONUS_POINTS;

    return stats;
  }

  /**
   * Obtiene lista de invitaciones enviadas
   */
  async getInvitations(tenantId: string): Promise<ReferralInvitation[]> {
    const referrals = await prisma.tenantReferral.findMany({
      where: { referrerId: tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return referrals.map((r) => ({
      code: r.code,
      referredEmail: r.referredEmail || '',
      status: r.status,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      usedAt: r.usedAt || undefined,
      verifiedAt: r.verifiedAt || undefined,
    }));
  }

  /**
   * Obtiene el código de referido del inquilino (o lo crea si no existe)
   */
  async getOrCreateReferralCode(tenantId: string): Promise<string> {
    // Buscar código activo existente sin email asignado
    const existingReferral = await prisma.tenantReferral.findFirst({
      where: {
        referrerId: tenantId,
        referredEmail: null,
        status: 'pending',
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingReferral) {
      return existingReferral.code;
    }

    // Crear nuevo código
    return this.generateReferralCode(tenantId);
  }
}

export const tenantReferrals = new TenantReferralService();
