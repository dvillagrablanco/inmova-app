import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedImage } from '@/components/ui/optimized-image';

describe('OptimizedImage', () => {
  it('renderiza la imagen con alt', () => {
    render(<OptimizedImage src="/test.jpg" alt="Foto de prueba" width={400} height={300} />);

    expect(screen.getByAltText('Foto de prueba')).toBeInTheDocument();
  });

  it('muestra el placeholder de carga', () => {
    render(<OptimizedImage src="/test.jpg" alt="Foto" width={400} height={300} />);

    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });
});
