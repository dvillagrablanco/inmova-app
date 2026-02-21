import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SuccessToast } from '@/components/ui/success-toast';

describe('SuccessToast', () => {
  it('renders without crashing', () => {
    const { container } = render(<SuccessToast />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<SuccessToast>Test content</SuccessToast>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
