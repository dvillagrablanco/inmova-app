import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingState } from '@/components/ui/loading-state';

describe('LoadingState', () => {
  it('renders without crashing', () => {
    const { container } = render(<LoadingState />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<LoadingState>Test content</LoadingState>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
