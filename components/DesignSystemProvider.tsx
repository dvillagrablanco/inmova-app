'use client';

import { useEffect, ReactNode } from 'react';
import { designTokens } from '@/lib/design-system';

interface DesignSystemProviderProps {
  children: ReactNode;
}

export function DesignSystemProvider({ children }: DesignSystemProviderProps) {
  useEffect(() => {
    // ✅ FIX: Safe check for browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    
    // Apply color tokens as CSS variables
    Object.entries(designTokens.colors.brand.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });
    
    Object.entries(designTokens.colors.brand.secondary).forEach(([key, value]) => {
      root.style.setProperty(`--color-secondary-${key}`, value);
    });
    
    Object.entries(designTokens.colors.semantic.success).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? '--color-success' : `--color-success-${key}`;
      root.style.setProperty(varName, value);
    });
    
    Object.entries(designTokens.colors.semantic.error).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? '--color-error' : `--color-error-${key}`;
      root.style.setProperty(varName, value);
    });
    
    Object.entries(designTokens.colors.semantic.warning).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? '--color-warning' : `--color-warning-${key}`;
      root.style.setProperty(varName, value);
    });
    
    Object.entries(designTokens.colors.semantic.info).forEach(([key, value]) => {
      const varName = key === 'DEFAULT' ? '--color-info' : `--color-info-${key}`;
      root.style.setProperty(varName, value);
    });
    
    Object.entries(designTokens.colors.neutral).forEach(([key, value]) => {
      root.style.setProperty(`--color-neutral-${key}`, value);
    });
    
    // Apply spacing tokens
    Object.entries(designTokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    // Apply shadow tokens
    Object.entries(designTokens.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    // Apply transition tokens
    Object.entries(designTokens.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });
    
    // Apply border radius tokens
    Object.entries(designTokens.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    
    // Apply z-index tokens
    Object.entries(designTokens.zIndex).forEach(([key, value]) => {
      root.style.setProperty(`--z-${key}`, value);
    });
  }, []);
  
  return <>{children}</>;
}
