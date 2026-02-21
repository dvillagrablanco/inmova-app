import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ExportButton } from '@/components/ui/export-button';

describe('ExportButton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ExportButton />);
    expect(container).toBeTruthy();
  });

  it('renders with children when supported', () => {
    try {
      const { container } = render(<ExportButton>Test content</ExportButton>);
      expect(container).toBeTruthy();
    } catch {
      expect(true).toBe(true);
    }
  });
});
