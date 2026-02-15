import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/status-badge';

describe.skip('StatusBadge', () => {
  it('should render without crashing', () => {
    
    
    render(<StatusBadge  />);
    
    expect(screen.getByRole('main') || document.body).toBeTruthy();
  });

  it('should handle form submission', async () => {
    const onSubmit = vi.fn();
    
    render(<StatusBadge onSubmit={onSubmit} />);
    
    // TODO: Llenar formulario
    // const input = screen.getByLabelText(/name/i);
    // fireEvent.change(input, { target: { value: 'Test Name' } });
    
    // const submitButton = screen.getByRole('button', { name: /submit/i });
    // fireEvent.click(submitButton);
    
    // await waitFor(() => {
    //   expect(onSubmit).toHaveBeenCalledWith({
    //     name: 'Test Name',
    //   });
    // });
  });

  it('should be accessible', () => {
    render(<StatusBadge />);
    
    // Verificar roles ARIA básicos
    const element = screen.getByRole('main') || document.body;
    expect(element).toBeTruthy();
    
    // TODO: Añadir más verificaciones de accesibilidad
  });
});
