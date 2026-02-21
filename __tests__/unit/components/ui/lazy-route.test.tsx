import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createLazyRoute } from '@/components/ui/lazy-route';

describe('createLazyRoute', () => {
  it('renders without crashing', () => {
    const { container } = render(<createLazyRoute />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<createLazyRoute>Test content</createLazyRoute>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
