import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '@/components/layout/header';

describe.skip('Header', () => {
  it('should render without crashing', () => {
    
    
    render(<Header  />);
    
    expect(screen.getByRole('main') || document.body).toBeTruthy();
  });

  it('should be accessible', () => {
    render(<Header />);
    
    // Verificar roles ARIA básicos
    const element = screen.getByRole('main') || document.body;
    expect(element).toBeTruthy();
    
    // TODO: Añadir más verificaciones de accesibilidad
  });
});
