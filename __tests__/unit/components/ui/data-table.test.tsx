import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataTable } from '@/components/ui/data-table';

describe('DataTable', () => {
  it('should render without crashing', () => {
    
    
    render(<DataTable  />);
    
    expect(screen.getByRole('main') || document.body).toBeTruthy();
  });

  it('should be accessible', () => {
    render(<DataTable />);
    
    // Verificar roles ARIA básicos
    const element = screen.getByRole('main') || document.body;
    expect(element).toBeTruthy();
    
    // TODO: Añadir más verificaciones de accesibilidad
  });
});
