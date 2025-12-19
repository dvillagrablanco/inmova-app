/**
 * Validadores de formularios reutilizables
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  success?: string;
}

/**
 * Valida que un campo no esté vacío
 */
export function validateRequired(value: any, fieldName: string = 'Campo'): ValidationResult {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, error: `${fieldName} es obligatorio` };
  }
  return { valid: true };
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'El email es obligatorio' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'El formato del email no es válido' };
  }

  return { valid: true, success: 'Email válido' };
}

/**
 * Valida teléfono español
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { valid: false, error: 'El teléfono es obligatorio' };
  }

  // Eliminar espacios y guiones
  const cleaned = phone.replace(/[\s-]/g, '');

  // Formato español: +34 o 9 dígitos o 6/7 para móviles
  const phoneRegex = /^(\+34)?[6-9]\d{8}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      valid: false,
      error: 'El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9',
    };
  }

  return { valid: true, success: 'Teléfono válido' };
}

/**
 * Valida DNI/NIE español
 */
export function validateDNI(dni: string): ValidationResult {
  if (!dni) {
    return { valid: false, error: 'El DNI/NIE es obligatorio' };
  }

  const dniRegex = /^[XYZ]?\d{7,8}[A-Z]$/i;
  if (!dniRegex.test(dni.toUpperCase())) {
    return { valid: false, error: 'Formato de DNI/NIE no válido' };
  }

  // Validar letra del DNI
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const dniUpper = dni.toUpperCase();
  let number;

  if (/^[XYZ]/.test(dniUpper)) {
    // NIE
    const niePrefix = dniUpper.charAt(0);
    const nieNumber = dniUpper.substring(1, dniUpper.length - 1);
    const prefix = niePrefix === 'X' ? '0' : niePrefix === 'Y' ? '1' : '2';
    number = parseInt(prefix + nieNumber);
  } else {
    // DNI
    number = parseInt(dniUpper.substring(0, dniUpper.length - 1));
  }

  const expectedLetter = letters[number % 23];
  const providedLetter = dniUpper.charAt(dniUpper.length - 1);

  if (expectedLetter !== providedLetter) {
    return { valid: false, error: 'La letra del DNI/NIE no es correcta' };
  }

  return { valid: true, success: 'DNI/NIE válido' };
}

/**
 * Valida contraseña segura
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'La contraseña es obligatoria' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return {
      valid: false,
      error: 'La contraseña debe contener mayúsculas, minúsculas y números',
    };
  }

  return { valid: true, success: 'Contraseña segura' };
}

/**
 * Valida que dos contraseñas coincidan
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return { valid: false, error: 'Debes confirmar la contraseña' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Las contraseñas no coinciden' };
  }

  return { valid: true, success: 'Las contraseñas coinciden' };
}

/**
 * Valida número positivo
 */
export function validatePositiveNumber(
  value: any,
  fieldName: string = 'Valor'
): ValidationResult {
  if (!value && value !== 0) {
    return { valid: false, error: `${fieldName} es obligatorio` };
  }

  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return { valid: false, error: `${fieldName} debe ser un número positivo` };
  }

  return { valid: true };
}

/**
 * Valida rango numérico
 */
export function validateRange(
  value: any,
  min: number,
  max: number,
  fieldName: string = 'Valor'
): ValidationResult {
  if (!value && value !== 0) {
    return { valid: false, error: `${fieldName} es obligatorio` };
  }

  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} debe ser un número` };
  }

  if (num < min || num > max) {
    return { valid: false, error: `${fieldName} debe estar entre ${min} y ${max}` };
  }

  return { valid: true };
}

/**
 * Valida fecha
 */
export function validateDate(date: string, fieldName: string = 'Fecha'): ValidationResult {
  if (!date) {
    return { valid: false, error: `${fieldName} es obligatoria` };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `${fieldName} no es válida` };
  }

  return { valid: true };
}

/**
 * Valida que una fecha sea futura
 */
export function validateFutureDate(date: string, fieldName: string = 'Fecha'): ValidationResult {
  const basicValidation = validateDate(date, fieldName);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateObj < today) {
    return { valid: false, error: `${fieldName} debe ser futura` };
  }

  return { valid: true };
}

/**
 * Valida URL
 */
export function validateURL(url: string): ValidationResult {
  if (!url) {
    return { valid: false, error: 'La URL es obligatoria' };
  }

  try {
    new URL(url);
    return { valid: true, success: 'URL válida' };
  } catch {
    return { valid: false, error: 'La URL no es válida' };
  }
}

/**
 * Valida longitud de texto
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Campo'
): ValidationResult {
  if (!value) {
    return { valid: false, error: `${fieldName} es obligatorio` };
  }

  const length = value.length;
  if (length < min) {
    return { valid: false, error: `${fieldName} debe tener al menos ${min} caracteres` };
  }

  if (length > max) {
    return { valid: false, error: `${fieldName} no puede tener más de ${max} caracteres` };
  }

  return { valid: true };
}
