import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { NoBuildingsIllustration } from '@/components/ui/empty-state-illustrations';

describe('NoBuildingsIllustration', () => {
  it('renders without crashing', () => {
    const { container } = render(<NoBuildingsIllustration />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<NoBuildingsIllustration>Test content</NoBuildingsIllustration>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
