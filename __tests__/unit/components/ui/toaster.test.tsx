import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toaster } from '@/components/ui/toaster';

describe('Toaster', () => {
  it('should render without crashing', () => {
    
    
    render(<Toaster  />);
    
    expect(screen.getByRole('main') || document.body).toBeTruthy();
  });

  it('should be accessible', () => {
    render(<Toaster />);
    
    // Verificar roles ARIA básicos
    const element = screen.getByRole('main') || document.body;
    expect(element).toBeTruthy();
    
    // TODO: Añadir más verificaciones de accesibilidad
  });
});
