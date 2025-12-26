/**
 * Utility functions for wizard components
 */

import { z } from 'zod';

/**
 * Validates form data against a Zod schema
 */
export async function validateWithSchema(
  data: any,
  schema: z.ZodSchema
): Promise<boolean | string> {
  try {
    await schema.parseAsync(data);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return firstError?.message || 'Error de validación';
    }
    return 'Error inesperado al validar';
  }
}

/**
 * Validates required fields
 */
export function validateRequiredFields(data: any, fields: string[]): boolean | string {
  const missingFields = fields.filter((field) => {
    const value = getNestedValue(data, field);
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return `Por favor, completa: ${missingFields.join(', ')}`;
  }

  return true;
}

/**
 * Gets nested value from object using dot notation
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Sets nested value in object using dot notation
 */
export function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
  return obj;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone format (Spanish)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+34)?[679]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validates postal code (Spanish)
 */
export function validatePostalCode(code: string): boolean {
  const postalCodeRegex = /^\d{5}$/;
  return postalCodeRegex.test(code);
}

/**
 * Debounce function for async validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), wait);
    });
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Check if all steps are completed
 */
export function areAllStepsCompleted(
  stepsData: Record<string, any>,
  requiredSteps: string[]
): boolean {
  return requiredSteps.every((step) => {
    const data = stepsData[step];
    return data && Object.values(data).some((value) => value !== '' && value !== null);
  });
}
