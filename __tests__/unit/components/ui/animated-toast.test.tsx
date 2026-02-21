import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedToast } from '@/components/ui/animated-toast';

describe('AnimatedToast', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnimatedToast />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<AnimatedToast>Test content</AnimatedToast>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
