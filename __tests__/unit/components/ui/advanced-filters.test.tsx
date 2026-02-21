import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
describe('AdvancedFilters', () => {
  it('renders with required props', () => {
    const { container } = render(<AdvancedFilters filters={[]} values={{}} onChange={vi.fn()} />);
    expect(container).toBeTruthy();
  });
});
