/**
 * MFA Helper Functions
 * Utilidades para Multi-Factor Authentication (TOTP)
 */
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Clave de encriptación para MFA secrets
const MFA_ENCRYPTION_KEY =
  process.env.MFA_ENCRYPTION_KEY || 'inmova-mfa-secret-key-change-in-production';

/**
 * Encripta un string usando AES-256-CBC
 */
export function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc';
  // Crear key de 32 bytes desde MFA_ENCRYPTION_KEY
  const key = crypto.createHash('sha256').update(MFA_ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Retornar iv:encrypted
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta un string encriptado con AES-256-CBC
 */
export function decrypt(encryptedText: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(MFA_ENCRYPTION_KEY).digest();

    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('Formato de encriptación inválido');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[MFA] Error decrypting:', error);
    throw new Error('Error al desencriptar datos MFA');
  }
}

/**
 * Genera un nuevo secret TOTP
 * @returns Secret object con ascii, hex, base32, otpauth_url
 */
export function generateTOTPSecret(email: string, issuer: string = 'INMOVA') {
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${email})`,
    issuer,
    length: 32,
  });

  return {
    ascii: secret.ascii,
    hex: secret.hex,
    base32: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
}

/**
 * Genera QR Code como Data URL
 * @param otpauthUrl OTP Auth URL del secret
 * @returns Promise<string> Data URL del QR code
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('[MFA] Error generating QR code:', error);
    throw new Error('Error al generar QR code');
  }
}

/**
 * Verifica un código TOTP
 * @param token Código de 6 dígitos ingresado por el usuario
 * @param secret Secret base32 (encriptado o no)
 * @param encrypted Si el secret está encriptado
 * @returns boolean True si el código es válido
 */
export function verifyTOTPToken(token: string, secret: string, encrypted: boolean = true): boolean {
  try {
    const secretBase32 = encrypted ? decrypt(secret) : secret;

    const verified = speakeasy.totp.verify({
      secret: secretBase32,
      encoding: 'base32',
      token: token,
      window: 2, // Permite ± 2 intervalos de 30s (tolerancia de 60s)
    });

    return verified;
  } catch (error) {
    console.error('[MFA] Error verifying TOTP token:', error);
    return false;
  }
}

/**
 * Genera códigos de backup (recovery codes)
 * @param count Número de códigos a generar
 * @returns Array de códigos de backup (formato: XXXX-XXXX-XXXX)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generar código de 12 caracteres alfanuméricos
    const code = crypto.randomBytes(6).toString('hex').toUpperCase();
    // Formato: XXXX-XXXX-XXXX
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
    codes.push(formatted);
  }

  return codes;
}

/**
 * Hashea un código de backup para almacenamiento
 * Similar a hashear passwords - no almacenar en texto plano
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verifica un código de backup
 * @param code Código ingresado por el usuario
 * @param hashedCodes Array de códigos hasheados almacenados
 * @returns Object { valid, usedCodeIndex } o null si no es válido
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): { valid: boolean; usedCodeIndex: number } | null {
  const codeHash = hashBackupCode(code);

  const index = hashedCodes.findIndex((stored) => stored === codeHash);

  if (index !== -1) {
    return { valid: true, usedCodeIndex: index };
  }

  return null;
}

/**
 * Genera un secret, QR code y backup codes para un usuario
 * Función helper completa para setup inicial de MFA
 */
export async function generateMFASetup(email: string, issuer: string = 'INMOVA') {
  // Generar secret TOTP
  const secret = generateTOTPSecret(email, issuer);

  // Generar QR code
  const qrCode = await generateQRCode(secret.otpauth_url);

  // Generar backup codes
  const backupCodes = generateBackupCodes(10);

  // Encriptar secret para almacenamiento
  const encryptedSecret = encrypt(secret.base32);

  // Hashear backup codes para almacenamiento
  const hashedBackupCodes = backupCodes.map((code) => hashBackupCode(code));

  return {
    secret: {
      base32: secret.base32, // Para mostrar al usuario
      encrypted: encryptedSecret, // Para guardar en DB
    },
    qrCode, // Data URL
    backupCodes, // Para mostrar al usuario (UNA VEZ)
    hashedBackupCodes, // Para guardar en DB
  };
}
