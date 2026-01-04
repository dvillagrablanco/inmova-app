/**
 * Servicio de Encriptación
 * 
 * Encripta/desencripta credenciales sensibles antes de guardarlas en la BD.
 * Usa AES-256-CBC para máxima seguridad.
 * 
 * @module lib/encryption
 */

import crypto from 'crypto';

// Clave de encriptación (32 bytes para AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const IV_LENGTH = 16; // Para AES, siempre 16 bytes

/**
 * Verifica si la encriptación está configurada
 */
export function isEncryptionConfigured(): boolean {
  return ENCRYPTION_KEY.length === 64; // 32 bytes en hex = 64 caracteres
}

/**
 * Genera una clave de encriptación aleatoria
 * Útil para setup inicial
 * 
 * @returns Clave hex de 64 caracteres (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encripta un texto
 * 
 * @param text - Texto a encriptar
 * @returns Texto encriptado en formato "iv:encryptedData" (hex)
 * 
 * @example
 * const encrypted = encrypt('mi-api-key-secreta');
 * // "3f2a1b....:a8b9c7...."
 */
export function encrypt(text: string): string {
  if (!isEncryptionConfigured()) {
    throw new Error('ENCRYPTION_KEY not configured. Generate one with generateEncryptionKey()');
  }

  // Generar IV aleatorio (initialization vector)
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Crear cipher
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  // Encriptar
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Retornar IV + encrypted (separados por :)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Desencripta un texto
 * 
 * @param encryptedText - Texto encriptado en formato "iv:encryptedData"
 * @returns Texto desencriptado
 * 
 * @example
 * const decrypted = decrypt('3f2a1b....:a8b9c7....');
 * // "mi-api-key-secreta"
 */
export function decrypt(encryptedText: string): string {
  if (!isEncryptionConfigured()) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  // Separar IV y encrypted data
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');

  // Crear decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  // Desencriptar
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encripta un objeto completo
 * Útil para guardar configuraciones
 * 
 * @param obj - Objeto a encriptar
 * @returns Objeto encriptado (JSON stringified y encriptado)
 */
export function encryptObject(obj: any): string {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * Desencripta un objeto
 * 
 * @param encryptedText - Texto encriptado
 * @returns Objeto desencriptado
 */
export function decryptObject(encryptedText: string): any {
  const json = decrypt(encryptedText);
  return JSON.parse(json);
}

/**
 * Hash de una contraseña (one-way)
 * Para comparar contraseñas sin almacenarlas en claro
 * 
 * @param password - Contraseña a hashear
 * @returns Hash SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verifica si un texto está encriptado
 * Detecta el formato "iv:encryptedData"
 * 
 * @param text - Texto a verificar
 * @returns true si parece encriptado
 */
export function isEncrypted(text: string): boolean {
  // Formato debe ser hex:hex con longitudes apropiadas
  const parts = text.split(':');
  if (parts.length !== 2) return false;
  
  // IV debe ser 32 caracteres hex (16 bytes)
  if (parts[0].length !== 32) return false;
  
  // Data debe ser hex (longitud par)
  if (parts[1].length % 2 !== 0) return false;
  
  // Verificar que sean hex válidos
  const hexRegex = /^[0-9a-f]+$/i;
  return hexRegex.test(parts[0]) && hexRegex.test(parts[1]);
}

/**
 * Encripta solo si no está encriptado
 * Útil para migraciones o actualizaciones
 * 
 * @param text - Texto a encriptar
 * @returns Texto encriptado
 */
export function encryptIfNotEncrypted(text: string): string {
  if (isEncrypted(text)) {
    return text;
  }
  return encrypt(text);
}

/**
 * Desencripta solo si está encriptado
 * Útil para compatibilidad con datos legacy
 * 
 * @param text - Texto a desencriptar
 * @returns Texto desencriptado
 */
export function decryptIfEncrypted(text: string): string {
  if (!isEncrypted(text)) {
    return text;
  }
  return decrypt(text);
}
