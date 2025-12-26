/**
 * Servicio de Encriptación AES-256-GCM
 * Utilizado para encriptar datos sensibles (PII) en la base de datos
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Obtener la clave de encriptación desde variables de entorno
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY not found in environment variables. ' +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encripta un campo de texto usando AES-256-GCM
 * @param text Texto plano a encriptar
 * @returns Texto encriptado en formato: iv:authTag:encrypted
 */
export function encryptField(text: string): string {
  if (!text) return text;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Error encrypting field:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Desencripta un campo previamente encriptado
 * @param encryptedText Texto encriptado en formato: iv:authTag:encrypted
 * @returns Texto plano desencriptado
 */
export function decryptField(encryptedText: string): string {
  if (!encryptedText) return encryptedText;

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting field:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Encripta múltiples campos de un objeto
 * @param obj Objeto con campos a encriptar
 * @param fields Array de nombres de campos a encriptar
 * @returns Nuevo objeto con campos encriptados
 */
export function encryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
  const encrypted = { ...obj };

  for (const field of fields) {
    if (obj[field] && typeof obj[field] === 'string') {
      encrypted[field] = encryptField(obj[field] as string) as T[keyof T];
    }
  }

  return encrypted;
}

/**
 * Desencripta múltiples campos de un objeto
 * @param obj Objeto con campos encriptados
 * @param fields Array de nombres de campos a desencriptar
 * @returns Nuevo objeto con campos desencriptados
 */
export function decryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
  const decrypted = { ...obj };

  for (const field of fields) {
    if (obj[field] && typeof obj[field] === 'string') {
      try {
        decrypted[field] = decryptField(obj[field] as string) as T[keyof T];
      } catch (error) {
        console.error(`Error decrypting field ${String(field)}:`, error);
        // Mantener el valor encriptado si falla la desencriptación
      }
    }
  }

  return decrypted;
}

/**
 * Genera un hash seguro usando PBKDF2
 * Usado para passwords y backup codes
 */
export function hashWithSalt(text: string, salt?: string): { hash: string; salt: string } {
  const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(text, saltBuffer, 100000, 64, 'sha512');

  return {
    hash: hash.toString('hex'),
    salt: saltBuffer.toString('hex'),
  };
}

/**
 * Verifica un hash PBKDF2
 */
export function verifyHash(text: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashWithSalt(text, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
}

/**
 * Genera códigos de respaldo aleatorios y seguros
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Formato: XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}
