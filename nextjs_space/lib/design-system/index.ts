/**
 * Design System Index
 * Exporta todos los tokens y utilidades del sistema de diseño
 */

import { designTokens } from './tokens';

export { designTokens } from './tokens';
export type { DesignTokens } from './tokens';

/**
 * Función helper para acceder a colores con autocompletado
 */
export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '';
}

/**
 * Función helper para acceder a espaciado
 */
export function getSpacing(size: keyof typeof designTokens.spacing): string {
  return designTokens.spacing[size];
}

/**
 * Función helper para acceder a transiciones
 */
export function getTransition(speed: keyof typeof designTokens.transitions): string {
  return designTokens.transitions[speed];
}
