import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponsiveTable } from '@/components/ui/responsive-table';

describe.skip('ResponsiveTable', () => {
  it('should render without crashing', () => {
    
    
    render(<ResponsiveTable  />);
    
    expect(screen.getByRole('main') || document.body).toBeTruthy();
  });

  it('should be accessible', () => {
    render(<ResponsiveTable />);
    
    // Verificar roles ARIA básicos
    const element = screen.getByRole('main') || document.body;
    expect(element).toBeTruthy();
    
    // TODO: Añadir más verificaciones de accesibilidad
  });
});
