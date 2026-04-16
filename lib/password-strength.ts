/**
 * Validación de Fortaleza de Contraseñas
 * Utiliza zxcvbn para evaluar la seguridad de las contraseñas
 */

import zxcvbn from 'zxcvbn';

export interface PasswordStrengthResult {
  score: number; // 0-4 (0=muy débil, 4=muy fuerte)
  valid: boolean;
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTimeDisplay: string | number;
}

const MIN_PASSWORD_LENGTH = 12;
const MIN_SCORE = 3; // Mínimo "fuerte"

/**
 * Evaluar la fortaleza de una contraseña
 */
export function evaluatePasswordStrength(
  password: string,
  userInputs: string[] = []
): PasswordStrengthResult {
  // Validaciones básicas
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      score: 0,
      valid: false,
      feedback: {
        warning: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
        suggestions: ['Usa una contraseña más larga'],
      },
      crackTimeDisplay: 'instant',
    };
  }

  // Evaluar con zxcvbn
  const result = zxcvbn(password, userInputs);

  return {
    score: result.score,
    valid: result.score >= MIN_SCORE,
    feedback: {
      warning: result.feedback.warning || '',
      suggestions: result.feedback.suggestions || [],
    },
    crackTimeDisplay: result.crack_times_display.offline_slow_hashing_1e4_per_second,
  };
}

/**
 * Validar política de contraseñas empresarial
 */
export function validatePasswordPolicy(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Longitud mínima
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  // Longitud máxima (prevenir DoS)
  if (password.length > 128) {
    errors.push('Máximo 128 caracteres');
  }

  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }

  // Al menos una minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }

  // Al menos un número
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }

  // Al menos un carácter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  }

  // No debe contener secuencias comunes
  const commonSequences = ['123456', 'abcdef', 'qwerty', 'password', 'admin'];
  const lowerPassword = password.toLowerCase();
  for (const sequence of commonSequences) {
    if (lowerPassword.includes(sequence)) {
      errors.push(`No debe contener secuencias comunes como "${sequence}"`);
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generar una contraseña segura aleatoria.
 * Usa crypto.getRandomValues (WebCrypto) — Math.random no es adecuado para
 * generar credenciales, es predecible y puede reutilizar seed.
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;

  const pickSecure = (alphabet: string): string => {
    const max = Math.floor(0xffff / alphabet.length) * alphabet.length;
    const buf = new Uint16Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      if (buf[0] < max) return alphabet[buf[0] % alphabet.length];
    }
  };

  const chars: string[] = [
    pickSecure(uppercase),
    pickSecure(lowercase),
    pickSecure(numbers),
    pickSecure(special),
  ];
  for (let i = chars.length; i < length; i++) {
    chars.push(pickSecure(all));
  }

  // Fisher-Yates shuffle criptográficamente seguro.
  for (let i = chars.length - 1; i > 0; i--) {
    const rand = new Uint32Array(1);
    crypto.getRandomValues(rand);
    const j = rand[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

/**
 * Verificar si una contraseña está en la lista de contraseñas comprometidas
 * (Implementación básica - en producción usar HaveIBeenPwned API)
 */
export async function checkCompromisedPassword(password: string): Promise<boolean> {
  // Lista local de contraseñas comunes (top 100)
  const commonPasswords = [
    '123456', 'password', '123456789', '12345678', '12345', '1234567', '1234567890',
    'qwerty', 'abc123', '111111', '123123', 'admin', 'letmein', 'welcome', 'monkey',
    'password1', '123', 'dragon', 'master', 'sunshine', 'princess', 'login', 'admin123',
    'solo', 'passw0rd', 'starwars', 'summer', 'football', 'batman', 'trustno1',
  ];

  const lowerPassword = password.toLowerCase();
  return commonPasswords.includes(lowerPassword);
}
