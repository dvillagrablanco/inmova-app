import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FilterChips } from '@/components/ui/filter-chips';
describe('FilterChips', () => {
  it('renders with no filters', () => {
    const { container } = render(<FilterChips filters={[]} onRemove={vi.fn()} onClearAll={vi.fn()} />);
    expect(container).toBeTruthy();
  });
});
