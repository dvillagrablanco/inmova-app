"use client";

import { useEffect } from 'react';
import { designTokens } from '@/lib/design-system';

/**
 * DesignSystemProvider
 * Aplica los design tokens como CSS variables en el documento
 * para uso consistente en toda la aplicación
 */
export function DesignSystemProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    
    // Aplicar colores primarios
    Object.entries(designTokens.colors.brand.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });
    
    // Aplicar colores secundarios
    Object.entries(designTokens.colors.brand.secondary).forEach(([key, value]) => {
      root.style.setProperty(`--color-secondary-${key}`, value);
    });
    
    // Aplicar colores semánticos
    Object.entries(designTokens.colors.semantic).forEach(([type, shades]) => {
      Object.entries(shades).forEach(([shade, value]) => {
        const varName = shade === 'DEFAULT' ? `--color-${type}` : `--color-${type}-${shade}`;
        root.style.setProperty(varName, value);
      });
    });
    
    // Aplicar colores neutrales
    Object.entries(designTokens.colors.neutral).forEach(([key, value]) => {
      root.style.setProperty(`--color-neutral-${key}`, value);
    });
    
    // Aplicar espaciado
    Object.entries(designTokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    // Aplicar sombras
    Object.entries(designTokens.shadows).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? '--shadow' : `--shadow-${key}`;
      root.style.setProperty(varName, value);
    });
    
    // Aplicar transiciones
    Object.entries(designTokens.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });
    
    // Aplicar border radius
    Object.entries(designTokens.borderRadius).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? '--radius' : `--radius-${key}`;
      root.style.setProperty(varName, value);
    });
    
    // Aplicar z-index
    Object.entries(designTokens.zIndex).forEach(([key, value]) => {
      root.style.setProperty(`--z-${key}`, value.toString());
    });
    
    // Aplicar fuentes
    root.style.setProperty('--font-sans', designTokens.typography.fontFamily.sans.join(', '));
    root.style.setProperty('--font-heading', designTokens.typography.fontFamily.heading.join(', '));
    root.style.setProperty('--font-mono', designTokens.typography.fontFamily.mono.join(', '));
  }, []);
  
  return <>{children}</>;
}
