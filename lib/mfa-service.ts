/**
 * Servicio de Multi-Factor Authentication (MFA)
 * Implementa TOTP (Time-based One-Time Password) y backup codes
 */

import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import {
  encryptField,
  decryptField,
  generateBackupCodes,
  hashWithSalt,
  verifyHash,
} from './encryption';
import { prisma } from './db';

const ISSUER = 'INMOVA';
const ALGORITHM = 'SHA1' as const;
const DIGITS = 6;
const PERIOD = 30; // segundos
const WINDOW = 1; // Aceptar tokens de ±30 segundos

/**
 * Configura MFA para un usuario (paso 1: generar secret y QR)
 */
export async function setupMFA(userId: string, userEmail: string) {
  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, mfaEnabled: true },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user.mfaEnabled) {
    throw new Error('MFA ya está habilitado para este usuario');
  }

  // Generar secret TOTP
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: userEmail,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret,
  });

  const secretBase32 = secret.base32;
  const otpauthURL = totp.toString();

  // Generar QR code
  const qrCode = await QRCode.toDataURL(otpauthURL);

  // Generar códigos de respaldo
  const backupCodes = generateBackupCodes(10);

  return {
    secret: secretBase32,
    qrCode,
    backupCodes,
    otpauthURL,
  };
}

/**
 * Verifica el código TOTP y activa MFA (paso 2: verificar y guardar)
 */
export async function verifyAndEnableMFA(
  userId: string,
  code: string,
  secret: string,
  backupCodes: string[]
) {
  // Verificar el código TOTP
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token: code, window: WINDOW });

  if (delta === null) {
    throw new Error('Código MFA inválido');
  }

  // Encriptar el secret
  const encryptedSecret = encryptField(secret);

  // Hashear los códigos de respaldo
  const hashedBackupCodes = backupCodes.map((code) => {
    const { hash, salt } = hashWithSalt(code.replace('-', ''));
    return `${salt}:${hash}`; // Formato: salt:hash
  });

  // Actualizar usuario en la BD
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaSecret: encryptedSecret,
      mfaBackupCodes: hashedBackupCodes,
      mfaVerifiedAt: new Date(),
      mfaRecoveryCodes: backupCodes.length,
    },
  });

  return { success: true, message: 'MFA activado correctamente' };
}

/**
 * Verifica un código TOTP durante el login
 */
export async function verifyMFACode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaSecret: true },
  });

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    throw new Error('MFA no está habilitado para este usuario');
  }

  // Desencriptar el secret
  const secret = decryptField(user.mfaSecret);

  // Verificar TOTP
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token: code, window: WINDOW });
  return delta !== null;
}

/**
 * Verifica un código de respaldo
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaBackupCodes: true, mfaRecoveryCodes: true },
  });

  if (!user || !user.mfaEnabled || !user.mfaBackupCodes || user.mfaBackupCodes.length === 0) {
    return false;
  }

  // Limpiar el código (remover guiones y espacios)
  const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();

  // Verificar contra cada código hasheado
  let usedCodeIndex = -1;
  for (let i = 0; i < user.mfaBackupCodes.length; i++) {
    const [salt, hash] = user.mfaBackupCodes[i].split(':');
    if (verifyHash(cleanCode, hash, salt)) {
      usedCodeIndex = i;
      break;
    }
  }

  if (usedCodeIndex === -1) {
    return false;
  }

  // Remover el código usado
  const updatedCodes = user.mfaBackupCodes.filter((_, index) => index !== usedCodeIndex);

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaBackupCodes: updatedCodes,
      mfaRecoveryCodes: updatedCodes.length,
    },
  });

  return true;
}

/**
 * Deshabilita MFA para un usuario
 */
export async function disableMFA(userId: string, code: string): Promise<void> {
  // Verificar el código primero
  const isValid = await verifyMFACode(userId, code);

  if (!isValid) {
    throw new Error('Código MFA inválido');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
      mfaVerifiedAt: null,
      mfaRecoveryCodes: 0,
    },
  });
}

/**
 * Regenera códigos de respaldo
 */
export async function regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
  // Verificar el código primero
  const isValid = await verifyMFACode(userId, code);

  if (!isValid) {
    throw new Error('Código MFA inválido');
  }

  // Generar nuevos códigos
  const newBackupCodes = generateBackupCodes(10);

  // Hashear los códigos
  const hashedBackupCodes = newBackupCodes.map((code) => {
    const { hash, salt } = hashWithSalt(code.replace('-', ''));
    return `${salt}:${hash}`;
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaBackupCodes: hashedBackupCodes,
      mfaRecoveryCodes: newBackupCodes.length,
    },
  });

  return newBackupCodes;
}

/**
 * Verifica el estado de MFA de un usuario
 */
export async function getMFAStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mfaEnabled: true,
      mfaVerifiedAt: true,
      mfaRecoveryCodes: true,
    },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return {
    enabled: user.mfaEnabled,
    verifiedAt: user.mfaVerifiedAt,
    recoveryCodesRemaining: user.mfaRecoveryCodes,
  };
}
