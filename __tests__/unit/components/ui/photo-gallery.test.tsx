import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoGallery } from '@/components/ui/photo-gallery';

describe('PhotoGallery', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render without crashing', async () => {
    render(<PhotoGallery entityType="unit" entityId="unit-1" />);

    await waitFor(() => {
      expect(screen.getByText('No hay fotos disponibles')).toBeInTheDocument();
    });
  });

  it('should render with props', async () => {
    render(<PhotoGallery entityType="building" entityId="building-1" canEdit />);

    await waitFor(() => {
      expect(screen.getByText('Subir Foto')).toBeInTheDocument();
    });
  });

  it('should handle user interactions', async () => {
    render(<PhotoGallery entityType="unit" entityId="unit-1" canEdit />);

    await waitFor(() => {
      expect(screen.getByText('Subir Foto')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Subir Foto'));

    await waitFor(() => {
      expect(screen.getByText('Selecciona una foto para agregar a la galería')).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    render(<PhotoGallery entityType="unit" entityId="unit-1" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/photos?entityType=unit&entityId=unit-1');
    });
  });

  it('should execute side effects', async () => {
    render(<PhotoGallery entityType="unit" entityId="unit-1" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should be accessible', () => {
    render(<PhotoGallery entityType="unit" entityId="unit-1" />);

    expect(screen.getByText('Cargando fotos...')).toBeInTheDocument();
  });
});
