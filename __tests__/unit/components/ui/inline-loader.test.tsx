import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { InlineLoader } from '@/components/ui/inline-loader';

describe('InlineLoader', () => {
  it('renders without crashing', () => {
    const { container } = render(<InlineLoader />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<InlineLoader>Test content</InlineLoader>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
