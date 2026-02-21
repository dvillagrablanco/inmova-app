import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ClientResponsiveContainer } from '@/components/ui/client-responsive-container';
describe('ClientResponsiveContainer', () => {
  it('renders children', () => {
    const { container } = render(<ClientResponsiveContainer><div>Content</div></ClientResponsiveContainer>);
    expect(container.textContent).toContain('Content');
  });
});
