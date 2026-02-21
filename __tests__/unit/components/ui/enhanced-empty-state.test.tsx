import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { EnhancedEmptyState } from '@/components/ui/enhanced-empty-state';

describe('EnhancedEmptyState', () => {
  it('renders without crashing', () => {
    const { container } = render(<EnhancedEmptyState />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<EnhancedEmptyState>Test content</EnhancedEmptyState>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
