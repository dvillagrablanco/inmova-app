import { isValidEmail, isValidPhone } from '@/lib/utils';

export interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: Record<string, (value: any) => boolean | string>;
}

export const commonValidations = {
  required: (message: string = 'Este campo es requerido'): ValidationRule => ({
    required: message,
  }),

  email: (message: string = 'Ingrese un email válido'): ValidationRule => ({
    validate: {
      isEmail: (value: string) => isValidEmail(value) || message,
    },
  }),

  phone: (message: string = 'Ingrese un teléfono válido'): ValidationRule => ({
    validate: {
      isPhone: (value: string) => isValidPhone(value) || message,
    },
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: {
      value: length,
      message: message || `Debe tener al menos ${length} caracteres`,
    },
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: {
      value: length,
      message: message || `No debe exceder ${length} caracteres`,
    },
  }),

  min: (value: number, message?: string): ValidationRule => ({
    min: {
      value,
      message: message || `El valor mínimo es ${value}`,
    },
  }),

  max: (value: number, message?: string): ValidationRule => ({
    max: {
      value,
      message: message || `El valor máximo es ${value}`,
    },
  }),

  password: (
    minLength: number = 8,
    requireSpecial: boolean = true
  ): ValidationRule => {
    const rules: ValidationRule = {
      minLength: {
        value: minLength,
        message: `La contraseña debe tener al menos ${minLength} caracteres`,
      },
      validate: {
        hasUpperCase: (value: string) =>
          /[A-Z]/.test(value) || 'Debe contener al menos una mayúscula',
        hasLowerCase: (value: string) =>
          /[a-z]/.test(value) || 'Debe contener al menos una minúscula',
        hasNumber: (value: string) =>
          /[0-9]/.test(value) || 'Debe contener al menos un número',
      },
    };

    if (requireSpecial && rules.validate) {
      rules.validate.hasSpecial = (value: string) =>
        /[!@#$%^&*(),.?":{}|<>]/.test(value) ||
        'Debe contener al menos un carácter especial';
    }

    return rules;
  },

  url: (message: string = 'Ingrese una URL válida'): ValidationRule => ({
    pattern: {
      value: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      message,
    },
  }),

  numeric: (message: string = 'Solo se permiten números'): ValidationRule => ({
    pattern: {
      value: /^[0-9]+$/,
      message,
    },
  }),

  alphanumeric: (message: string = 'Solo se permiten letras y números'): ValidationRule => ({
    pattern: {
      value: /^[a-zA-Z0-9]+$/,
      message,
    },
  }),

  date: (message: string = 'Ingrese una fecha válida'): ValidationRule => ({
    validate: {
      isDate: (value: string) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) || message;
      },
    },
  }),

  futureDate: (message: string = 'La fecha debe ser futura'): ValidationRule => ({
    validate: {
      isFuture: (value: string) => {
        const date = new Date(value);
        return date > new Date() || message;
      },
    },
  }),

  pastDate: (message: string = 'La fecha debe ser pasada'): ValidationRule => ({
    validate: {
      isPast: (value: string) => {
        const date = new Date(value);
        return date < new Date() || message;
      },
    },
  }),

  match: (fieldName: string, message?: string): ValidationRule => ({
    validate: {
      match: (value: string) => {
        // En react-hook-form, esto se manejará con el contexto del formulario
        return message || `Debe coincidir con ${fieldName}`;
      },
    },
  }),

  custom: (validator: (value: any) => boolean | string, name: string = 'custom'): ValidationRule => ({
    validate: {
      [name]: validator,
    },
  }),
};

// Combinar múltiples reglas de validación
export function combineValidations(...validations: ValidationRule[]): ValidationRule {
  return validations.reduce(
    (acc, validation) => {
      return {
        ...acc,
        ...validation,
        validate: {
          ...acc.validate,
          ...validation.validate,
        },
      };
    },
    { validate: {} }
  );
}

// Validar manualmente un valor contra una regla
export function validateValue(value: any, rule: ValidationRule): string | true {
  // Requerido
  if (rule.required && !value) {
    return typeof rule.required === 'string' ? rule.required : 'Este campo es requerido';
  }

  // MinLength
  if (rule.minLength && value && value.length < rule.minLength.value) {
    return rule.minLength.message;
  }

  // MaxLength
  if (rule.maxLength && value && value.length > rule.maxLength.value) {
    return rule.maxLength.message;
  }

  // Min
  if (rule.min && value < rule.min.value) {
    return rule.min.message;
  }

  // Max
  if (rule.max && value > rule.max.value) {
    return rule.max.message;
  }

  // Pattern
  if (rule.pattern && value && !rule.pattern.value.test(value)) {
    return rule.pattern.message;
  }

  // Custom validations
  if (rule.validate) {
    for (const [key, validator] of Object.entries(rule.validate)) {
      const result = validator(value);
      if (result !== true) {
        return typeof result === 'string' ? result : 'Validación fallida';
      }
    }
  }

  return true;
}