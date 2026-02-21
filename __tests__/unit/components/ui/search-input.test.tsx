import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SearchInput } from '@/components/ui/search-input';
describe('SearchInput', () => {
  it('renders with required props', () => {
    const { container } = render(<SearchInput value="" onChange={vi.fn()} />);
    expect(container.querySelector('input')).toBeTruthy();
  });
  it('renders with placeholder', () => {
    const { container } = render(<SearchInput value="" onChange={vi.fn()} placeholder="Search..." />);
    expect(container.querySelector('input')).toBeTruthy();
  });
});
