import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';

describe('SkeletonLoader', () => {
  it('renderiza skeleton por defecto', () => {
    render(<SkeletonLoader />);

    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renderiza skeleton tipo card con count', () => {
    render(<SkeletonLoader type="card" count={2} />);

    expect(document.querySelectorAll('.rounded-lg.border.bg-card').length).toBe(2);
  });

  it('renderiza skeleton tipo text con filas', () => {
    render(<SkeletonLoader type="text" rows={4} />);

    expect(document.querySelectorAll('.animate-pulse').length).toBe(4);
  });
});
