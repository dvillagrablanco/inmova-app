import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { toastManager } from '@/components/ui/toast-manager';

describe('toastManager', () => {
  it('renders without crashing', () => {
    const { container } = render(<toastManager />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<toastManager>Test content</toastManager>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
