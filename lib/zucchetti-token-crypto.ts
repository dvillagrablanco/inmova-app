import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getEncryptionKey(): string {
  const key = process.env.ZUCCHETTI_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!key) {
    throw new Error('ZUCCHETTI_ENCRYPTION_KEY no configurado');
  }
  return key;
}

function getKeyBuffer(): Buffer {
  const key = getEncryptionKey();
  return Buffer.from(key.padEnd(32, '0').slice(0, 32));
}

export function encryptZucchettiToken(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = getKeyBuffer();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptZucchettiToken(text: string): string {
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = getKeyBuffer();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return text;
  }
}
