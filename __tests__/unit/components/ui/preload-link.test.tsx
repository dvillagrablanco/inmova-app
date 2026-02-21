import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PreloadLink } from '@/components/ui/preload-link';
describe('PreloadLink', () => {
  it('renders with href and children', () => {
    const { container } = render(<PreloadLink href="/test">Go</PreloadLink>);
    expect(container.textContent).toContain('Go');
  });
});
