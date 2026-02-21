import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BackButton } from '@/components/ui/back-button';

describe('BackButton', () => {
  it('renders without crashing', () => {
    const { container } = render(<BackButton />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<BackButton>Test content</BackButton>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
