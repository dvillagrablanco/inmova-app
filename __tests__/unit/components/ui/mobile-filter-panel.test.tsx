import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MobileFilterPanel } from '@/components/ui/mobile-filter-panel';
describe('MobileFilterPanel', () => {
  it('renders with required props', () => {
    const { container } = render(<MobileFilterPanel filters={[]} activeFilters={[]} onFilterChange={vi.fn()} />);
    expect(container).toBeTruthy();
  });
});
