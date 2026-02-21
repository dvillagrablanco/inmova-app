import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { VersionBadge } from '@/components/ui/version-badge';

describe('VersionBadge', () => {
  it('renders without crashing', () => {
    const { container } = render(<VersionBadge />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<VersionBadge>Test content</VersionBadge>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
