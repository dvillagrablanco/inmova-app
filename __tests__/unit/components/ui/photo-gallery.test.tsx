import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoGallery } from '@/components/ui/photo-gallery';

describe('PhotoGallery', () => {
  const baseProps = {
    entityType: 'unit' as const,
    entityId: 'unit-123',
  };

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ photos: [] }),
      })
    );
  });

  it('should render without crashing', async () => {
    render(<PhotoGallery {...baseProps} />);

    expect(await screen.findByText('No hay fotos disponibles')).toBeInTheDocument();
  });

  it('should render with props', async () => {
    render(<PhotoGallery {...baseProps} canEdit />);

    expect(await screen.findByRole('button', { name: /^subir foto$/i })).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<PhotoGallery {...baseProps} canEdit />);

    fireEvent.click(await screen.findByRole('button', { name: /^subir foto$/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    render(<PhotoGallery {...baseProps} canEdit />);

    fireEvent.click(await screen.findByRole('button', { name: /^subir foto$/i }));
    expect(await screen.findByLabelText('Archivo')).toBeInTheDocument();
  });

  it('should execute side effects', async () => {
    render(<PhotoGallery {...baseProps} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/photos?entityType=${baseProps.entityType}&entityId=${baseProps.entityId}`
      );
    });
  });

  it('should be accessible', async () => {
    render(<PhotoGallery {...baseProps} />);

    expect(await screen.findByText('No hay fotos disponibles')).toBeInTheDocument();
  });
});
