import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';

describe('SkeletonLoader', () => {
  it('renderiza skeletons por defecto', () => {
    const { container } = render(<SkeletonLoader />);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renderiza skeleton de texto con numero de lineas', () => {
    const { container } = render(<SkeletonLoader type="text" rows={4} />);

    expect(container.querySelectorAll('.animate-pulse').length).toBe(4);
  });
});
