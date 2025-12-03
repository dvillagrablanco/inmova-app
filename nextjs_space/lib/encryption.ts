import crypto from 'crypto';

// Use AES-256-GCM for encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derives a key from a password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypts data using AES-256-GCM
 * @param text - The text to encrypt
 * @param password - The password/key to use for encryption
 * @returns Encrypted string in format: salt:iv:tag:encryptedData
 */
export function encrypt(text: string, password?: string): string {
  try {
    const encryptionKey = password || process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('Encryption key not provided');
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from password
    const key = deriveKey(encryptionKey, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param encryptedData - The encrypted string (salt:iv:tag:encryptedData)
 * @param password - The password/key used for encryption
 * @returns Decrypted string
 */
export function decrypt(encryptedData: string, password?: string): string {
  try {
    const encryptionKey = password || process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('Encryption key not provided');
    }

    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, tagHex, encrypted] = parts;
    
    // Convert from hex
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    // Derive key from password
    const key = deriveKey(encryptionKey, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hashes data using SHA-256
 * @param data - The data to hash
 * @returns Hex string of the hash
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compares a plain text string with a hash
 * @param data - The plain text data
 * @param hashedData - The hashed data to compare against
 * @returns True if they match
 */
export function compareHash(data: string, hashedData: string): boolean {
  return hash(data) === hashedData;
}

/**
 * Generates a random token
 * @param length - Length of the token in bytes (will be doubled in hex)
 * @returns Random token as hex string
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypts sensitive fields in an object
 * @param data - Object with data to encrypt
 * @param fields - Array of field names to encrypt
 * @returns Object with encrypted fields
 */
export function encryptFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = encrypt(result[field] as string) as any;
    }
  }
  
  return result;
}

/**
 * Decrypts sensitive fields in an object
 * @param data - Object with encrypted data
 * @param fields - Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export function decryptFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = decrypt(result[field] as string) as any;
      } catch (error) {
        console.error(`Failed to decrypt field ${String(field)}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }
  
  return result;
}
