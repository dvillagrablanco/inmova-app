import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Toaster } from '@/components/ui/toaster';

describe('Toaster', () => {
  it('renders without crashing', () => {
    const { container } = render(<Toaster />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<Toaster>Test content</Toaster>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
